import { copyFileSync, writeFileSync } from 'node:fs';
import type { BotModel } from '../gamey/BotModel';
import type { QModel } from './QModel';
import { loadBotModel } from '../gamey/BotModelLoader';
import { ReplayBuffer } from './ReplayBuffer';
import { loadExperiences, writeExperiences } from './ExperienceStore';
import { loadQModel } from './QModelLoader';
import { trainFromExperience } from './QTrainer';
import { playGame } from './selfPlay';
import type { Experience } from './Experience';
import { evaluateQModel } from './evaluate';

const botModelPath = new URL('../training/bot-model.json', import.meta.url);
const qModelPath = new URL('./q-model.json', import.meta.url);
const previousQModelPath = new URL('./q-model.previous.json', import.meta.url);
const selfPlayBoardSizes = [6, 8, 10];
const selfPlayGamesPerBoardSize = 25;
const minimumExperiencesForPromotion = 500;
const maxQValues = 50_000;
const initialExplorationRate = 0.2;
const minimumExplorationRate = 0.02;
const explorationDecay = 0.995;

function cloneQModel(model: QModel): QModel {
    return {
        ...model,
        values: { ...model.values },
        featureValues: model.featureValues ? { ...model.featureValues } : {},
    };
}

function isImprovement(candidate: ReturnType<typeof evaluateQModel>, previous: ReturnType<typeof evaluateQModel>): boolean {
    return candidate.winRate > previous.winRate &&
        Object.keys(candidate.byBoardSize).every((boardSize) =>
            candidate.byBoardSize[Number(boardSize)] >= previous.byBoardSize[Number(boardSize)]
        );
}

function pruneValues(values: Record<string, number>): Record<string, number> {
    return Object.fromEntries(
        Object.entries(values)
            .sort(([, first], [, second]) => Math.abs(second) - Math.abs(first))
            .slice(0, maxQValues),
    );
}

async function train() {
    const botModel: BotModel = await loadBotModel(botModelPath);
    const qModel = await loadQModel(qModelPath);
    const previousQModel = cloneQModel(qModel);
    const replayBuffer = new ReplayBuffer();
    replayBuffer.addMany(await loadExperiences());
    console.log(`Loaded ${replayBuffer.size} training experiences.`);

    const generatedExperiences: Experience[] = [];
    const explorationRate = Math.max(
        minimumExplorationRate,
        initialExplorationRate * Math.pow(explorationDecay, qModel.version),
    );
    const explorationQModel = {
        ...qModel,
        explorationRate,
    };
    console.log(`Self-play exploration rate: ${explorationRate.toFixed(3)}.`);
    for (const boardSize of selfPlayBoardSizes) {
        for (let game = 0; game < selfPlayGamesPerBoardSize; game++) {
            playGame(
                boardSize,
                botModel,
                botModel,
                1_000_000 + boardSize * 10_000 + game,
                (experience) => generatedExperiences.push(experience),
                explorationQModel,
            );
        }
    }

    await writeExperiences([
        ...(await loadExperiences()),
        ...generatedExperiences,
    ]);
    replayBuffer.addMany(generatedExperiences);
    console.log(`Generated ${generatedExperiences.length} self-play experiences.`);

    if (replayBuffer.size < minimumExperiencesForPromotion) {
        console.log(
            `Skipped Q-model promotion: ${replayBuffer.size}/${minimumExperiencesForPromotion} experiences available.`,
        );
        return;
    }

    const trainingRounds = Math.min(100, Math.ceil(replayBuffer.size / 32));
    for (let round = 0; round < trainingRounds; round++) {
        replayBuffer.sample(32).forEach((experience) => trainFromExperience(qModel, experience));
    }
    qModel.values = pruneValues(qModel.values);
    if (qModel.featureValues) qModel.featureValues = pruneValues(qModel.featureValues);
    const evaluation = evaluateQModel(botModel, qModel);
    const previousEvaluation = evaluateQModel(botModel, previousQModel);
    console.log(
        `Q-model evaluation: ${(evaluation.winRate * 100).toFixed(1)}% overall ` +
        `(${(evaluation.firstPlayerWinRate * 100).toFixed(1)}% first, ` +
        `${(evaluation.secondPlayerWinRate * 100).toFixed(1)}% second; ` +
        `6=${(evaluation.byBoardSize[6] * 100).toFixed(1)}%, ` +
        `8=${(evaluation.byBoardSize[8] * 100).toFixed(1)}%, ` +
        `10=${(evaluation.byBoardSize[10] * 100).toFixed(1)}%)`,
    );
    if (isImprovement(evaluation, previousEvaluation)) {
        qModel.version = previousQModel.version + 1;
        qModel.trainingExperiences = replayBuffer.size;
        qModel.lastTrainedAt = new Date().toISOString();
        qModel.evaluation = {
            winRate: evaluation.winRate,
            firstPlayerWinRate: evaluation.firstPlayerWinRate,
            secondPlayerWinRate: evaluation.secondPlayerWinRate,
            byBoardSize: evaluation.byBoardSize,
        };
        copyFileSync(qModelPath, previousQModelPath);
        writeFileSync(qModelPath, JSON.stringify(qModel, null, 2));
        console.log(`Promoted Q-model version ${qModel.version}.`);
        console.log(`Previous Q-model saved to ${previousQModelPath.pathname}.`);
    } else {
        console.log('Rejected Q-model candidate because it did not improve every board size.');
    }
}

void train().catch((error: unknown) => {
    console.error('Bot training failed:', error);
    process.exitCode = 1;
});