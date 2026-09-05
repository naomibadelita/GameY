import { expect, test } from 'vitest';
import { Board } from '../gamey/Board';
import { getMoveFeatureKey } from '../training/Features';

test('feature keys describe move context without exact coordinates', () => {
    const board = new Board(6);
    const firstKey = getMoveFeatureKey(board, { row: 1, column: 0 }, 'R', 'B');
    const secondKey = getMoveFeatureKey(board, { row: 2, column: 0 }, 'R', 'B');

    expect(firstKey).not.toContain('1,0');
    expect(secondKey).not.toContain('2,0');
});