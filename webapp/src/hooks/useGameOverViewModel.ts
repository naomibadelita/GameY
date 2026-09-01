import { useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { useAuth } from '../Auth';
import {
  myColorAtom,
  opponentDisplayNameAtom,
  opponentIdAtom,
  rematchRequesterAtom,
  isOpponentAvailableAtom,
} from '../Atoms';

export interface UseGameOverViewModelProps {
  winner: 'B' | 'R';
  eloBefore: number | null;
  eloAfter: number | null;
  onRematch: () => void;
}

export function useGameOverViewModel({
  winner,
  eloBefore,
  eloAfter,
  onRematch,
}: UseGameOverViewModelProps) {
  const [hasRequestedRematch, setHasRequestedRematch] = useState(false);
  const { user } = useAuth();

  const myColor = useAtomValue(myColorAtom);
  const opponentDisplayName = useAtomValue(opponentDisplayNameAtom);
  const opponentId = useAtomValue(opponentIdAtom);
  const rematchRequester = useAtomValue(rematchRequesterAtom);
  const isOpponentAvailable = useAtomValue(isOpponentAvailableAtom);

  const winnerText = winner === myColor
    ? (user?.displayName ?? 'You')
    : (opponentDisplayName ?? 'Opponent');

  const showElo = Boolean(opponentId && eloBefore !== null && eloAfter !== null);
  const isEloIncreased = showElo && Boolean(eloAfter && eloBefore && eloAfter > eloBefore);

  const getRematchButtonText = () => {
    if (hasRequestedRematch) {
      return 'Request sent';
    }
    if (rematchRequester) {
      return 'Accept rematch';
    }
    return 'Rematch';
  };

  const rematchButtonText = getRematchButtonText();
  const isRematchDisabled = !isOpponentAvailable || hasRequestedRematch;

  const handleRematchClick = useCallback(() => {
    setHasRequestedRematch(true);
    onRematch();
  }, [onRematch]);

  return {
    state: {
      winnerText,
      opponentId,
      showElo,
      eloBefore,
      eloAfter,
      isEloIncreased,
      rematchRequester,
      isOpponentAvailable,
      rematchButtonText,
      isRematchDisabled,
    },
    actions: {
      handleRematchClick,
    },
  };
}
