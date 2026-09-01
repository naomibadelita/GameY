import './App.css';
import GameBoard from './GameBoard';
import GameOver from './GameOver';
import { useGameViewModel } from './hooks/useGameViewModel';

function App() {
  const { state, actions } = useGameViewModel();

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Game Y</h1>
        <div className="header-right">
          <span className="user-name">Welcome, {state.user?.displayName ?? 'Guest'}!</span>
          {state.user ? (
            <button type="button" className="logout-btn" onClick={actions.handleMainMenu}>
              Resign
            </button>
          ) : null}
        </div>
      </div>
      {state.connectionError ? (
        <div className="status-error" style={{ color: '#ffb4b4', margin: '12px 0', fontWeight: 600 }}>
          {state.connectionError}
        </div>
      ) : null}

      {state.gameState === 'playing' ? (
        <GameBoard boardSize={state.activeBoardSize} />
      ) : (
        <GameOver
          winner={state.winner!}
          eloBefore={state.eloBefore}
          eloAfter={state.eloAfter}
          onPlayAgain={actions.handlePlayAgain}
          onRematch={actions.handleRematch}
          onMainMenu={actions.handleMainMenu}
        />
      )}
    </div>
  );
}

export default App;
