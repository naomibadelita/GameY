import { readFile } from 'node:fs/promises';
import { defaultQModel, type QModel } from './QModel';

export async function loadQModel(path: URL | string): Promise<QModel> {
    try {
        const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));
        if (!isQModel(parsed)) {
            throw new Error('Invalid Q-learning model file');
        }
        return parsed;
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
                return { ...defaultQModel, values: {}, featureValues: {} };
        }
        throw error;
    }
}

function isQModel(value: unknown): value is QModel {
    if (!value || typeof value !== 'object') return false;
    const model = value as Record<string, unknown>;
    if (
        !Number.isInteger(model.version) ||
        typeof model.learningRate !== 'number' ||
        typeof model.discountFactor !== 'number' ||
        typeof model.explorationRate !== 'number' ||
        !model.values || typeof model.values !== 'object'
    ) return false;

    return [model.learningRate, model.discountFactor, model.explorationRate]
        .every((item) => Number.isFinite(item) && (item as number) >= 0);
}