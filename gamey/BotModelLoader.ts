import { readFile } from 'node:fs/promises';
import type { BotModel } from './BotModel';

export async function loadBotModel(path: URL | string): Promise<BotModel> {
    const raw = await readFile(path, 'utf8');
    const parsed: unknown = JSON.parse(raw);

    if (!isBotModel(parsed)) {
        throw new Error('Invalid bot model file');
    }

    return parsed;
}

export function isBotModel(value: unknown): value is BotModel {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const model = value as Record<string, unknown>;

    return (
        Number.isInteger(model.version) &&
        typeof model.adjacentOwnPiece === 'number' &&
        typeof model.reachNewSide === 'number' &&
        typeof model.connectGroups === 'number' &&
        typeof model.isolatedPiecePenalty === 'number' &&
        Object.values(model)
            .filter((item) => typeof item === 'number')
            .every((item) => Number.isFinite(item))
    );
}