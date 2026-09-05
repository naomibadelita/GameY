import { type WebSocket } from "ws";
import { randomUUID } from 'node:crypto';
import { Board, MoveResult } from '../../gamey/Board';
import { ISubscriber } from './Interfaces';
import { type CellValue } from "../../shared/CellValue";
import { GameBot } from '../../gamey/GameBot';
import { defaultBotModel, type BotModel } from '../../gamey/BotModel';
import { RandomBot } from '../../gamey/RandomBot';
import { SearchBot } from '../../gamey/SearchBot';
import type { BotDifficulty, MoveStrategy } from '../../gamey/MoveStrategy';
import type { Experience } from '../../training/Experience';
import { appendExperience } from '../../training/ExperienceStore';
import type { QModel } from '../../training/QModel';
import { calculateMoveReward } from '../../training/Reward';

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
    rematchPlayers: Set<WebSocket>;
    isBotGame: boolean;
    botDifficulty?: BotDifficulty;
    botExperiences?: Experience[];
    winner: 'R' | 'B' | '.';
};

type MoveMessage = {
    x: number;
    y: number;
    color: CellValue;
};

export class GameManager implements ISubscriber {
    private readonly bot: GameBot;
    private readonly randomBot = new RandomBot();
    private readonly searchBot = new SearchBot();

    board: Board;
    boardSize: number;
    currentPlayer: 'R' | 'B' = 'B';
    players: PlayerData[] = [];
    waitingPlayers: PlayerData[] = [];
    connectedPlayers: PlayerData[] = [];
    rooms: Map<string, RoomState> = new Map();

    constructor(size: number, botModel: BotModel = defaultBotModel, qModel?: QModel) {
        this.board = new Board(size);
        this.boardSize = size;
        this.bot = new GameBot(botModel, qModel);
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

    private disconnectExistingSession(userId: string | null, currentWs: WebSocket) {
        if (!userId) {
            return;
        }

        const existingPlayers = this.connectedPlayers.filter((player) =>
            player.userId === userId && player.ws !== currentWs
        );

        existingPlayers.forEach((existingPlayer) => {
            this.leaveRoom(existingPlayer.ws);
            this.waitingPlayers = this.waitingPlayers.filter((player) => player.ws !== existingPlayer.ws);
            this.players = this.players.filter((player) => player.ws !== existingPlayer.ws);
            this.connectedPlayers = this.connectedPlayers.filter((player) => player.ws !== existingPlayer.ws);
            existingPlayer.ws.close();
        });
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

    private async onWin(room: RoomState, winner: 'R' | 'B') {
        const { default: gameyApiRouter } = await import('../../gameyapi/index.js');

        return gameyApiRouter.saveFinishedGame(
            room.board.rows.map((row) => row.map((node) => node.color)),
            winner,
            room.players,
        );
    }

    private isValidMove(room: RoomState, data: MoveMessage): boolean {
        return room.winner === '.' &&
            Number.isInteger(data.x) &&
            Number.isInteger(data.y) &&
            data.y >= 0 &&
            data.y < room.board.rows.length &&
            data.x >= 0 &&
            data.x <= data.y;
    }

    private completePendingBotExperience(room: RoomState, winner: 'R' | 'B' | '.'): void {
        const pendingExperience = room.botExperiences?.at(-1);
        if (!pendingExperience) {
            return;
        }

        pendingExperience.nextBoard = this.serializeBoard(room.board);
        pendingExperience.terminal = winner === 'B';
        if (winner === 'B') pendingExperience.reward = -1;
    }

    private playBotMove(room: RoomState): 'R' | '.' {
        const boardSnapshot = this.copyBoard(room.board);
        const boardBeforeBotMove = this.serializeBoard(room.board);
        const botMove = this.getBotStrategy(room).chooseMove(room.board, 'R', 'B');
        if (botMove === null) {
            room.currentPlayer = 'B';
            return '.';
        }

        const botResult = room.board.placePiece(botMove.row, botMove.column, 'R');
        room.botExperiences ??= [];
        room.botExperiences.push({
            board: boardBeforeBotMove,
            boardSize: room.boardSize,
            botColor: 'R',
            move: botMove,
            reward: botResult === MoveResult.VICTORY
                ? 1
                : calculateMoveReward(boardSnapshot, room.board, botMove, 'R', 'B'),
            nextBoard: botResult === MoveResult.VICTORY ? this.serializeBoard(room.board) : '',
            terminal: botResult === MoveResult.VICTORY,
        });
        room.currentPlayer = 'B';
        return botResult === MoveResult.VICTORY ? 'R' : '.';
    }

    private persistBotExperiences(room: RoomState, winner: 'R' | 'B'): void {
        const experiences = room.botExperiences;
        room.botExperiences = [];
        experiences?.forEach((experience) => {
            void appendExperience({
                ...experience,
            }).catch((error: unknown) => {
                console.error('Failed to save bot experience:', error);
            });
        });
    }

    private copyBoard(board: Board): Board {
        const copy = new Board(board.size);
        for (let row = 0; row < board.size; row++) {
            for (let column = 0; column <= row; column++) {
                const color = board.rows[row][column].color;
                if (color !== '.') copy.placePiece(row, column, color);
            }
        }
        return copy;
    }

    private async onMove(room: RoomState, data: MoveMessage) {
        if (!this.isValidMove(room, data)) {
            return;
        }

        const result = room.board.placePiece(data.y, data.x, data.color);

        if (result === MoveResult.OCCUPIED) {
            return;
        }

        let winner: 'R' | 'B' | '.' =
            result === MoveResult.VICTORY ? data.color : '.';

        if (room.isBotGame) this.completePendingBotExperience(room, winner);

        if (room.isBotGame && winner === '.') {
            winner = this.playBotMove(room);
        } else if (!room.isBotGame) {
            this.changeCurrentPlayer(room);
        }

        if (winner !== '.') {
            room.winner = winner;
            if (room.isBotGame) this.persistBotExperiences(room, winner);
            void this.onWin(room, winner).catch((error) => {
                console.error('Failed to save finished game:', error);
            });
        }

        this.broadcastRoom(room, {
            type: 'update',
            board: this.serializeBoard(room.board),
            isP1Turn: room.currentPlayer === 'B',
            winner,
        });
    }

    private getBotStrategy(room: RoomState): MoveStrategy {
        switch (room.botDifficulty) {
            case 'easy': return this.randomBot;
            case 'hard': return this.searchBot;
            case 'adaptive': return this.getAdaptiveStrategy(room);
            default: return this.bot;
        }
    }

    private getAdaptiveStrategy(room: RoomState): MoveStrategy {
        const playerNodes = room.board.rows.flat()
            .filter((node) => node.color === 'B');
        const strongestConnection = Math.max(
            0,
            ...playerNodes.map((node) => node.sides.size),
        );
        const strongestCluster = Math.max(
            0,
            ...playerNodes.map((node) =>
                node.neighbors.filter((neighbor) => neighbor.color === 'B').length,
            ),
        );

        if (strongestConnection >= 2 || strongestCluster >= 2) {
            return this.searchBot;
        }

        if (playerNodes.length <= 2 && strongestCluster === 0) {
            return this.randomBot;
        }

        return this.bot;
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
            rematchPlayers: new Set(),
            isBotGame: false,
            winner: '.',
        };

        playerA.roomId = roomId;
        playerB.roomId = roomId;
        this.rooms.set(roomId, room);

        playerA.color = 'R';
        playerB.color = 'B';

        this.players = this.players.filter((player) => player.ws !== playerA.ws && player.ws !== playerB.ws);
        this.players.push(playerA, playerB);
        this.sendRoomState(room);
    }

    private sendRoomState(room: RoomState) {
        const state = {
            type: 'update',
            board: this.serializeBoard(room.board),
            isP1Turn: room.currentPlayer === 'B',
            winner: room.winner,
            roomId: room.id,
        };

        room.players.forEach((player) => {
            if (player.ws.readyState !== player.ws.OPEN) {
                return;
            }
           const opponent = room.players.find((roomPlayer) => roomPlayer.ws !== player.ws);

            player.ws.send(JSON.stringify({
                type: 'init',
                myColor: player.color,
                opponentDisplayName: room.isBotGame
                    ? 'Bot'
                    : opponent?.displayName ?? null,
                opponentId: room.isBotGame
                    ? null
                    : opponent?.userId,
                boardSize: room.boardSize,
                difficulty: room.isBotGame ? room.botDifficulty : undefined,
                roomId: room.id,
            }));

            player.ws.send(JSON.stringify({
                type: 'status',
                isGameReady: room.isBotGame || room.players.length === 2,
                boardSize: room.boardSize,
                roomId: room.id,
            }));
            player.ws.send(JSON.stringify(state));
        });
    }

    private createPrivateRoom(ws: WebSocket, requestedSize: number, userId: string | null, displayName: string | null) {
        const player = this.getConnectedPlayer(ws);
        if (!player || this.getRoomForPlayer(ws)) {
            return;
        }

        player.userId = userId;
        player.displayName = displayName;
        player.boardSize = requestedSize;
        player.color = 'B';
        const roomId = this.createRoomId();
        const room: RoomState = {
            id: roomId,
            boardSize: requestedSize,
            board: new Board(requestedSize),
            currentPlayer: 'B',
            players: [player],
            rematchPlayers: new Set(),
            isBotGame: false,
            winner: '.',
        };

        player.roomId = roomId;
        this.rooms.set(roomId, room);
        this.players.push(player);
        this.waitingPlayers = this.waitingPlayers.filter((waitingPlayer) => waitingPlayer.ws !== ws);
        this.sendRoomState(room);
    }

    private createBotGame(
        ws: WebSocket,
        requestedSize: number,
        userId: string | null,
        displayName: string | null,
        difficulty: BotDifficulty,
    ) {
        const player = this.getConnectedPlayer(ws);

        if (!player || this.getRoomForPlayer(ws)) {
            return;
        }

        player.userId = userId;
        player.displayName = displayName;
        player.boardSize = requestedSize;
        player.color = 'B';

        const roomId = this.createRoomId();
        const room: RoomState = {
            id: roomId,
            boardSize: requestedSize,
            board: new Board(requestedSize),
            currentPlayer: 'B',
            players: [player],
            rematchPlayers: new Set(),
            isBotGame: true,
            botDifficulty: difficulty,
            botExperiences: [],
            winner: '.',
        };

        player.roomId = roomId;
        this.rooms.set(roomId, room);
        this.players.push(player);
        this.waitingPlayers = this.waitingPlayers.filter(
            (waitingPlayer) => waitingPlayer.ws !== ws,
        );
        this.sendRoomState(room);
    }

    private joinPrivateRoom(ws: WebSocket, roomId: string, userId: string | null, displayName: string | null) {
        const player = this.getConnectedPlayer(ws);
        const room = this.rooms.get(roomId);
        if (!player || !room) {
            ws.send(JSON.stringify({ type: 'status', isGameReady: false, roomId: null, error: 'Game not found.' }));
            return;
        }

        if (room.players.some((roomPlayer) => roomPlayer.ws === ws)) {
            this.sendRoomState(room);
            return;
        }

        if (room.isBotGame) {
            ws.send(JSON.stringify({
                type: 'status',
                isGameReady: false,
                roomId: null,
                error: 'This game is against the bot.',
            }));
            return;
        }

        if (room.players.length >= 2) {
            ws.send(JSON.stringify({ type: 'status', isGameReady: false, roomId: null, error: 'This game is full.' }));
            return;
        }

        if (userId && room.players.some((roomPlayer) => roomPlayer.userId === userId)) {
            ws.send(JSON.stringify({ type: 'status', isGameReady: false, roomId: null, error: 'You cannot play against yourself.' }));
            return;
        }

        player.userId = userId;
        player.displayName = displayName;
        player.boardSize = room.boardSize;
        player.roomId = room.id;
        player.color = 'R';
        room.players.push(player);
        this.players.push(player);
        this.sendRoomState(room);
    }

    private requestRematch(ws: WebSocket) {
        const room = this.getRoomForPlayer(ws);

        if (room?.isBotGame) {
            room.board = new Board(room.boardSize);
            room.currentPlayer = 'B';
            room.winner = '.';
            room.rematchPlayers.clear();
            this.sendRoomState(room);
            return;
        }

        if (room?.players.length !== 2) {
            return;
        }

        if (room.rematchPlayers.has(ws)) {
            return;
        }

        room.rematchPlayers.add(ws);
        if (room.rematchPlayers.size < 2) {
            const requester = room.players.find((player) => player.ws === ws);
            const opponent = room.players.find((player) => player.ws !== ws);
            if (opponent && opponent.ws.readyState === opponent.ws.OPEN) {
                opponent.ws.send(JSON.stringify({
                    type: 'rematch_requested',
                    requesterDisplayName: requester?.displayName ?? 'Opponent',
                    roomId: room.id,
                }));
            }
            return;
        }

        room.board = new Board(room.boardSize);
        room.currentPlayer = 'B';
        room.winner = '.';
        room.players.forEach((player) => {
            player.color = player.color === 'B' ? 'R' : 'B';
        });
        room.rematchPlayers.clear();
        this.sendRoomState(room);
    }

    private joinLobby(ws: WebSocket, requestedSize: number, userId: string | null = null, displayName: string | null = null) {
        const player = this.getConnectedPlayer(ws);
        if (!player) {
            return;
        }

        if (this.getRoomForPlayer(ws)) {
            return;
        }

        this.disconnectExistingSession(userId, ws);
        player.userId = userId ?? player.userId;
        player.displayName = displayName ?? player.displayName ?? null;

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

    private handleCreatePrivateRoom(ws: WebSocket, message: any) {
        const requestedSize = Number(message.boardSize);
        if (!Number.isNaN(requestedSize) && requestedSize > 1) {
            this.createPrivateRoom(ws, requestedSize, message.userId ?? null, message.displayName ?? null);
        }
    }

    private handleCreateBotGame(ws: WebSocket, message: any) {
    const requestedSize = Number(message.boardSize);

    if (!Number.isNaN(requestedSize) && requestedSize > 1) {
        this.createBotGame(
            ws,
            requestedSize,
            message.userId ?? null,
            message.displayName ?? null,
            message.difficulty === 'easy' ||
            message.difficulty === 'hard' ||
            message.difficulty === 'adaptive'
                ? message.difficulty
                : 'medium',
        );
    }
}

    private handleJoinPrivateRoom(ws: WebSocket, message: any) {
        if (typeof message.roomId === 'string') {
            this.joinPrivateRoom(ws, message.roomId, message.userId ?? null, message.displayName ?? null);
        }
    }

    private handleJoinLobby(ws: WebSocket, message: any) {
        const requestedSize = Number(message.boardSize);
        const userId = message.userId ?? null;
        const displayName = typeof message.displayName === 'string' ? message.displayName : null;
        if (!Number.isNaN(requestedSize) && requestedSize > 1) {
            this.joinLobby(ws, requestedSize, userId, displayName);
        }
    }

    public onMessage(ws: WebSocket, message: any) {
        switch (message.type) {
            case 'leave_room':
                this.leaveRoom(ws);
                return;
            case 'create_private_room':
                this.handleCreatePrivateRoom(ws, message);
                return;
            case 'create_bot_game':
                this.handleCreateBotGame(ws, message);
                return;
            case 'join_private_room':
                this.handleJoinPrivateRoom(ws, message);
                return;
            case 'request_rematch':
                this.requestRematch(ws);
                return;
            case 'join_lobby':
            case 'setup':
                this.handleJoinLobby(ws, message);
                return;
        }

        const room = this.getRoomForPlayer(ws);
        if (!room || room.id !== message.roomId) {
            return;
        }

        const playerColor = room.players.find((roomPlayer) => roomPlayer.ws === ws)?.color;
        if (
            message.type === 'move' &&
            playerColor !== undefined &&
            room.currentPlayer === playerColor &&
            Number.isInteger(message.x) &&
            Number.isInteger(message.y)
        ) {
            this.onMove(room, {
                x: message.x,
                y: message.y,
                color: playerColor,
            });
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
