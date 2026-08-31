import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './Auth';
import './MainMenu.css';

export default function MainMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [error, setError] = useState<string | null>(() => {
    const state = location.state as { error?: unknown } | null;
    return typeof state?.error === 'string' ? state.error : null;
  });

  useEffect(() => {
    if (!error) return;

    navigate(location.pathname, { replace: true, state: null });
    const timeoutId = window.setTimeout(() => setError(null), 5200);
    return () => window.clearTimeout(timeoutId);
  }, [error, location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="menu-container">
      {error ? (
        <div className="menu-error-notification" role="alert">
          {error}
        </div>
      ) : null}
      <div className="menu-content">
        <h1 className="menu-title">Game Y</h1>
        <p className="menu-welcome">Welcome, {user?.displayName}!</p>

        <div className="menu-buttons">
          <button
            type="button"
            className="menu-btn primary-btn"
            onClick={() => navigate('/board-size')}
          >
            Start New Game
          </button>

          <button
            type="button"
            className="menu-btn primary-btn"
            onClick={() => navigate('/board-size', { state: { privateGame: true } })}
          >
            Create Private Game
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
            className="menu-btn primary-btn"
            onClick={() => navigate('/statistics')}
          >
            View Statistics
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
