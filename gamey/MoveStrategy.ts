import type { Board } from './Board';

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'adaptive';

export interface BotMove {
    row: number;
    column: number;
}

export interface MoveStrategy {
    chooseMove(board: Board, botColor: string, playerColor: string): BotMove | null;
}