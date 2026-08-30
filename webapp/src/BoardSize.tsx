import { useLocation, useNavigate } from 'react-router-dom';
import { sendMessage } from './Connection';
import './BoardSize.css';

const BOARD_SIZES = [6, 8, 10];

export default function BoardSize() {
  const navigate = useNavigate();
  const location = useLocation();
  const privateGame = Boolean((location.state as { privateGame?: boolean } | null)?.privateGame);

  const handleSelectBoardSize = (size: number) => {
    sendMessage({ type: 'leave_room' });
    navigate(privateGame ? '/game/new' : '/game', { state: { boardSize: size, privateGame } });
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
