import { Board, MoveResult } from '../gamey/Board';
import type { BotMove } from '../gamey/MoveStrategy';

export function calculateMoveReward(
    boardBefore: Board,
    boardAfter: Board,
    move: BotMove,
    botColor: string,
    opponentColor: string,
): number {
    const reachedSides = boardAfter.rows[move.row][move.column].sides.size;
    const previousSides = boardBefore.rows[move.row][move.column].sides.size;

    if (boardAfter.rows[move.row][move.column].color === botColor && reachedSides >= 3) {
        return 1;
    }

    if (hasWinningMove(boardBefore, opponentColor) && !hasWinningMove(boardAfter, opponentColor)) {
        return 0.05;
    }

    return reachedSides > previousSides ? 0.02 : -0.01;
}

function hasWinningMove(board: Board, color: string): boolean {
    for (let row = 0; row < board.size; row++) {
        for (let column = 0; column <= row; column++) {
            if (board.rows[row][column].color !== '.') continue;
            const copy = copyBoard(board);
            if (copy.placePiece(row, column, color) === MoveResult.VICTORY) return true;
        }
    }
    return false;
}

function copyBoard(board: Board): Board {
    const copy = new Board(board.size);
    for (let row = 0; row < board.size; row++) {
        for (let column = 0; column <= row; column++) {
            const color = board.rows[row][column].color;
            if (color !== '.') copy.placePiece(row, column, color);
        }
    }
    return copy;
}
