import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gameSocketService } from '../services/gameSocketService';

export const BOARD_SIZES: readonly number[] = [6, 8, 10];

export function useBoardSizeViewModel() {
  const navigate = useNavigate();
  const location = useLocation();
  const privateGame = Boolean((location.state as { privateGame?: boolean } | null)?.privateGame);

  const selectBoardSize = useCallback((size: number) => {
    gameSocketService.leaveRoom();
    const destination = privateGame ? '/game/new' : '/game';
    navigate(destination, { state: { boardSize: size, privateGame } });
  }, [navigate, privateGame]);

  return {
    state: {
      availableSizes: BOARD_SIZES,
      isPrivateGame: privateGame,
    },
    actions: {
      selectBoardSize,
    },
  };
}
