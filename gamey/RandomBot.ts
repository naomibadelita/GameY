import { randomInt } from 'node:crypto';
import type { Board } from './Board';
import type { BotMove, MoveStrategy } from './MoveStrategy';

export class RandomBot implements MoveStrategy {
    public chooseMove(board: Board, _botColor: string, _playerColor: string): BotMove | null {
        const moves: BotMove[] = [];

        for (let row = 0; row < board.size; row++) {
            for (let column = 0; column <= row; column++) {
                if (board.rows[row][column].color === '.') {
                    moves.push({ row, column });
                }
            }
        }

        return moves.length === 0
            ? null
            : moves[randomInt(moves.length)];
    }
}