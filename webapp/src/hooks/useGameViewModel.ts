import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { useAuth } from '../Auth';
import {
    boardAtom,
    boardSizeAtom,
    connectionErrorAtom,
    connectionLostAtom,
    isGameReadyAtom,
    isOpponentAvailableAtom,
    isP1TurnAtom,
    myColorAtom,
    opponentDisconnectedAtom,
    opponentDisplayNameAtom,
    opponentIdAtom,
    rematchRequesterAtom,
    roomIdAtom,
    winnerAtom
} from '../Atoms';
import { createInitialBoard, normalizeBoardForSize } from '../../../shared/CellValue';
import { gameSocketService } from '../services/gameSocketService';
import { loadStatistics } from '../api';

export function useGameViewModel() {
    const location = useLocation();
    const navigate = useNavigate();
    const { gameId } = useParams();
    const { user, isLoading } = useAuth();

    // Local UI state
    const [gameState, setGameState] = useState<'playing' | 'over'>('playing');
    const [winner, setWinner] = useState<'B' | 'R' | null>(null);
    const [eloBefore, setEloBefore] = useState<number | null>(null);
    const [eloAfter, setEloAfter] = useState<number | null>(null);

    // Jotai reactive atom values
    const board = useAtomValue(boardAtom);
    const serverBoardSize = useAtomValue(boardSizeAtom);
    const isP1Turn = useAtomValue(isP1TurnAtom);
    const boardWinner = useAtomValue(winnerAtom);
    const myColor = useAtomValue(myColorAtom);
    const roomId = useAtomValue(roomIdAtom);
    const opponentDisplayName = useAtomValue(opponentDisplayNameAtom);
    const opponentId = useAtomValue(opponentIdAtom);
    const isGameReady = useAtomValue(isGameReadyAtom);
    const rematchRequester = useAtomValue(rematchRequesterAtom);
    const isOpponentAvailable = useAtomValue(isOpponentAvailableAtom);
    const opponentDisconnected = useAtomValue(opponentDisconnectedAtom);
    const connectionLost = useAtomValue(connectionLostAtom);
    const connectionError = useAtomValue(connectionErrorAtom);

    // Jotai atom setters
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
    const setConnectionLost = useSetAtom(connectionLostAtom);

    // Computed board dimensions
    const rawBoardSize = (location.state as { boardSize?: number | string } | null)?.boardSize ?? 8;
    const selectedBoardSize = Number(rawBoardSize);
    const safeBoardSize = Number.isFinite(selectedBoardSize) && selectedBoardSize > 1 ? selectedBoardSize : 8;
    const isBotGame = gameId === 'bot';
    const activeBoardSize = gameId && gameId !== 'new' && !isBotGame
        ? serverBoardSize
        : safeBoardSize;
    const safeBoard = useMemo(() => normalizeBoardForSize(board, activeBoardSize), [board, activeBoardSize]);

    // Computed presentation helpers
    const currentPlayerName = user?.displayName ?? 'You';
    const otherPlayerName = opponentDisplayName ?? 'Opponent';
    const isMyTurn = (myColor === 'B' && isP1Turn) || (myColor === 'R' && !isP1Turn);

    const winnerText = boardWinner === myColor
        ? currentPlayerName
        : otherPlayerName;

    const turnText = isP1Turn === (myColor === 'B')
        ? currentPlayerName
        : otherPlayerName;

    const inGameText = boardWinner !== '.'
        ? `Winner: ${winnerText}`
        : `Next: ${turnText}`;

    const headerText = isGameReady
        ? inGameText
        : 'Waiting for opponent...';

    // Reset board & turn state
    const resetGame = useCallback(() => {
        setBoard(createInitialBoard(activeBoardSize));
        setIsP1Turn(true);
        setBoardWinner('.');
    }, [activeBoardSize, setBoard, setIsP1Turn, setBoardWinner]);

    // Load initial user ELO
    useEffect(() => {
        if (!user?.userId) return;

        void loadStatistics(user.userId)
            .then((statistics) => setEloBefore(statistics.elo))
            .catch((error) => console.error('Failed to load ELO:', error));
    }, [user?.userId]);

    // Connect socket and join game session
    useEffect(() => {
        if (isLoading) return;

        gameSocketService.connect();

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
        setConnectionLost(false);
        setGameState('playing');
        setWinner(null);
        setEloAfter(null);

        const isPrivateGame = Boolean(gameId);
        const userId = user?.userId ?? null;
        const displayName = user?.displayName ?? 'Guest';

        if (isBotGame) {
            gameSocketService.createBotGame(activeBoardSize, userId, displayName);
        } else if (gameId === 'new') {
            gameSocketService.createPrivateRoom(activeBoardSize, userId, displayName);
        } else if (isPrivateGame && gameId) {
            gameSocketService.joinPrivateRoom(gameId, activeBoardSize, userId, displayName);
        } else {
            gameSocketService.joinLobby(activeBoardSize, userId, displayName);
        }
    }, [
        gameId,
        isBotGame,
        activeBoardSize,
        user,
        isLoading,
        setBoard,
        setIsP1Turn,
        setBoardWinner,
        setIsGameReady,
        setMyColor,
        setRoomId,
        setOpponentDisplayName,
        setOpponentId,
        setRematchRequester,
        setIsOpponentAvailable,
        setOpponentDisconnected,
        setConnectionLost
    ]);

    // Navigate on connection lost
    useEffect(() => {
        if (!connectionLost) return;

        setConnectionLost(false);
        navigate('/menu', {
            replace: true,
            state: { error: 'Lost connection to server.' },
        });
    }, [connectionLost, navigate, setConnectionLost]);

    // Navigate on opponent disconnected
    useEffect(() => {
        if (!opponentDisconnected) return;

        setOpponentDisconnected(false);
        navigate('/menu', {
            replace: true,
            state: { error: 'Your opponent left the game. The game was closed.' },
        });
    }, [navigate, opponentDisconnected, setOpponentDisconnected]);

    // Update URL when private room created
    useEffect(() => {
        if (gameId === 'new' && roomId) {
            navigate(`/game/${roomId}`, { replace: true });
        }
    }, [gameId, roomId, navigate]);

    // Sync rematch/reset state
    useEffect(() => {
        if (gameState === 'over' && isGameReady && boardWinner === '.') {
            setEloBefore(eloAfter ?? eloBefore);
            setEloAfter(null);
            setWinner(null);
            setGameState('playing');
        }
    }, [boardWinner, eloAfter, eloBefore, gameState, isGameReady]);

    // Action handlers
    const handleGameOver = useCallback((winnerColor: 'B' | 'R') => {
        setWinner(winnerColor);
        setGameState('over');
        if (user?.userId && opponentId) {
            void loadStatistics(user.userId)
                .then((statistics) => setEloAfter(statistics.elo))
                .catch((error) => console.error('Failed to load updated ELO:', error));
        }
    }, [user?.userId, opponentId]);

    // Detect winner change and trigger game over
    useEffect(() => {
        if (gameState === 'playing' && (boardWinner === 'B' || boardWinner === 'R')) {
            handleGameOver(boardWinner);
        }
    }, [boardWinner, gameState, handleGameOver]);

    const makeMove = useCallback((y: number, x: number) => {
        if (boardWinner !== '.' || safeBoard[y]?.[x] !== '.') {
            return;
        }
        gameSocketService.makeMove(x, y, myColor, roomId);
    }, [boardWinner, safeBoard, myColor, roomId]);

    const handlePlayAgain = useCallback(() => {
        gameSocketService.leaveRoom();
        gameSocketService.joinLobby(activeBoardSize, user?.userId ?? null, user?.displayName ?? 'Guest');
        resetGame();
        setIsGameReady(false);
        setWinner(null);
        setEloAfter(null);
        setGameState('playing');
    }, [activeBoardSize, user, resetGame, setIsGameReady]);

    const handleRematch = useCallback(() => {
        gameSocketService.requestRematch();
    }, []);

    const handleMainMenu = useCallback(() => {
        gameSocketService.leaveRoom();
        resetGame();
        navigate('/menu');
    }, [resetGame, navigate]);

    return {
        state: {
            board: safeBoard,
            activeBoardSize,
            isP1Turn,
            isMyTurn,
            boardWinner,
            myColor,
            roomId,
            opponentDisplayName,
            opponentId,
            isGameReady,
            rematchRequester,
            isOpponentAvailable,
            opponentDisconnected,
            connectionLost,
            connectionError,
            gameState,
            winner,
            eloBefore,
            eloAfter,
            user,
            currentPlayerName,
            otherPlayerName,
            winnerText,
            turnText,
            headerText,
        },
        actions: {
            makeMove,
            handleGameOver,
            handlePlayAgain,
            handleRematch,
            handleMainMenu,
            resetGame,
        },
    };
}
