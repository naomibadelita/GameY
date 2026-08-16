import { useState, useEffect } from 'react';
import { validateGameId, createGame, saveGame } from './api';
import './GameBoard.css';
import { boardAtom, isGameReadyAtom, isP1TurnAtom, myColorAtom, winnerAtom } from './Atoms';
import { useAtomValue } from 'jotai'
import { normalizeBoardForSize } from '../../shared/CellValue';
import { ws } from './Connection';

interface GameBoardProps {
    readonly boardSize: number;
    readonly onGameOver: (winner: 'B' | 'R') => void;
}

export default function GameBoard({ boardSize, onGameOver }: GameBoardProps) {
    const board = useAtomValue(boardAtom);
    const isP1Turn = useAtomValue(isP1TurnAtom);
    const isGameReady = useAtomValue(isGameReadyAtom);
    const winner = useAtomValue(winnerAtom);
    const color = useAtomValue(myColorAtom);
    const [gameId, setGameId] = useState<string | null>(null);
    const safeBoard = normalizeBoardForSize(board, boardSize);

    // Create a new game when component mounts
    useEffect(() => {
        const startNewGame = async () => {
            try {
                const response = await createGame(safeBoard, 'B', 'in-progress');
                setGameId(validateGameId(response.id));
            } catch (error) {
                console.error('Failed to create game:', error);
            }
        };
        startNewGame();
    }, [safeBoard]);

    // Maybe this shouldn't be the responsibility of the client
    
    // Save game state whenever it changes
    useEffect(() => {
        if (gameId) {
            saveGame(gameId, safeBoard, isP1Turn ? 'B' : 'R', winner !== '.' ? 'finished' : 'in-progress').catch(error => {
                console.error('Failed to save game:', error);
            });
        }
    }, [gameId, safeBoard, isP1Turn, winner]);

    useEffect(() => {
        if (winner === 'B' || winner === 'R') {
            onGameOver(winner);
        }
    }, [winner, onGameOver]);

    const handleCellClick = (y: number, x: number) => {
        if (winner !== '.' || safeBoard[y][x] !== '.') {
            return;
        }
        const msg = JSON.stringify({
            type: 'move',
            x: x,
            y: y,
            color: color
        });
        console.log(`MSG: ${msg}`);
        ws.send(msg);
    };

    const renderBoard = () => {
        const rows = [];

        for (let y = 0; y < boardSize; y++) {
            const rowCells = [];
            const row = safeBoard[y];

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

    const in_game_text = winner !== '.'
        ? `Winner: ${winner_text}`
        : `Next: ${turn_text}`;

    const header_text = isGameReady
        ? in_game_text
        : 'Waiting for opponent...';

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
