import { expect, test } from 'vitest';
import { loadBotModel, isBotModel } from '../gamey/BotModelLoader';

test('loads the trained bot model', async () => {
    const model = await loadBotModel(
        new URL('../training/bot-model.json', import.meta.url),
    );

    expect(model.version).toBeGreaterThan(0);
    expect(isBotModel(model)).toBe(true);
});

test('rejects malformed bot models', () => {
    expect(isBotModel({ version: 1 })).toBe(false);
    expect(isBotModel({
        version: 1,
        adjacentOwnPiece: Number.NaN,
        reachNewSide: 20,
        connectGroups: 30,
        isolatedPiecePenalty: 15,
    })).toBe(false);
});
