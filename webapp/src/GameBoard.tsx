import './GameBoard.css';
import { boardAtom, isP1TurnAtom, myColorAtom, winnerAtom } from './Atoms';
import { useAtomValue } from 'jotai'
import { ws } from './Connection';

interface GameBoardProps {
    readonly boardSize: number;
}

export default function GameBoard({ boardSize }: GameBoardProps) {
    const board = useAtomValue(boardAtom);
    const isP1Turn = useAtomValue(isP1TurnAtom);
    const winner = useAtomValue(winnerAtom);
    const color = useAtomValue(myColorAtom);

    const handleCellClick = (y: number, x: number) => {
        if (winner !== '.' || board[y][x] !== '.') {
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
        ? 'Jucător 1 (Albastru - B)'
        : 'Jucător 2 (Roșu - R)';

    const turn_text = isP1Turn
        ? 'Jucător 1 (Albastru - B)'
        : 'Jucător 2 (Roșu - R)';

    const header_text = winner !== '.'
        ? `Câștigător: ${winner_text}`
        : `Rândul: ${turn_text}`;

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