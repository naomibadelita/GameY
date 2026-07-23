//import { useState } from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Auth';
import './App.css'
import GameBoard from './GameBoard';
import GameOver from './GameOver';

function App() {
    const defaultBoardSize = 8;
    const [gameState, setGameState] = useState<'playing' | 'over'>('playing');
    const [winner, setWinner] = useState<'B' | 'R' | null>(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleGameOver = (winnerColor: 'B' | 'R') => {
        setWinner(winnerColor);
        setGameState('over');
    };

    const handlePlayAgain = () => {
        setGameState('playing');
        setWinner(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Game Y</h1>
        <div className="header-right">
          <span className="user-name">Welcome, {user?.displayName}!</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      {gameState === 'playing' ? (
        <GameBoard boardSize={defaultBoardSize} onGameOver={handleGameOver} />
      ) : (
        <GameOver winner={winner!} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}

export default App
