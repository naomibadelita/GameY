import { type WebSocket } from "ws";
import { randomUUID } from 'node:crypto';
import { Board, MoveResult } from '../../gamey/Board';
import { ISubscriber } from './Interfaces';
import { type CellValue } from "../../shared/CellValue";

class PlayerData {
    ws: WebSocket;
    color: CellValue;
    boardSize: number;
    roomId: string | null;
    userId: string | null;
    displayName: string | null;

    constructor(ws: WebSocket, color: CellValue = '.', boardSize: number = 8, roomId: string | null = null, userId: string | null = null, displayName: string | null = null) {
        this.ws = ws;
        this.color = color;
        this.boardSize = boardSize;
        this.roomId = roomId;
        this.userId = userId;
        this.displayName = displayName;
    }
}

type RoomState = {
    id: string;
    board: Board;
    boardSize: number;
    currentPlayer: 'R' | 'B';
    players: PlayerData[];
};

export class GameManager implements ISubscriber {
    board: Board;
    boardSize: number;
    currentPlayer: 'R' | 'B' = 'B';
    players: PlayerData[] = [];
    waitingPlayers: PlayerData[] = [];
    connectedPlayers: PlayerData[] = [];
    rooms: Map<string, RoomState> = new Map();

    constructor(size: number) {
        this.board = new Board(size);
        this.boardSize = size;
    }

    private serializeBoard(board: Board): string {
        let result = '';
        for (const row of board.rows) {
            for (const node of row) {
                result = result + node.color;
            }
        }
        return result;
    }

    private changeCurrentPlayer(room: RoomState) {
        room.currentPlayer = room.currentPlayer === 'B' ? 'R' : 'B';
    }

    private getConnectedPlayer(ws: WebSocket): PlayerData | undefined {
        return this.connectedPlayers.find((player) => player.ws === ws);
    }

    private userAlreadyConnected(userId: string | null, currentWs: WebSocket): boolean {
        if (!userId) {
            return false;
        }

        return this.connectedPlayers.some((player) => player.userId === userId && player.ws !== currentWs);
    }

    private getRoomForPlayer(ws: WebSocket): RoomState | undefined {
        return Array.from(this.rooms.values()).find((room) => room.players.some((player) => player.ws === ws));
    }

    private createRoomId(): string {
        return `room-${randomUUID().slice(0, 8)}`;
    }

    private leaveRoom(ws: WebSocket) {
        const room = this.getRoomForPlayer(ws);
        if (!room) {
            return;
        }

        const remainingPlayers = room.players.filter((roomPlayer) => roomPlayer.ws !== ws);
        this.rooms.delete(room.id);
        this.players = this.players.filter((activePlayer) => activePlayer.ws !== ws);

        remainingPlayers.forEach((remainingPlayer) => {
            remainingPlayer.roomId = null;
            remainingPlayer.color = '.';
            if (remainingPlayer.ws.readyState === remainingPlayer.ws.OPEN) {
                remainingPlayer.ws.send(JSON.stringify({
                    type: 'status',
                    isGameReady: false,
                    boardSize: room.boardSize,
                    roomId: null,
                    opponentLeft: true,
                }));
            }
        });

        const player = this.getConnectedPlayer(ws);
        if (player) {
            player.roomId = null;
            player.color = '.';
        }
    }

    private broadcastRoom(room: RoomState, message: Record<string, unknown>) {
        room.players.forEach((player) => {
            if (player.ws.readyState === player.ws.OPEN) {
                player.ws.send(JSON.stringify({ ...message, roomId: room.id }));
            }
        });
    }

    private onMove(room: RoomState, data: any) {
        const result = room.board.placePiece(data.y, data.x, data.color);
        if (result === MoveResult.OCCUPIED) return;

        this.changeCurrentPlayer(room);
        const winner = result === MoveResult.VICTORY ? data.color : '.';
        const message = {
            type: 'update',
            board: this.serializeBoard(room.board),
            isP1Turn: room.currentPlayer === 'B',
            winner,
            roomId: room.id,
        };
        this.broadcastRoom(room, message);
    }

    private matchPlayers(playerA: PlayerData, playerB: PlayerData) {
        if (playerA.userId && playerB.userId && playerA.userId === playerB.userId) {
            playerA.ws.send(JSON.stringify({
                type: 'status',
                isGameReady: false,
                boardSize: playerA.boardSize,
                roomId: null,
                error: 'You cannot play against yourself.'
            }));
            playerB.ws.send(JSON.stringify({
                type: 'status',
                isGameReady: false,
                boardSize: playerB.boardSize,
                roomId: null,
                error: 'You cannot play against yourself.'
            }));
            return;
        }

        this.waitingPlayers = this.waitingPlayers.filter((player) => player.ws !== playerA.ws && player.ws !== playerB.ws);

        const roomId = this.createRoomId();
        const room: RoomState = {
            id: roomId,
            boardSize: playerA.boardSize,
            board: new Board(playerA.boardSize),
            currentPlayer: 'B',
            players: [playerA, playerB],
        };

        playerA.roomId = roomId;
        playerB.roomId = roomId;
        this.rooms.set(roomId, room);

        playerA.color = 'R';
        playerB.color = 'B';

        const state = {
            type: 'update',
            board: this.serializeBoard(room.board),
            isP1Turn: room.currentPlayer === 'B',
            winner: '.',
            roomId: room.id,
        };

        this.players = this.players.filter((player) => player.ws !== playerA.ws && player.ws !== playerB.ws);
        this.players.push(playerA, playerB);

        room.players.forEach((player) => {
            const opponent = room.players.find((roomPlayer) => roomPlayer.ws !== player.ws);
            if (player.ws.readyState === player.ws.OPEN) {
                player.ws.send(JSON.stringify({
                    type: 'init',
                    myColor: player.color,
                    opponentDisplayName: opponent?.displayName ?? 'Opponent',
                    opponentId: opponent?.userId,
                    boardSize: room.boardSize,
                    roomId: room.id,
                }));
                player.ws.send(JSON.stringify({
                    type: 'status',
                    isGameReady: true,
                    boardSize: room.boardSize,
                    roomId: room.id,
                }));
                player.ws.send(JSON.stringify(state));
            }
        });
    }

    private joinLobby(ws: WebSocket, requestedSize: number, userId: string | null = null, displayName: string | null = null) {
        const player = this.getConnectedPlayer(ws);
        if (!player) {
            return;
        }

        if (this.getRoomForPlayer(ws)) {
            return;
        }

        player.userId = userId ?? player.userId;
        player.displayName = displayName ?? player.displayName ?? null;
        if (userId && this.userAlreadyConnected(userId, ws)) {
            ws.send(JSON.stringify({
                type: 'status',
                isGameReady: false,
                boardSize: requestedSize,
                roomId: null,
                error: 'This user is already connected.'
            }));
            return;
        }

        player.boardSize = requestedSize;
        const opponent = this.waitingPlayers.find((waitingPlayer) =>
            waitingPlayer.ws !== ws &&
            waitingPlayer.boardSize === requestedSize &&
            waitingPlayer.userId !== player.userId
        );

        if (opponent) {
            this.matchPlayers(player, opponent);
            return;
        }

        this.waitingPlayers = this.waitingPlayers.filter((waitingPlayer) => waitingPlayer.ws !== ws);
        this.waitingPlayers.push(player);

        player.ws.send(JSON.stringify({
            type: 'status',
            isGameReady: false,
            boardSize: requestedSize,
            roomId: null,
        }));
    }

    public onConnection(ws: WebSocket) {
        console.log('Player connected.');
        this.connectedPlayers.push(new PlayerData(ws, '.', this.boardSize, null, null));
        ws.send(JSON.stringify({
            type: 'init',
            myColor: '.',
            boardSize: this.boardSize,
            roomId: null,
        }));
    }

    public onMessage(ws: WebSocket, message: any) {
        if (message.type === 'leave_room') {
            this.leaveRoom(ws);
            return;
        }

        if (message.type === 'join_lobby' || message.type === 'setup') {
            const requestedSize = Number(message.boardSize);
            const userId = message.userId ?? null;
            const displayName = typeof message.displayName === 'string' ? message.displayName : null;
            if (!Number.isNaN(requestedSize) && requestedSize > 1) {
                this.joinLobby(ws, requestedSize, userId, displayName);
            }
            return;
        }

        const room = this.getRoomForPlayer(ws);
        if (!room || room.id !== message.roomId) {
            return;
        }

        const player = room.players.find((roomPlayer) => roomPlayer.ws === ws);
        if (message.type === 'move' && player?.color === message.color && room.currentPlayer === message.color) {
            this.onMove(room, message);
        }
    }

    private reset(size: number = this.boardSize) {
        this.board = new Board(size);
        this.boardSize = size;
        this.currentPlayer = 'B';
    }

    public onClose(ws: WebSocket) {
        const player = this.getConnectedPlayer(ws);
        if (!player) {
            return;
        }

        const room = this.getRoomForPlayer(ws);
        if (room) {
            const remainingPlayers = room.players.filter((roomPlayer) => roomPlayer.ws !== ws);
            this.rooms.delete(room.id);
            this.players = this.players.filter((activePlayer) => activePlayer.ws !== ws);

            remainingPlayers.forEach((remainingPlayer) => {
                remainingPlayer.roomId = null;
                remainingPlayer.color = '.';
                if (remainingPlayer.ws.readyState === remainingPlayer.ws.OPEN) {
                    remainingPlayer.ws.send(JSON.stringify({
                        type: 'status',
                        isGameReady: false,
                        boardSize: room.boardSize,
                        roomId: null,
                        opponentDisconnected: true,
                    }));
                }
            });
        }

        this.connectedPlayers = this.connectedPlayers.filter((connectedPlayer) => connectedPlayer.ws !== ws);
        this.waitingPlayers = this.waitingPlayers.filter((waitingPlayer) => waitingPlayer.ws !== ws);
        this.players = this.players.filter((activePlayer) => activePlayer.ws !== ws);

        console.log(`Player ${player.color} disconnected.`);
        this.reset();
    }
}
