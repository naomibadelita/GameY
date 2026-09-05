import { expect, test } from 'vitest';
import { Board } from '../gamey/Board';
import { GameBot } from '../gamey/GameBot';

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

test('chooses an immediate winning move', () => {
    const bot = new GameBot();
    const move = bot.chooseMove(createAlmostWinningBoard('R'), 'R', 'B');

    expect(move).toEqual({ row: 7, column: 3 });
});

test('blocks an immediate player winning move', () => {
    const bot = new GameBot();
    const move = bot.chooseMove(createAlmostWinningBoard('B'), 'R', 'B');

    expect(move).toEqual({ row: 7, column: 3 });
});

test('chooses an empty cell', () => {
    const board = new Board(6);
    const bot = new GameBot();
    const move = bot.chooseMove(board, 'R', 'B');

    expect(move).not.toBeNull();
    expect(board.rows[move!.row][move!.column].color).toBe('.');
});