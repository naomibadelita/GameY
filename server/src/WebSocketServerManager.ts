import { WebSocketServer } from "ws";
import { INotifier, ISubscriber } from "./Interfaces";

export class WebSocketServerManager implements INotifier {
    subscribers: ISubscriber[] = [];
    wss: WebSocketServer;
    constructor(wss: WebSocketServer) {
        this.wss = wss;
        this.wss.on('connection', (ws) => {
            this.subscribers.forEach((subscriber) => subscriber.onConnection(ws));

            ws.on('message', (rawData) => {
                const message = JSON.parse(rawData.toString());
                this.subscribers.forEach((subscriber) => subscriber.onMessage(ws, message));
            });

            ws.on('close', () => {
                this.subscribers.forEach((subscriber) => subscriber.onClose(ws));
            });
        });

    }

    subscribe(subscriber: ISubscriber): void {
        this.subscribers.push(subscriber);
    }
}