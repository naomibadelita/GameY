import { expect, test, vi } from 'vitest';
import { GameManager } from '../server/src/GameManager';

type SentMessage = {
    type?: string;
    board?: string;
    roomId?: string | null;
    isGameReady?: boolean;
};

function getMessages(sendMock: ReturnType<typeof vi.fn>): SentMessage[] {
    return sendMock.mock.calls.map((call: unknown[]) => JSON.parse(String(call[0])) as SentMessage);
}

test('responds with a bot move after a player move and ignores the client color', () => {
    const gameManager = new GameManager(8);
    const send = vi.fn();
    const ws: any = {
        readyState: 1,
        OPEN: 1,
        send,
    };

    gameManager.onConnection(ws);
    gameManager.onMessage(ws, {
        type: 'create_bot_game',
        boardSize: 8,
        displayName: 'Player',
    });

    const roomId = getMessages(send)
        .find((message) => message.type === 'status' && message.roomId)?.roomId;

    gameManager.onMessage(ws, {
        type: 'move',
        roomId,
        x: 0,
        y: 0,
        color: 'R',
    });

    const updates = getMessages(send).filter((message) => message.type === 'update');
    const latestBoard = updates.at(-1)?.board ?? '';
    const occupiedCells = [...latestBoard].filter((cell) => cell !== '.');

    expect(occupiedCells).toHaveLength(2);
    expect(latestBoard).toContain('B');
    expect(latestBoard).toContain('R');
});
