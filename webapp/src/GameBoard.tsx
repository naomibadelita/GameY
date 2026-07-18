import { useState } from 'react'; 
import { createInitialBoard } from './utils/geoHelpers';
import { type CellValue } from './types/game';
import './GameBoard.css';

interface GameBoardProps {
  readonly boardSize: number;
}

export default function GameBoard({ boardSize }: GameBoardProps) {
    const [board, setBoard] = useState<CellValue[][]>(createInitialBoard(boardSize));
    const [isP1Turn, setP1Turn] = useState<boolean>(true);

    const handleCellClick = (y: number, x: number) => {
        if (board[y][x] !== '.') {
            return;
        }

        const newBoard = board.map(row => [...row]);
        newBoard[y][x] = isP1Turn ? 'B' : 'R';
        setBoard(newBoard);
        setP1Turn(!isP1Turn);
    };

    const renderBoard= () => {
        const rows=[];

        for(let y=0; y<boardSize; y++)
        {
            const rowCells=[];
            const row=board[y];

            for(let x=0; x<=y;x++){
                const cell=row[x];

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
                        {y},{x}
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

    return (
        <div className="game-board-container">
            <h3>Rândul: {isP1Turn ? 'Jucător 1 (Albastru - B)' : 'Jucător 2 (Roșu - R)'}</h3>
            <div className="board-grid">
                {renderBoard()}
            </div>
        </div>
    );
}
