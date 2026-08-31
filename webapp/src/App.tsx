import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { useAuth } from './Auth';
import './App.css'
import GameBoard from './GameBoard';
import GameOver from './GameOver';
import { boardAtom, boardSizeAtom, connectionErrorAtom, isGameReadyAtom, isOpponentAvailableAtom, isP1TurnAtom, myColorAtom, opponentDisconnectedAtom, opponentDisplayNameAtom, opponentIdAtom, rematchRequesterAtom, roomIdAtom, winnerAtom } from './Atoms';
import { createInitialBoard } from '../../shared/CellValue';
import { sendMessage } from './Connection';
import { loadStatistics } from './api';

function App() {
    const location = useLocation();
    const { gameId } = useParams();
    const rawBoardSize = (location.state as { boardSize?: number | string } | null)?.boardSize ?? 8;
    const selectedBoardSize = Number(rawBoardSize);
    const safeBoardSize = Number.isFinite(selectedBoardSize) && selectedBoardSize > 1 ? selectedBoardSize : 8;
    const [gameState, setGameState] = useState<'playing' | 'over'>('playing');
    const [winner, setWinner] = useState<'B' | 'R' | null>(null);
    const [eloBefore, setEloBefore] = useState<number | null>(null);
    const [eloAfter, setEloAfter] = useState<number | null>(null);
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const setBoard = useSetAtom(boardAtom);
    const setIsP1Turn = useSetAtom(isP1TurnAtom);
    const setBoardWinner = useSetAtom(winnerAtom);
    const setIsGameReady = useSetAtom(isGameReadyAtom);
    const setMyColor = useSetAtom(myColorAtom);
    const setRoomId = useSetAtom(roomIdAtom);
    const setOpponentDisplayName = useSetAtom(opponentDisplayNameAtom);
    const setOpponentId = useSetAtom(opponentIdAtom);
    const setRematchRequester = useSetAtom(rematchRequesterAtom);
    const setIsOpponentAvailable = useSetAtom(isOpponentAvailableAtom);
    const setOpponentDisconnected = useSetAtom(opponentDisconnectedAtom);
    const connectionError = useAtomValue(connectionErrorAtom);
    const serverBoardSize = useAtomValue(boardSizeAtom);
    const roomId = useAtomValue(roomIdAtom);
    const opponentId = useAtomValue(opponentIdAtom);
    const isGameReady = useAtomValue(isGameReadyAtom);
    const opponentDisconnected = useAtomValue(opponentDisconnectedAtom);
    const boardWinner = useAtomValue(winnerAtom);
    const activeBoardSize = gameId && gameId !== 'new' ? serverBoardSize : safeBoardSize;

    useEffect(() => {
        if (!user?.userId) {
            return;
        }

        void loadStatistics(user.userId)
            .then((statistics) => setEloBefore(statistics.elo))
            .catch((error) => console.error('Failed to load ELO:', error));
    }, [user?.userId]);

    useEffect(() => {
        if (isLoading) return;

        setBoard(createInitialBoard(activeBoardSize));
        setIsP1Turn(true);
        setBoardWinner('.');
        setIsGameReady(false);
        setMyColor('.');
        setRoomId(null);
        setOpponentDisplayName(null);
        setOpponentId(null);
        setRematchRequester(null);
        setIsOpponentAvailable(false);
        setOpponentDisconnected(false);
        setGameState('playing');
        setWinner(null);
        setEloAfter(null);

        const isPrivateGame = Boolean(gameId);
        let messageType = 'join_lobby';
        if (gameId === 'new') {
            messageType = 'create_private_room';
        } else if (isPrivateGame) {
            messageType = 'join_private_room';
        }

        sendMessage({
            type: messageType,
            roomId: isPrivateGame && gameId !== 'new' ? gameId : undefined,
            boardSize: activeBoardSize,
            userId: user?.userId ?? null,
            displayName: user?.displayName ?? 'Guest',
        });
    }, [gameId, activeBoardSize, setBoard, setIsP1Turn, setBoardWinner, setIsGameReady, setMyColor, setRoomId, setOpponentDisplayName, setOpponentId, setRematchRequester, setIsOpponentAvailable, setOpponentDisconnected, user, isLoading]);

    useEffect(() => {
        if (!opponentDisconnected) return;

        setOpponentDisconnected(false);
        navigate('/menu', {
            replace: true,
            state: { error: 'Your opponent left the game. The game was closed.' },
        });
    }, [navigate, opponentDisconnected, setOpponentDisconnected]);

    useEffect(() => {
        if (gameId === 'new' && roomId) {
            navigate(`/game/${roomId}`, { replace: true });
        }
    }, [gameId, roomId, navigate]);

    const resetGame = () => {
        setBoard(createInitialBoard(activeBoardSize));
        setIsP1Turn(true);
        setBoardWinner('.');
    };

  const handleGameOver = (winnerColor: 'B' | 'R') => {
    setWinner(winnerColor);
    setGameState('over');
    if (user?.userId && opponentId) {
      void loadStatistics(user.userId)
        .then((statistics) => setEloAfter(statistics.elo))
        .catch((error) => console.error('Failed to load updated ELO:', error));
    }
  };

  const handlePlayAgain = () => {
    sendMessage({ type: 'leave_room' });
    sendMessage({
      type: 'join_lobby',
      boardSize: activeBoardSize,
      userId: user?.userId ?? null,
      displayName: user?.displayName ?? 'Guest',
    });
    resetGame();
    setIsGameReady(false);
    setWinner(null);
    setEloAfter(null);
    setGameState('playing');
  };

  const handleRematch = () => {
    sendMessage({ type: 'request_rematch' });
  };

  useEffect(() => {
    if (gameState === 'over' && isGameReady && boardWinner === '.') {
      setEloBefore(eloAfter ?? eloBefore);
      setEloAfter(null);
      setWinner(null);
      setGameState('playing');
    }
  }, [boardWinner, eloAfter, eloBefore, gameState, isGameReady]);

  const handleMainMenu = () => {
    sendMessage({ type: 'leave_room' });
    resetGame();
    navigate('/menu');
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Game Y</h1>
        <div className="header-right">
          <span className="user-name">Welcome, {user?.displayName ?? 'Guest'}!</span>
          {user ? <button type="button" className="logout-btn" onClick={handleMainMenu}>Resign</button> : null}
        </div>
      </div>
      {connectionError ? (
        <div className="status-error" style={{ color: '#ffb4b4', margin: '12px 0', fontWeight: 600 }}>
          {connectionError}
        </div>
      ) : null}

      {gameState === 'playing' ? (
        <GameBoard boardSize={activeBoardSize} onGameOver={handleGameOver} />
      ) : (
        <GameOver
          winner={winner!}
          eloBefore={eloBefore}
          eloAfter={eloAfter}
          onPlayAgain={handlePlayAgain}
          onRematch={handleRematch}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}

export default App
