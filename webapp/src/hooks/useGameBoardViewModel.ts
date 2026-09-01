import { useMemo, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import {
  boardAtom,
  isGameReadyAtom,
  isP1TurnAtom,
  myColorAtom,
  winnerAtom,
  opponentDisplayNameAtom,
  roomIdAtom
} from '../Atoms';
import { normalizeBoardForSize, type CellValue } from '../../../shared/CellValue';
import { gameSocketService } from '../services/gameSocketService';
import { useAuth } from '../Auth';

export interface HexCellData {
  key: string;
  x: number;
  y: number;
  value: CellValue;
  cellClass: string;
}

export function useGameBoardViewModel(boardSize: number) {
  const rawBoard = useAtomValue(boardAtom);
  const isP1Turn = useAtomValue(isP1TurnAtom);
  const isGameReady = useAtomValue(isGameReadyAtom);
  const winner = useAtomValue(winnerAtom);
  const myColor = useAtomValue(myColorAtom);
  const roomId = useAtomValue(roomIdAtom);
  const opponentDisplayName = useAtomValue(opponentDisplayNameAtom);
  const { user } = useAuth();

  const board = useMemo(() => normalizeBoardForSize(rawBoard, boardSize), [rawBoard, boardSize]);

  const currentPlayerName = user?.displayName ?? 'You';
  const otherPlayerName = opponentDisplayName ?? 'Opponent';

  const winnerText = winner === myColor ? currentPlayerName : otherPlayerName;
  const turnText = isP1Turn === (myColor === 'B') ? currentPlayerName : otherPlayerName;
  const inGameText = winner !== '.' ? `Winner: ${winnerText}` : `Next: ${turnText}`;
  const headerText = isGameReady ? inGameText : 'Waiting for opponent...';

  const rows = useMemo(() => {
    const result: HexCellData[][] = [];
    for (let y = 0; y < boardSize; y++) {
      const rowCells: HexCellData[] = [];
      const row = board[y] ?? [];
      for (let x = 0; x <= y; x++) {
        const cell = row[x] ?? '.';
        let cellClass = 'cell-empty';
        if (cell === 'B') {
          cellClass = 'cell-p1';
        } else if (cell === 'R') {
          cellClass = 'cell-p2';
        }

        rowCells.push({
          key: `cell-${y}-${x}`,
          x,
          y,
          value: cell,
          cellClass,
        });
      }
      result.push(rowCells);
    }
    return result;
  }, [board, boardSize]);

  const handleCellClick = useCallback((y: number, x: number) => {
    if (winner !== '.' || board[y]?.[x] !== '.') {
      return;
    }
    gameSocketService.makeMove(x, y, myColor, roomId);
  }, [board, myColor, roomId, winner]);

  return {
    state: {
      board,
      rows,
      isGameReady,
      currentPlayerName,
      otherPlayerName,
      headerText,
    },
    actions: {
      handleCellClick,
    },
  };
}
