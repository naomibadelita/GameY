import { Board, MoveResult } from '../gamey/Board';
import { GameBot } from '../gamey/GameBot';
import type { BotModel } from '../gamey/BotModel';
import type { Experience } from './Experience';
import { serializeBoard } from './Experience';
import type { QModel } from './QModel';
import { calculateMoveReward } from './Reward';

function createSeededRandom(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
        state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
        return state / 4_294_967_296;
    };
}

    type TurnResult = {
        winner: 'B' | 'R' | null;
        nextColor: 'B' | 'R';
        pendingExperience: Experience | null;
    };

    function finishExperiences(
        experiences: Experience[],
        winner: 'B' | 'R',
        onExperience?: (experience: Experience) => void,
    ): 'B' | 'R' {
        experiences.forEach((experience) => {
            onExperience?.({
                ...experience,
                reward: getFinalReward(experience, winner),
            });
        });
        return winner;
    }

    function getFinalReward(experience: Experience, winner: 'B' | 'R'): number {
        if (experience.botColor === winner || !experience.terminal) {
            return experience.reward;
        }

        return -1;
    }

    function playTurn(
        board: Board,
        blueBot: GameBot,
        redBot: GameBot,
        currentColor: 'B' | 'R',
        random: () => number,
        experiences: Experience[],
        pendingExperience: Experience | null,
    ): TurnResult {
        const bot = currentColor === 'B' ? blueBot : redBot;
        const opponentColor: 'B' | 'R' = currentColor === 'B' ? 'R' : 'B';
        const move = bot.chooseMove(
            board,
            currentColor,
            opponentColor,
            (numberOfMoves) => Math.floor(random() * numberOfMoves),
            random,
        );

        if (move === null) {
            if (pendingExperience) {
                pendingExperience.nextBoard = serializeBoard(board);
                pendingExperience.terminal = true;
                pendingExperience.reward = -1;
            }
            return { winner: opponentColor, nextColor: currentColor, pendingExperience: null };
        }

        const boardBeforeMove = serializeBoard(board);
        const boardSnapshot = copyBoard(board);
        const result = board.placePiece(move.row, move.column, currentColor);
        const winner = result === MoveResult.VICTORY ? currentColor : null;

        if (pendingExperience) {
            pendingExperience.nextBoard = serializeBoard(board);
            pendingExperience.terminal = winner !== null;
            if (winner !== null) pendingExperience.reward = -1;
        }

        const experience: Experience = {
            board: boardBeforeMove,
            boardSize: board.size,
            botColor: currentColor,
            move,
            reward: winner !== null
                ? 1
                : calculateMoveReward(boardSnapshot, board, move, currentColor, opponentColor),
            nextBoard: winner !== null ? serializeBoard(board) : '',
            terminal: winner !== null,
        };
        experiences.push(experience);

        return {
            winner,
            nextColor: opponentColor,
            pendingExperience: winner === null ? experience : null,
        };
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
export function playGame(
    boardSize: number,
    blueModel: BotModel,
    redModel: BotModel,
    seed: number,
    onExperience?: (experience: Experience) => void,
    qModel: QModel | null = null,
    redQModel: QModel | null = qModel,
): 'B' | 'R' {
    const board = new Board(boardSize);
    const blueBot = new GameBot(blueModel, qModel ?? undefined);
    const redBot = new GameBot(redModel, redQModel ?? undefined);
    const random = createSeededRandom(seed);
    const experiences: Experience[] = [];
    let pendingExperience: Experience | null = null;


    let currentColor: 'B' | 'R' = 'B';

    while (true) {
            const turn = playTurn(
                board,
                blueBot,
                redBot,
                currentColor,
                random,
                experiences,
                pendingExperience,
            );
            if (turn.winner !== null) {
                return finishExperiences(experiences, turn.winner, onExperience);
            }

            pendingExperience = turn.pendingExperience;
            currentColor = turn.nextColor;
        }
    }