import { useState, useEffect } from 'react';
import { Board, MoveResult } from '../../gamey/Board';
import { validateGameId, createGame, saveGame } from './api';
import './GameBoard.css';
import { type CellValue } from './CellValue';
import { boardAtom, isP1TurnAtom, winnerAtom } from './Atoms';
import { useAtom } from 'jotai'

interface GameBoardProps {
    readonly boardSize: number;
    readonly onGameOver: (winner: 'B' | 'R') => void;
}

export default function GameBoard({ boardSize, onGameOver }: GameBoardProps) {
    const [engine] = useState<Board>(() => new Board(boardSize));
    const [board, setBoard] = useAtom(boardAtom);
    const [isP1Turn, setP1Turn] = useAtom(isP1TurnAtom);
    const [winner, setWinner] = useAtom(winnerAtom);
    const [gameId, setGameId] = useState<string | null>(null);

    // Create a new game when component mounts
    useEffect(() => {
        const startNewGame = async () => {
            try {
                const response = await createGame(board, 'B', 'in-progress');
                setGameId(validateGameId(response.id));
            } catch (error) {
                console.error('Failed to create game:', error);
            }
        };
        startNewGame();
    }, []);

    // Save game state whenever it changes
    useEffect(() => {
        if (gameId) {
            saveGame(gameId, board, isP1Turn ? 'B' : 'R', winner !== '.' ? 'finished' : 'in-progress').catch(error => {
                console.error('Failed to save game:', error);
            });
        }
    }, [gameId, board, isP1Turn, winner]);

    useEffect(() => {
        if (winner !== null && (winner === 'B' || winner === 'R')) {
            onGameOver(winner);
        }
    }, [winner, onGameOver]);

    const handleCellClick = (y: number, x: number) => {
        if (winner !== '.' || board[y][x] !== '.') {
            return;
        }

        const color: CellValue = isP1Turn ? 'B' : 'R';
        const result = engine.placePiece(y, x, color);
        if (result === MoveResult.OCCUPIED) {
            return;
        }

        const newBoard = board.map(row => [...row]);
        newBoard[y][x] = color;
        setBoard(newBoard);

        if (result === MoveResult.VICTORY) {
            setWinner(color);
            return;
        }

        setP1Turn(!isP1Turn);
    };

    const renderBoard = () => {
        const rows = [];

        for (let y = 0; y < boardSize; y++) {
            const rowCells = [];
            const row = board[y];

            for (let x = 0; x <= y; x++) {
                const cell = row[x];

                let cellClass = 'cell-empty';
                if (cell === 'B') {
                    cellClass = 'cell-p1';
                } else if (cell === 'R') {
                    cellClass = 'cell-p2';
                }

                rowCells.push(
                    <button
                        type="button"
                        key={`cell-${y}-${x}`}
                        className={`hex-cell ${cellClass}`}
                        onClick={() => handleCellClick(y, x)}
                    >
                    </button>
                );
            }

            rows.push(
                <div key={`row-${y}`} className="board-row">
                    {rowCells}
                </div>
            );
        }

        return rows;
    };

    const winner_text = winner === 'B'
        ? 'Blue Player'
        : 'Red Player';

    const turn_text = isP1Turn
        ? 'Blue Player'
        : 'Red Player';

    const header_text = winner !== '.'
        ? `Winner: ${winner_text}`
        : `Next: ${turn_text}`;

    return (
        <div className="game-board-container">
            <h3> {header_text} </h3>

            <div className="board-relative">

                <svg className="board-svg-bg" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path
                        d="M50,4 L96,91 A5,5 0 0,1 91,97 L9,97 A5,5 0 0,1 4,91 Z"
                        fill="#4c4848"
                        stroke="#3d3737"
                        strokeWidth="0.5"
                    />
                </svg>

                <div className="board-grid">
                    {renderBoard()}
                </div>
            </div>
        </div>
    );
}
