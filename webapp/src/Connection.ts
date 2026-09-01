import { gameSocketService } from './services/gameSocketService';

export { gameSocketService };

export function sendMessage(message: Record<string, unknown>): void {
    gameSocketService.sendMessage(message);
}

// Backwards compatibility: ensure WebSocket connection is established
gameSocketService.connect();

