import { useNavigate } from 'react-router-dom';
import './BoardSize.css';

const BOARD_SIZES = [6, 8, 10];

export default function BoardSize() {
  const navigate = useNavigate();

  const handleSelectBoardSize = (size: number) => {
    navigate('/game', { state: { boardSize: size } });
  };

  return (
    <div className="board-size-container">
        <div className="board-content">
            <h1 className="board-title">Game Y</h1>
            <p className="board-size">Choose Board Size</p>

            <div className="board-size-options">
            {BOARD_SIZES.map((size) => (
                <button
                key={size}
                type="button"
                className="board-size-btn primary-btn"
                onClick={() => handleSelectBoardSize(size)}
                >
                {size} X {size}
                </button>
            ))}
            </div>
      </div>
    </div>
  );
}
