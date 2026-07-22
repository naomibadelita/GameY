import { type WebSocket } from "ws";

export interface ISubscriber {
    onConnection(ws: WebSocket): void;
    onMessage(ws: WebSocket, message: any): void;
    onClose(ws: WebSocket): void;
}

export interface INotifier {
    subscribers: ISubscriber[];
    subscribe(subscriber: ISubscriber): void;
}