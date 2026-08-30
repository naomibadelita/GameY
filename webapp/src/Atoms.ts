import { atom } from 'jotai'
import { type CellValue, createInitialBoard } from '../../shared/CellValue';

export const boardAtom = atom<CellValue[][]>(createInitialBoard(8));
export const isP1TurnAtom = atom<boolean>(true);
export const winnerAtom = atom<CellValue>('.');
export const myColorAtom = atom<CellValue>('.');
export const roomIdAtom = atom<string | null>(null);
export const opponentDisplayNameAtom = atom<string | null>(null);
export const opponentIdAtom = atom<string | null>(null);
export const connectionErrorAtom = atom<string | null>(null);
export const isGameReadyAtom = atom<boolean>(false);
