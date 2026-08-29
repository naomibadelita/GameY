import { getDefaultStore } from "jotai";
import { type CellValue } from "../../shared/CellValue";
import { boardAtom, isGameReadyAtom, isP1TurnAtom, winnerAtom, myColorAtom, roomIdAtom, connectionErrorAtom, opponentDisplayNameAtom } from "./Atoms";

const getWebSocketUrl = (): string => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
};

function characterToCell(c: string): CellValue {
    switch (c) {
        case 'R': return 'R';
        case 'B': return 'B';
        default: return '.';
    }
}

function deserializeBoard(s: string): CellValue[][] {
    const board: CellValue[][] = [];

    for (let y = 1, i = 0; i + y <= s.length; i = i + y, y++) {
        const substr = s.substring(i, i + y);
        const row: CellValue[] = [...substr].map(characterToCell)
        board.push(row);
    }

    return board;
}

const store = getDefaultStore();
const url = getWebSocketUrl();
console.log(`URL: ${url}`)
export const ws = new WebSocket(url);

type ServerMessage = {
    type?: 'update' | 'init' | 'status';
    board?: string;
    isP1Turn?: boolean;
    winner?: CellValue;
    myColor?: CellValue;
    opponentDisplayName?: string;
    isGameReady?: boolean;
    error?: string;
    roomId?: string | null;
};

function setRoomId(roomId: string | null | undefined) {
    if (roomId) {
        store.set(roomIdAtom, roomId);
    }
}

function handleUpdate(data: ServerMessage) {
    if (typeof data.board !== 'string') {
        return;
    }

    console.log("UPDATE!");
    store.set(boardAtom, deserializeBoard(data.board));
    store.set(isP1TurnAtom, Boolean(data.isP1Turn));
    store.set(winnerAtom, data.winner ?? '.');
    setRoomId(data.roomId);
}

function handleInit(data: ServerMessage) {
    if (data.myColor) {
        store.set(myColorAtom, data.myColor);
    }
    if (typeof data.opponentDisplayName === 'string') {
        store.set(opponentDisplayNameAtom, data.opponentDisplayName);
    }
    setRoomId(data.roomId);
}

function handleStatus(data: ServerMessage) {
    store.set(isGameReadyAtom, Boolean(data.isGameReady));
    if (!data.isGameReady) {
        store.set(opponentDisplayNameAtom, null);
    }
    store.set(connectionErrorAtom, data.error ?? null);
    setRoomId(data.roomId);
}

const messageHandlers: Record<'update' | 'init' | 'status', (data: ServerMessage) => void> = {
    update: handleUpdate,
    init: handleInit,
    status: handleStatus,
};

ws.onmessage = (ev) => {
    const data = JSON.parse(ev.data) as ServerMessage;
    if (!data.type) {
        return;
    }

    messageHandlers[data.type](data);
};
