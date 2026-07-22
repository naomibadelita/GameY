import { type WebSocket } from "ws";
import { Board, MoveResult } from '../../gamey/Board';
import { ISubscriber } from './Interfaces';

export class GameManager implements ISubscriber {
    board: Board;
    currentPlayer: 'R' | 'B' = 'B';
    availableColors = ['R', 'B'];
    playerConnections: WebSocket[] = [];
    constructor(size: number) {
        this.board = new Board(size);
    }

    private serializeBoard(): string {
        let result = '';
        for (const row of this.board.rows) {
            for (const node of row) {
                result = result + node.color;
            }
        }
        return result;
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
        this.playerConnections.forEach((client) => {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    public onConnection(ws: WebSocket) {
        console.log('Player connected.');
        const color = this.availableColors.length > 0
            ? this.availableColors.pop() : '.'
        ws.send(JSON.stringify({
            type: 'myColor',
            myColor: color
        }));
        this.playerConnections.push(ws);
    }

    public onMessage(ws: WebSocket, message: any) {
        if (this.playerConnections.length < 2 || this.currentPlayer !== message.color) {
            return;
        }

        if (message.type === 'move') this.onMove(message);
    }

    public onClose(ws: WebSocket) {
        console.log('Player disconnected.');
        this.playerConnections = this.playerConnections.filter(conn => conn !== ws);
    }
}