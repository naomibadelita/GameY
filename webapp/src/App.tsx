import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { useAuth } from './Auth';
import './App.css'
import GameBoard from './GameBoard';
import GameOver from './GameOver';
import { boardAtom, isP1TurnAtom, winnerAtom } from './Atoms';
import { createInitialBoard } from '../../shared/CellValue';

function App() {
    const location = useLocation();
    const defaultBoardSize = 8;
    const selectedBoardSize = typeof (location.state as { boardSize?: number } | null)?.boardSize === 'number'
        ? (location.state as { boardSize?: number }).boardSize
        : defaultBoardSize;

    const [gameState, setGameState] = useState<'playing' | 'over'>('playing');
    const [winner, setWinner] = useState<'B' | 'R' | null>(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const setBoard = useSetAtom(boardAtom);
    const setIsP1Turn = useSetAtom(isP1TurnAtom);
    const setBoardWinner = useSetAtom(winnerAtom);

    useEffect(() => {
        setBoard(createInitialBoard(selectedBoardSize));
        setIsP1Turn(true);
        setBoardWinner('.');
    }, [selectedBoardSize, setBoard, setIsP1Turn, setBoardWinner]);

    const resetGame = () => {
        setBoard(createInitialBoard(selectedBoardSize));
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
    resetGame();
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
        <GameBoard boardSize={selectedBoardSize} onGameOver={handleGameOver} />
      ) : (
        <GameOver winner={winner!} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}

export default App
