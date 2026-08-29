import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { useAuth } from './Auth';
import './App.css'
import GameBoard from './GameBoard';
import GameOver from './GameOver';
import { boardAtom, connectionErrorAtom, isP1TurnAtom, opponentDisplayNameAtom, winnerAtom } from './Atoms';
import { createInitialBoard } from '../../shared/CellValue';
import { ws } from './Connection';

function App() {
    const location = useLocation();
    const rawBoardSize = (location.state as { boardSize?: number | string } | null)?.boardSize ?? 8;
    const selectedBoardSize = Number(rawBoardSize);
    const safeBoardSize = Number.isFinite(selectedBoardSize) && selectedBoardSize > 1 ? selectedBoardSize : 8;
    const [gameState, setGameState] = useState<'playing' | 'over'>('playing');
    const [winner, setWinner] = useState<'B' | 'R' | null>(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const setBoard = useSetAtom(boardAtom);
    const setIsP1Turn = useSetAtom(isP1TurnAtom);
    const setBoardWinner = useSetAtom(winnerAtom);
    const setOpponentDisplayName = useSetAtom(opponentDisplayNameAtom);
    const connectionError = useAtomValue(connectionErrorAtom);

    useEffect(() => {
        setBoard(createInitialBoard(safeBoardSize));
        setIsP1Turn(true);
        setBoardWinner('.');
        setOpponentDisplayName(null);
        setGameState('playing');
        setWinner(null);

        ws.send(JSON.stringify({
            type: 'join_lobby',
            boardSize: safeBoardSize,
            userId: user?.userId ?? null,
          displayName: user?.displayName ?? null,
        }));
    }, [safeBoardSize, setBoard, setIsP1Turn, setBoardWinner]);

    const resetGame = () => {
        setBoard(createInitialBoard(safeBoardSize));
        setIsP1Turn(true);
        setBoardWinner('.');
    };

  const handleGameOver = (winnerColor: 'B' | 'R') => {
    setWinner(winnerColor);
    setGameState('over');
  };

  const handlePlayAgain = () => {
    ws.send(JSON.stringify({
      type: 'leave_room',
      userId: user?.userId ?? null,
    }));
    setBoard(createInitialBoard(safeBoardSize));
    setIsP1Turn(true);
    setBoardWinner('.');
    setWinner(null);
    setGameState('playing');
    navigate('/board-size');
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
      {connectionError ? (
        <div className="status-error" style={{ color: '#ffb4b4', margin: '12px 0', fontWeight: 600 }}>
          {connectionError}
        </div>
      ) : null}

      {gameState === 'playing' ? (
        <GameBoard boardSize={safeBoardSize} onGameOver={handleGameOver} />
      ) : (
        <GameOver winner={winner!} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}

export default App
