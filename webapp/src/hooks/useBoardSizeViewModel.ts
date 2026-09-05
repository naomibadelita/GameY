import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gameSocketService } from '../services/gameSocketService';

export const BOARD_SIZES: readonly number[] = [6, 8, 10];
export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'adaptive';

export function useBoardSizeViewModel() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameType = location.state as {
    privateGame?: boolean;
    botGame?: boolean;
  } | null;
  const privateGame = Boolean(gameType?.privateGame);
  const botGame = Boolean(gameType?.botGame);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');

  const selectBoardSize = useCallback((size: number) => {
    gameSocketService.leaveRoom();
    let destination = '/game';
    if (botGame) {
      destination = '/game/bot';
    } else if (privateGame) {
      destination = '/game/new';
    }
    navigate(destination, { state: { boardSize: size, privateGame, botGame, difficulty } });
  }, [botGame, difficulty, navigate, privateGame]);

  return {
    state: {
      availableSizes: BOARD_SIZES,
      isPrivateGame: privateGame,
      botGame,
      difficulty,
    },
    actions: {
      selectBoardSize,
      setDifficulty,
    },
  };
}
