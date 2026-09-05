import type { BotModel } from '../gamey/BotModel';
import type { QModel } from './QModel';
import { playGame } from './selfPlay';

export interface QEvaluationResult {
    games: number;
    wins: number;
    winRate: number;
    firstPlayerWinRate: number;
    secondPlayerWinRate: number;
    byBoardSize: Record<number, number>;
}

type EvaluationStats = {
    wins: number;
    firstPlayerWins: number;
    firstPlayerGames: number;
    secondPlayerWins: number;
    secondPlayerGames: number;
};

function playEvaluationGame(
    boardSize: number,
    botModel: BotModel,
    candidate: QModel,
    game: number,
): { candidateIsFirst: boolean; candidateWon: boolean } {
    const candidateIsFirst = game % 2 === 0;
    const seed = 2_000_000 + boardSize * 10_000 + game;
    const winner = candidateIsFirst
        ? playGame(boardSize, botModel, botModel, seed, () => undefined, candidate, null)
        : playGame(boardSize, botModel, botModel, seed, () => undefined, null, candidate);

    return {
        candidateIsFirst,
        candidateWon: candidateIsFirst ? winner === 'B' : winner === 'R',
    };
}

function recordGame(stats: EvaluationStats, candidateIsFirst: boolean, candidateWon: boolean): void {
    if (candidateIsFirst) {
        stats.firstPlayerGames++;
        if (candidateWon) stats.firstPlayerWins++;
    } else {
        stats.secondPlayerGames++;
        if (candidateWon) stats.secondPlayerWins++;
    }
    if (candidateWon) stats.wins++;
}

export function evaluateQModel(
    botModel: BotModel,
    candidate: QModel,
    gamesPerBoardSize = 50,
    boardSizes = [6, 8, 10],
): QEvaluationResult {
    const stats: EvaluationStats = {
        wins: 0,
        firstPlayerWins: 0,
        firstPlayerGames: 0,
        secondPlayerWins: 0,
        secondPlayerGames: 0,
    };
    const byBoardSize: Record<number, number> = {};

    for (const boardSize of boardSizes) {
        let boardWins = 0;
        for (let game = 0; game < gamesPerBoardSize; game++) {
            const result = playEvaluationGame(boardSize, botModel, candidate, game);
            recordGame(stats, result.candidateIsFirst, result.candidateWon);
            if (result.candidateWon) boardWins++;
        }
        byBoardSize[boardSize] = boardWins / gamesPerBoardSize;
    }

    const games = gamesPerBoardSize * boardSizes.length;
    return {
        games,
        wins: stats.wins,
        winRate: stats.wins / games,
        firstPlayerWinRate: stats.firstPlayerWins / stats.firstPlayerGames,
        secondPlayerWinRate: stats.secondPlayerWins / stats.secondPlayerGames,
        byBoardSize,
    };
}