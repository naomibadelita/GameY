import { randomInt } from 'node:crypto';
import {Board, MoveResult} from './Board';
import { defaultBotModel, type BotModel } from './BotModel';
import type { BotMove } from './MoveStrategy';
import type { QModel } from '../training/QModel';
import { getActionKey, getStateKey } from '../training/QTrainer';
import { getMoveFeatureKey } from '../training/Features';

export type { BotMove } from './MoveStrategy';

type TieBreaker = (numberOfMoves: number) => number;
type RandomSource = () => number;

export class GameBot{
    public constructor(
        private readonly model: BotModel = defaultBotModel,
        private readonly qModel?: QModel,
    ) {}

    public chooseMove(
        board: Board,
        botColor: string,
        playerColor: string,
        tieBreaker?: TieBreaker,
        randomSource?: RandomSource,
    ): BotMove | null {
        const emptyMoves= this.getEmptyMoves(board);

        //We are placing a bot piece on each empty node in a copy of the board
        // the node will be chosen immediately if the placement completes all sides (A,B,C)
        const winningMoves = emptyMoves.filter((move) =>
            this.simulateMove(board, move, botColor) === MoveResult.VICTORY,
        );
        if (winningMoves.length > 0) {
            return this.selectMove(winningMoves, tieBreaker);
        }

        //if the player could win on an empty node next turn,
        // place the bot's piece there first ti block that node
        const blockingMoves = emptyMoves.filter((move) =>
            this.simulateMove(board, move, playerColor) === MoveResult.VICTORY,
        );
        if (blockingMoves.length > 0) {
            return this.selectMove(blockingMoves, tieBreaker);
        }

        const qMove = this.selectQMove(board, emptyMoves, botColor, tieBreaker, randomSource);
        if (qMove !== null) {
            return qMove;
        }

        //Otherwise, prefer a move adjacent to the most bot pieces
        let highestScore = Number.NEGATIVE_INFINITY;
        const bestMoves: BotMove[] = [];
        for (const move of emptyMoves) {
            const score = this.getMoveScore(board, move, botColor);
            if (score > highestScore) {
                highestScore = score;
                bestMoves.length = 0;
                bestMoves.push(move);
            } else if (score === highestScore) {
                bestMoves.push(move);
            }
        }

        return this.selectMove(bestMoves, tieBreaker);
    }

    private selectQMove(
        board: Board,
        moves: BotMove[],
        botColor: string,
        tieBreaker?: TieBreaker,
        randomSource?: RandomSource,
    ): BotMove | null {
        if (!this.qModel || moves.length === 0) return null;

        if (this.shouldExplore(randomSource)) {
            return this.selectMove(moves, tieBreaker);
        }

        const state = getStateKey(this.serializeBoard(board), botColor);
        const opponentColor = botColor === 'B' ? 'R' : 'B';
        let bestValue = Number.NEGATIVE_INFINITY;
        let bestMove: BotMove | null = null;

        for (const move of moves) {
            const action = getActionKey(move.row, move.column);
            const exactValue = this.qModel.values[`${state}:${action}`];
            const featureKey = getMoveFeatureKey(board, move, botColor, opponentColor);
            const value = exactValue ?? this.qModel.featureValues?.[featureKey];
            if (value !== undefined && value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }

        return bestMove;
    }

    private shouldExplore(randomSource?: RandomSource): boolean {
        if (!this.qModel || this.qModel.explorationRate <= 0) {
            return false;
        }

        const value = randomSource?.() ?? randomInt(1_000_000) / 1_000_000;
        return value < this.qModel.explorationRate;
    }

    private serializeBoard(board: Board): string {
        return board.rows.flatMap((row) => row.map((node) => node.color)).join('');
    }

    private selectMove(moves: BotMove[], tieBreaker?: TieBreaker): BotMove | null {
        if (moves.length === 0) {
            return null;
        }

        const selectedIndex = tieBreaker?.(moves.length) ?? 0;
        return Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < moves.length
            ? moves[selectedIndex]
            : moves[0];
    }

    private getEmptyMoves(board: Board): BotMove[] {
        const moves: BotMove[]=[];
        for(let row=0; row<board.size; row++){
            for(let column=0; column<=row;column++){
                if(board.rows[row][column].color === '.'){
                    moves.push({row,column});
                }
            }
        }

        return moves;
    }

    private simulateMove(board: Board, move: BotMove, color: string): MoveResult{
        const copyBoard= new Board(board.size);

        //Re-create all already-placed pieces on a separate board.
        for(let row=0; row<board.size; row++){
            for(let column=0; column<=row; column++){
                const existingColor=board.rows[row][column].color;
                if(existingColor!='.')
                {
                    copyBoard.placePiece(row,column,existingColor);
                }
            }
        }

        return copyBoard.placePiece(move.row,move.column,color);
    }

    private getMoveScore(board: Board,move: BotMove,botColor: string) : number{
        const ownNeighbors = board.rows[move.row][move.column].neighbors
            .filter((neighbor) => neighbor.color === botColor)
            .length;
        const connectedGroups = this.getConnectedNeighborGroups(board, move, botColor);
        const simulatedBoard = this.copyBoard(board);
        simulatedBoard.placePiece(move.row, move.column, botColor);
        const reachedSides = simulatedBoard.rows[move.row][move.column].sides.size;
        const isolatedPenalty = ownNeighbors === 0
            ? this.model.isolatedPiecePenalty
            : 0;

        return ownNeighbors * this.model.adjacentOwnPiece
            + reachedSides * this.model.reachNewSide
            + Math.max(0, connectedGroups - 1) * this.model.connectGroups
            - isolatedPenalty;
    }

    private getConnectedNeighborGroups(board: Board, move: BotMove, botColor: string): number {
        const visited = new Set<unknown>();
        let groups = 0;

        for (const neighbor of board.rows[move.row][move.column].neighbors) {
            if (neighbor.color !== botColor || visited.has(neighbor)) {
                continue;
            }

            groups++;
            const nodesToVisit = [neighbor];
            while (nodesToVisit.length > 0) {
                const node = nodesToVisit.pop()!;
                if (visited.has(node)) {
                    continue;
                }

                visited.add(node);
                nodesToVisit.push(...node.neighbors.filter(
                    (nextNode) => nextNode.color === botColor && !visited.has(nextNode),
                ));
            }
        }

        return groups;
    }

    private copyBoard(board: Board): Board {
        const copyBoard = new Board(board.size);

        for (let row = 0; row < board.size; row++) {
            for (let column = 0; column <= row; column++) {
                const existingColor = board.rows[row][column].color;
                if (existingColor !== '.') {
                    copyBoard.placePiece(row, column, existingColor);
                }
            }
        }

        return copyBoard;
    }
}