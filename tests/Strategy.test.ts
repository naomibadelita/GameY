import { expect, test } from 'vitest';
import { Board } from '../gamey/Board';
import { RandomBot } from '../gamey/RandomBot';
import { SearchBot } from '../gamey/SearchBot';

function createAlmostWinningBoard(color: string): Board {
    const board = new Board(8);
    board.placePiece(0, 0, color);
    board.placePiece(1, 0, color);
    board.placePiece(2, 1, color);
    board.placePiece(3, 1, color);
    board.placePiece(4, 2, color);
    board.placePiece(5, 2, color);
    board.placePiece(6, 3, color);
    return board;
}

test('hard strategy chooses an immediate winning move', () => {
    const move = new SearchBot().chooseMove(createAlmostWinningBoard('R'), 'R', 'B');

    expect(move).toEqual({ row: 7, column: 3 });
});

test('hard strategy blocks an immediate player win', () => {
    const move = new SearchBot().chooseMove(createAlmostWinningBoard('B'), 'R', 'B');

    expect(move).toEqual({ row: 7, column: 3 });
});

test('easy strategy chooses a legal empty move', () => {
    const board = new Board(6);
    const move = new RandomBot().chooseMove(board, 'R', 'B');

    expect(move).not.toBeNull();
    expect(board.rows[move!.row][move!.column].color).toBe('.');
});