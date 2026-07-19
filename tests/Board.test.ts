import { expect, test } from 'vitest';
import { Board, MoveResult } from '../gamey/Board';

// Use `npm run test`

test('test multiple piece placement', () => {
    const empty_board = new Board(8);

    expect(empty_board.placePiece(0, 0, 'white')).toBe(MoveResult.SUCCESS);
    expect(empty_board.placePiece(0, 0, 'white')).toBe(MoveResult.OCCUPIED);
    expect(empty_board.placePiece(1, 0, 'white')).toBe(MoveResult.SUCCESS);
    expect(empty_board.placePiece(1, 0, 'black')).toBe(MoveResult.OCCUPIED);
    expect(empty_board.placePiece(1, 1, 'black')).toBe(MoveResult.SUCCESS);
    expect(empty_board.placePiece(1, 1, 'white')).toBe(MoveResult.OCCUPIED);
    expect(empty_board.placePiece(2, 0, 'black')).toBe(MoveResult.SUCCESS);
    expect(empty_board.placePiece(2, 0, 'white')).toBe(MoveResult.OCCUPIED);
});

test('test game winning 1', () => {
    const empty_board = new Board(8);
    empty_board.placePiece(0, 0, 'white');
    empty_board.placePiece(1, 0, 'white');
    empty_board.placePiece(2, 1, 'white');
    empty_board.placePiece(3, 1, 'white');
    empty_board.placePiece(4, 2, 'white');
    empty_board.placePiece(5, 2, 'white');
    empty_board.placePiece(6, 3, 'white');
    expect(empty_board.placePiece(7, 3, 'white')).toBe(MoveResult.VICTORY);
});

test('test game winning 2', () => {
    const empty_board = new Board(8);
    empty_board.placePiece(0, 0, 'white');
    empty_board.placePiece(1, 0, 'white');
    empty_board.placePiece(2, 1, 'white');
    empty_board.placePiece(3, 1, 'white');
    empty_board.placePiece(5, 2, 'white');
    empty_board.placePiece(6, 3, 'white');
    empty_board.placePiece(7, 3, 'white');
    expect(empty_board.placePiece(4, 2, 'white')).toBe(MoveResult.VICTORY);
});

test('test game winning 3', () => {
    const empty_board = new Board(8);
    empty_board.placePiece(0, 0, 'white');
    empty_board.placePiece(1, 0, 'white');
    empty_board.placePiece(2, 1, 'white');
    empty_board.placePiece(3, 1, 'black');
    empty_board.placePiece(3, 2, 'black');
    empty_board.placePiece(4, 2, 'white');
    empty_board.placePiece(5, 2, 'white');
    empty_board.placePiece(6, 3, 'white');
    empty_board.placePiece(7, 3, 'white');
    expect(empty_board.placePiece(3, 1, 'white')).toBe(MoveResult.OCCUPIED);
});

test('test game winning 4', () => {
    const empty_board = new Board(8);
    empty_board.placePiece(3, 0, 'white'); // 'A'
    empty_board.placePiece(3, 1, 'white');
    empty_board.placePiece(4, 4, 'white'); // 'B'
    empty_board.placePiece(4, 3, 'white');
    empty_board.placePiece(7, 4, 'white'); // 'C'
    empty_board.placePiece(6, 3, 'white');
    empty_board.placePiece(5, 2, 'white');
    expect(empty_board.placePiece(4, 2, 'white')).toBe(MoveResult.VICTORY);
});
