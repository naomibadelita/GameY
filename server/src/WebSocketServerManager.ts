import { WebSocket, WebSocketServer } from "ws";
import { INotifier, ISubscriber } from "./Interfaces";

export class WebSocketServerManager implements INotifier {
    public subscribers: ISubscriber[] = [];
    public readonly wss: WebSocketServer;

    constructor(wss: WebSocketServer) {
        this.wss = wss;
        this.init();
    }

    private init(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            this.notifyConnection(ws);

            ws.on('message', (rawData) => {
                this.handleIncomingMessage(ws, rawData);
            });

            ws.on('close', () => {
                this.notifyClose(ws);
            });

            ws.on('error', (err) => {
                console.error('WebSocket client connection error:', err);
            });
        });
    }

    public subscribe(subscriber: ISubscriber): void {
        if (!this.subscribers.includes(subscriber)) {
            this.subscribers.push(subscriber);
        }
    }

    public unsubscribe(subscriber: ISubscriber): void {
        this.subscribers = this.subscribers.filter((s) => s !== subscriber);
    }

    private handleIncomingMessage(ws: WebSocket, rawData: unknown): void {
        try {
            const message = JSON.parse(String(rawData));
            this.notifyMessage(ws, message);
        } catch (error) {
            console.warn('Received malformed WebSocket payload; discarding.', error);
        }
    }

    private notifyConnection(ws: WebSocket): void {
        for (const subscriber of this.subscribers) {
            subscriber.onConnection(ws);
        }
    }

    private notifyMessage(ws: WebSocket, message: Record<string, unknown>): void {
        for (const subscriber of this.subscribers) {
            subscriber.onMessage(ws, message);
        }
    }

    private notifyClose(ws: WebSocket): void {
        for (const subscriber of this.subscribers) {
            subscriber.onClose(ws);
        }
    }
}