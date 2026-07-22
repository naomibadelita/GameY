import { getDefaultStore } from "jotai";
import { type CellValue } from "../../shared/CellValue";
import { boardAtom, isP1TurnAtom, winnerAtom, myColorAtom } from "./Atoms";

const getWebSocketUrl = (): string => {
    if (import.meta.env.DEV) {
        return 'ws://localhost:8080';
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
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
ws.onmessage = (ev) => {
    const data = JSON.parse(ev.data);
    switch (data.type) {
        case 'update':
            console.log("UPDATE!");
            store.set(boardAtom, deserializeBoard(data.board));
            store.set(isP1TurnAtom, data.isP1Turn);
            store.set(winnerAtom, data.winner);
            break;

        case 'init':
            if (store.get(myColorAtom) === '.') {
                store.set(myColorAtom, data.myColor);
            }
            break;
    }
};
