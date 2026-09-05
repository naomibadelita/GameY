import { Board } from '../gamey/Board';
import type { BotMove } from '../gamey/MoveStrategy';

export function getMoveFeatureKey(
    board: Board,
    move: BotMove,
    botColor: string,
    opponentColor: string,
): string {
    const node = board.rows[move.row][move.column];
    const ownNeighbors = node.neighbors.filter((neighbor) => neighbor.color === botColor).length;
    const opponentNeighbors = node.neighbors.filter((neighbor) => neighbor.color === opponentColor).length;
    const simulated = copyBoard(board);
    simulated.placePiece(move.row, move.column, botColor);
    const reachedSides = simulated.rows[move.row][move.column].sides.size;
    const opponentSides = Math.max(
        0,
        ...simulated.rows.flat()
            .filter((candidate) => candidate.color === opponentColor)
            .map((candidate) => candidate.sides.size),
    );
    const isolated = ownNeighbors === 0 ? 1 : 0;

    return `${botColor}:${board.size}:${ownNeighbors}:${opponentNeighbors}:` +
        `${reachedSides}:${opponentSides}:${isolated}`;
}

export function getMoveFeatureKeyFromState(
    boardState: string,
    boardSize: number,
    move: BotMove,
    botColor: string,
    opponentColor: string,
): string {
    return getMoveFeatureKey(boardFromState(boardState, boardSize), move, botColor, opponentColor);
}

function boardFromState(state: string, size: number): Board {
    const board = new Board(size);
    let index = 0;
    for (let row = 0; row < size; row++) {
        for (let column = 0; column <= row; column++) {
            const color = state[index++];
            if (color && color !== '.') board.placePiece(row, column, color);
        }
    }
    return board;
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