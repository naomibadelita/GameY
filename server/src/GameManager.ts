import { type WebSocket } from "ws";
import { Board, MoveResult } from '../../gamey/Board';
import { ISubscriber } from './Interfaces';
import { type CellValue } from "../../shared/CellValue";

class PlayerData {
    ws: WebSocket;
    color: CellValue;
    constructor(ws: WebSocket, color: CellValue) {
        this.ws = ws;
        this.color = color;
    }
}

export class GameManager implements ISubscriber {
    board: Board;
    boardSize: number;
    currentPlayer: 'R' | 'B' = 'B';
    availableColors: CellValue[] = ['R', 'B'];
    players: PlayerData[] = [];
    constructor(size: number) {
        this.board = new Board(size);
        this.boardSize = size;
    }

    private serializeBoard(): string {
        let result = '';
        for (const row of this.board.rows) {
            for (const node of row) {
                result = result + node.color;
            }
        }
        return result;
        // return JSON.stringify(this.board.rows.map(row => row.map(node => node.color)));
    }

    private changeCurrentPlayer() {
        this.currentPlayer = this.currentPlayer === 'B' ? 'R' : 'B';
    }

    private onMove(data: any) {
        const result = this.board.placePiece(data.y, data.x, data.color);
        if (result === MoveResult.OCCUPIED) return;

        this.changeCurrentPlayer();
        const winner = result === MoveResult.VICTORY ? data.color : '.'
        const message = {
            type: 'update',
            board: this.serializeBoard(),
            isP1Turn: this.currentPlayer === 'B',
            winner: winner
        };
        console.log(this.serializeBoard());
        this.players.forEach((player) => {
            if (player.ws.readyState === player.ws.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        });
    }

    public onConnection(ws: WebSocket) {
        console.log('Player connected.');
        console.log(`Available colors: ${this.availableColors.toString()}`);
        const color: CellValue = this.availableColors.length > 0
            ? this.availableColors.pop()! : '.'
        ws.send(JSON.stringify({
            type: 'init',
            myColor: color,
            boardSize: this.boardSize,
        }));
        this.players.push(new PlayerData(ws, color));
    }

    public onMessage(ws: WebSocket, message: any) {
        if (this.players.length < 2 || this.currentPlayer !== message.color) {
            return;
        }

        if (message.type === 'move') this.onMove(message);
    }

    public onClose(ws: WebSocket) {
        const color = this.players.find(player => player.ws == ws)!.color
        if (color !== '.') this.availableColors.push(color);
        this.players = this.players.filter(player => player.ws != ws);
        this.board.reset();
        console.log(`Player ${color} disconnected.`);
    }
}