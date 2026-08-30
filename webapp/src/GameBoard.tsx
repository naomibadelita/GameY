import { useEffect } from 'react';
import './GameBoard.css';
import { boardAtom, isGameReadyAtom, isP1TurnAtom, myColorAtom, roomIdAtom, winnerAtom, opponentDisplayNameAtom } from './Atoms';
import { useAtomValue } from 'jotai'
import { normalizeBoardForSize } from '../../shared/CellValue';
import { sendMessage } from './Connection';
import { useAuth } from './Auth';

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
    const roomId = useAtomValue(roomIdAtom);
    const opponentDisplayName = useAtomValue(opponentDisplayNameAtom);
    const { user } = useAuth();
    const safeBoard = normalizeBoardForSize(board, boardSize);

    useEffect(() => {
        if (winner === 'B' || winner === 'R') {
            onGameOver(winner);
        }
    }, [winner, onGameOver]);

    const handleCellClick = (y: number, x: number) => {
        if (winner !== '.' || safeBoard[y][x] !== '.') {
            return;
        }
        const msg = {
            type: 'move',
            x: x,
            y: y,
            color: color,
            roomId: roomId,
        };
        sendMessage(msg);
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

    const currentPlayerName = user?.displayName ?? 'You';
    const otherPlayerName = opponentDisplayName ?? 'Opponent';
    const winner_text = winner === color
        ? currentPlayerName
        : otherPlayerName;

    const turn_text = isP1Turn === (color === 'B')
        ? currentPlayerName
        : otherPlayerName;

    const in_game_text = winner !== '.'
        ? `Winner: ${winner_text}`
        : `Next: ${turn_text}`;

    const header_text = isGameReady
        ? in_game_text
        : 'Waiting for opponent...';

    return (
        <div className="game-board-container">
            {isGameReady ? (
                <div className="game-player-summary">
                    <p>{currentPlayerName}</p>
                    <span aria-hidden="true">vs</span>
                    <p>{otherPlayerName}</p>
                </div>
            ) : null}
            <h3>{header_text}</h3>

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
