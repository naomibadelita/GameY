import { Board, MoveResult } from './Board';
import type { BotMove, MoveStrategy } from './MoveStrategy';

export class SearchBot implements MoveStrategy {
    public chooseMove(board: Board, botColor: string, playerColor: string): BotMove | null {
        const moves = this.getEmptyMoves(board);

        const blockingMove = moves.find((move) => {
            const simulated = this.copyBoard(board);
            return simulated.placePiece(move.row, move.column, playerColor) === MoveResult.VICTORY;
        });
        if (blockingMove) {
            return blockingMove;
        }

        let bestMove: BotMove | null = null;
        let bestScore = Number.NEGATIVE_INFINITY;

        for (const move of moves) {
            const afterBot = this.copyBoard(board);
            const botResult = afterBot.placePiece(move.row, move.column, botColor);
            if (botResult === MoveResult.VICTORY) {
                return move;
            }

            const opponentBestScore = this.getOpponentBestScore(afterBot, playerColor, botColor);
            const score = this.evaluate(afterBot, botColor, playerColor) - opponentBestScore;
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    private getOpponentBestScore(board: Board, playerColor: string, botColor: string): number {
        let bestScore = Number.NEGATIVE_INFINITY;

        for (const move of this.getEmptyMoves(board)) {
            const simulated = this.copyBoard(board);
            const result = simulated.placePiece(move.row, move.column, playerColor);
            if (result === MoveResult.VICTORY) {
                return 10_000;
            }

            bestScore = Math.max(bestScore, this.evaluate(simulated, botColor, playerColor));
        }

        return bestScore === Number.NEGATIVE_INFINITY ? 0 : bestScore;
    }

    private evaluate(board: Board, botColor: string, playerColor: string): number {
        let botSides = 0;
        let playerSides = 0;

        for (const row of board.rows) {
            for (const node of row) {
                if (node.color === botColor) botSides = Math.max(botSides, node.sides.size);
                if (node.color === playerColor) playerSides = Math.max(playerSides, node.sides.size);
            }
        }

        return botSides * 100 - playerSides * 120;
    }

    private getEmptyMoves(board: Board): BotMove[] {
        const moves: BotMove[] = [];
        for (let row = 0; row < board.size; row++) {
            for (let column = 0; column <= row; column++) {
                if (board.rows[row][column].color === '.') {
                    moves.push({ row, column });
                }
            }
        }
        return moves;
    }

    private copyBoard(board: Board): Board {
        const copy = new Board(board.size);
        for (let row = 0; row < board.size; row++) {
            for (let column = 0; column <= row; column++) {
                const color = board.rows[row][column].color;
                if (color !== '.') copy.placePiece(row, column, color);
            }
        }
        return copy;
    }
}