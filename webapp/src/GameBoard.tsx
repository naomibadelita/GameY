import './GameBoard.css';
import { useGameBoardViewModel } from './hooks/useGameBoardViewModel';

interface GameBoardProps {
    readonly boardSize: number;
}

export default function GameBoard({ boardSize }: GameBoardProps) {
    const { state, actions } = useGameBoardViewModel(boardSize);

    return (
        <div className="game-board-container">
            {state.isGameReady ? (
                <div className="game-player-summary">
                    <p>{state.currentPlayerName}</p>
                    <span aria-hidden="true">vs</span>
                    <p>{state.otherPlayerName}</p>
                </div>
            ) : null}
            <h3>{state.headerText}</h3>

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
                    {state.rows.map((row) => (
                        <div key={row[0]?.key ? `row-${row[0].y}` : `row-empty`} className="board-row">
                            {row.map((cell) => (
                                <button
                                    type="button"
                                    key={cell.key}
                                    className={`hex-cell ${cell.cellClass}`}
                                    onClick={() => actions.handleCellClick(cell.y, cell.x)}
                                >
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

