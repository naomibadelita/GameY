import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Auth';
import './MainMenu.css';

const BOARD_SIZES = {
  small: 5,
  medium: 8,
  large: 10,
} as const;

type BoardSizeKey = keyof typeof BOARD_SIZES;

export default function MainMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedBoardSize, setSelectedBoardSize] = useState<BoardSizeKey>('medium');

  const handleStartGame = () => {
    navigate('/game', { state: { boardSize: BOARD_SIZES[selectedBoardSize] } });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="menu-container">
      <div className="menu-content">
        <h1 className="menu-title">Game Y</h1>
        <p className="menu-welcome">Welcome, {user?.displayName}!</p>

        <div className="board-size-picker" aria-label="Board size selector">
          {Object.entries(BOARD_SIZES).map(([label, size]) => {
            const isSelected = selectedBoardSize === label;

            return (
              <button
                key={label}
                type="button"
                className={`size-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedBoardSize(label as BoardSizeKey)}
              >
                {label.charAt(0).toUpperCase() + label.slice(1)} ({size})
              </button>
            );
          })}
        </div>

        <div className="menu-buttons">
          <button
            type="button"
            className="menu-btn primary-btn"
            onClick={handleStartGame}
          >
            Start New Game
          </button>

          <button
            type="button"
            className="menu-btn primary-btn"
            onClick={() => navigate('/leaderboard')}
          >
            View Leaderboard
          </button>

          <button
            type="button"
            className="menu-btn logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}