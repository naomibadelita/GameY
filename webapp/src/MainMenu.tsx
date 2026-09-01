import { useMainMenuViewModel } from './hooks/useMainMenuViewModel';
import './MainMenu.css';

export default function MainMenu() {
  const { state, actions } = useMainMenuViewModel();

  return (
    <div className="menu-container">
      {state.error ? (
        <div className="menu-error-notification" role="alert">
          {state.error}
        </div>
      ) : null}
      <div className="menu-content">
        <h1 className="menu-title">Game Y</h1>
        <p className="menu-welcome">Welcome, {state.displayName}!</p>

        <div className="menu-buttons">
          <button
            type="button"
            className="menu-btn primary-btn"
            onClick={actions.startPublicGame}
          >
            Start New Game
          </button>

          <button
            type="button"
            className="menu-btn primary-btn"
            onClick={actions.startPrivateGame}
          >
            Create Private Game
          </button>

          <button
            type="button"
            className="menu-btn primary-btn"
            onClick={actions.viewLeaderboard}
          >
            View Leaderboard
          </button>

          <button
            type="button"
            className="menu-btn primary-btn"
            onClick={actions.viewStatistics}
          >
            View Statistics
          </button>

          <button
            type="button"
            className="menu-btn logout-btn"
            onClick={actions.handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
