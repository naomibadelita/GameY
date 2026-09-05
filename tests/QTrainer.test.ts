import { expect, test } from 'vitest';
import { trainFromExperience } from '../training/QTrainer';
import type { QModel } from '../training/QModel';

test('Q-learning updates a terminal winning action toward its reward', () => {
    const model: QModel = {
        version: 1,
        learningRate: 0.1,
        discountFactor: 0.95,
        explorationRate: 0,
        values: {},
    };

    trainFromExperience(model, {
        board: '.',
        boardSize: 2,
        botColor: 'R',
        move: { row: 0, column: 0 },
        reward: 1,
        nextBoard: 'R...',
        terminal: true,
    });

    expect(Object.values(model.values)[0]).toBeCloseTo(0.1);
});

test('Q-learning stores a generalized feature value without the action coordinate', () => {
    const model: QModel = {
        version: 1,
        learningRate: 0.1,
        discountFactor: 0.95,
        explorationRate: 0,
        values: {},
        featureValues: {},
    };

    trainFromExperience(model, {
        board: '.'.repeat(21),
        boardSize: 6,
        botColor: 'R',
        move: { row: 0, column: 0 },
        reward: 0.02,
        nextBoard: 'R' + '.'.repeat(20),
        terminal: false,
    });

    expect(Object.keys(model.featureValues ?? {})).toHaveLength(1);
    expect(Object.keys(model.featureValues ?? {})[0]).not.toContain(':0,0');
});