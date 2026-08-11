import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { useAuth } from './Auth';
import './App.css'
import GameBoard from './GameBoard';
import GameOver from './GameOver';
import { boardAtom, isP1TurnAtom, winnerAtom } from './Atoms';
import { createInitialBoard } from '../../shared/CellValue';

function App() {
    const defaultBoardSize = 8;
    const [gameState, setGameState] = useState<'playing' | 'over'>('playing');
    const [winner, setWinner] = useState<'B' | 'R' | null>(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const setBoard = useSetAtom(boardAtom);
    const setIsP1Turn = useSetAtom(isP1TurnAtom);
    const setBoardWinner = useSetAtom(winnerAtom);

    const resetGame = () => {
        setBoard(createInitialBoard(defaultBoardSize));
        setIsP1Turn(true);
        setBoardWinner('.');
    };

  const handleGameOver = (winnerColor: 'B' | 'R') => {
    setWinner(winnerColor);
    setGameState('over');
  };

  const handlePlayAgain = () => {
    setGameState('playing');
    setWinner(null);
    window.location.reload();
  };

    const handleLogout = () => {
        resetGame();
        logout();
        navigate('/login');
    };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Game Y</h1>
        <div className="header-right">
          <span className="user-name">Welcome, {user?.displayName}!</span>
          <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
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
