import { getDefaultStore } from "jotai";
import { type CellValue } from "../../../shared/CellValue";
import {
    boardAtom,
    boardSizeAtom,
    isGameReadyAtom,
    isP1TurnAtom,
    winnerAtom,
    myColorAtom,
    roomIdAtom,
    connectionErrorAtom,
    connectionLostAtom,
    opponentDisplayNameAtom,
    opponentIdAtom,
    rematchRequesterAtom,
    isOpponentAvailableAtom,
    opponentDisconnectedAtom
} from "../Atoms";

export interface ServerMessage {
    type?: 'update' | 'init' | 'status' | 'rematch_requested';
    board?: string;
    isP1Turn?: boolean;
    winner?: CellValue;
    myColor?: CellValue;
    opponentDisplayName?: string;
    opponentId?: string;
    isGameReady?: boolean;
    error?: string;
    opponentLeft?: boolean;
    opponentDisconnected?: boolean;
    requesterDisplayName?: string;
    roomId?: string | null;
    boardSize?: number;
}

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
        const row: CellValue[] = [...substr].map(characterToCell);
        board.push(row);
    }

    return board;
}

export class GameSocketService {
    private ws: WebSocket | null = null;
    private reconnectTimeoutId: number | null = null;
    private readonly pendingMessages: string[] = [];
    private readonly store = getDefaultStore();

    private getWebSocketUrl(): string {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws`;
    }

    public connect(): void {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const url = this.getWebSocketUrl();
        const socket = new WebSocket(url);
        this.ws = socket;

        socket.onmessage = (ev: MessageEvent) => {
            this.handleMessage(ev);
        };

        socket.onopen = () => {
            this.store.set(connectionLostAtom, false);
            if (this.reconnectTimeoutId !== null) {
                window.clearTimeout(this.reconnectTimeoutId);
                this.reconnectTimeoutId = null;
            }

            while (this.pendingMessages.length > 0 && socket.readyState === WebSocket.OPEN) {
                socket.send(this.pendingMessages.shift()!);
            }
        };

        socket.onclose = () => {
            if (socket !== this.ws || this.reconnectTimeoutId !== null) {
                return;
            }

            this.store.set(connectionLostAtom, true);
            this.reconnectTimeoutId = window.setTimeout(() => {
                this.reconnectTimeoutId = null;
                this.connect();
            }, 1000);
        };
    }

    public disconnect(): void {
        if (this.reconnectTimeoutId !== null) {
            window.clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
        }
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }
    }

    public sendMessage(message: Record<string, unknown>): void {
        const payload = JSON.stringify(message);
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(payload);
            return;
        }

        this.pendingMessages.push(payload);
        this.connect();
    }

    public makeMove(x: number, y: number, color: CellValue, roomId: string | null): void {
        this.sendMessage({
            type: 'move',
            x,
            y,
            color,
            roomId,
        });
    }

    public joinLobby(boardSize: number, userId: string | null, displayName: string): void {
        this.sendMessage({
            type: 'join_lobby',
            boardSize,
            userId,
            displayName,
        });
    }

    public createPrivateRoom(boardSize: number, userId: string | null, displayName: string): void {
        this.sendMessage({
            type: 'create_private_room',
            boardSize,
            userId,
            displayName,
        });
    }

    public joinPrivateRoom(roomId: string, boardSize: number, userId: string | null, displayName: string): void {
        this.sendMessage({
            type: 'join_private_room',
            roomId,
            boardSize,
            userId,
            displayName,
        });
    }

    public leaveRoom(): void {
        this.sendMessage({ type: 'leave_room' });
    }

    public requestRematch(): void {
        this.sendMessage({ type: 'request_rematch' });
    }

    private handleMessage(ev: MessageEvent): void {
        try {
            const data = JSON.parse(ev.data) as ServerMessage;
            if (!data.type) return;

            switch (data.type) {
                case 'update':
                    this.handleUpdate(data);
                    break;
                case 'init':
                    this.handleInit(data);
                    break;
                case 'status':
                    this.handleStatus(data);
                    break;
                case 'rematch_requested':
                    this.handleRematchRequested(data);
                    break;
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    private setBoardSize(boardSize: number | undefined): void {
        if (typeof boardSize === 'number' && Number.isFinite(boardSize) && boardSize > 1) {
            this.store.set(boardSizeAtom, boardSize);
        }
    }

    private setRoomId(roomId: string | null | undefined): void {
        this.store.set(roomIdAtom, roomId ?? null);
    }

    private handleUpdate(data: ServerMessage): void {
        if (typeof data.board !== 'string') {
            return;
        }

        this.store.set(boardAtom, deserializeBoard(data.board));
        this.store.set(isP1TurnAtom, Boolean(data.isP1Turn));
        this.store.set(winnerAtom, data.winner ?? '.');
        if (data.winner === '.') {
            this.store.set(rematchRequesterAtom, null);
        }
        this.setRoomId(data.roomId);
    }

    private handleInit(data: ServerMessage): void {
        this.setBoardSize(data.boardSize);
        if (data.myColor) {
            this.store.set(myColorAtom, data.myColor);
        }
        if (typeof data.opponentDisplayName === 'string') {
            this.store.set(opponentDisplayNameAtom, data.opponentDisplayName);
        }
        if (typeof data.opponentId === 'string') {
            this.store.set(opponentIdAtom, data.opponentId);
        }

        this.setRoomId(data.roomId);
    }

    private handleStatus(data: ServerMessage): void {
        this.setBoardSize(data.boardSize);
        this.store.set(isGameReadyAtom, Boolean(data.isGameReady));
        this.store.set(isOpponentAvailableAtom, Boolean(data.isGameReady) && !data.opponentLeft);
        if (!data.isGameReady) {
            this.store.set(opponentDisplayNameAtom, null);
            this.store.set(opponentIdAtom, null);
        }
        if (data.opponentLeft) {
            this.store.set(rematchRequesterAtom, null);
        }
        this.store.set(opponentDisconnectedAtom, Boolean(data.opponentDisconnected || data.opponentLeft));
        this.store.set(connectionErrorAtom, data.error ?? null);
        this.setRoomId(data.roomId);
    }

    private handleRematchRequested(data: ServerMessage): void {
        this.store.set(rematchRequesterAtom, data.requesterDisplayName ?? 'Opponent');
    }
}

export const gameSocketService = new GameSocketService();
