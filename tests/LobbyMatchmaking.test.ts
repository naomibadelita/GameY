import { describe, expect, test, vi } from 'vitest';
import { GameManager } from '../server/src/GameManager';

type ServerMessage = {
  type?: string;
  isGameReady?: boolean;
  boardSize?: number;
  roomId?: string | null;
  myColor?: string;
  displayName?: string;
  opponentDisplayName?: string;
};

const parseSentMessages = (sendMock: ReturnType<typeof vi.fn>): ServerMessage[] =>
  sendMock.mock.calls.map((call: unknown[]) => JSON.parse(String(call[0])) as ServerMessage);

describe('GameManager lobby matchmaking', () => {
  test('keeps players in waiting when they choose different board sizes', () => {
    const gm = new GameManager(8);

    const ws1: any = {
      readyState: 1,
      OPEN: 1,
      send: vi.fn(),
    };

    const ws2: any = {
      readyState: 1,
      OPEN: 1,
      send: vi.fn(),
    };

    gm.onConnection(ws1);
    gm.onConnection(ws2);

    gm.onMessage(ws1, { type: 'join_lobby', boardSize: 8 });
    gm.onMessage(ws2, { type: 'join_lobby', boardSize: 6 });

    const payloads1 = parseSentMessages(ws1.send);
    const payloads2 = parseSentMessages(ws2.send);

    const player1Waiting = payloads1.some((message: ServerMessage) => message.type === 'status' && message.isGameReady === false);
    const player2Waiting = payloads2.some((message: ServerMessage) => message.type === 'status' && message.isGameReady === false);

    expect(player1Waiting).toBe(true);
    expect(player2Waiting).toBe(true);
  });

  test('matches players when they choose the same board size', () => {
    const gm = new GameManager(8);

    const ws1: any = {
      readyState: 1,
      OPEN: 1,
      send: vi.fn(),
    };

    const ws2: any = {
      readyState: 1,
      OPEN: 1,
      send: vi.fn(),
    };

    gm.onConnection(ws1);
    gm.onConnection(ws2);

    gm.onMessage(ws1, { type: 'join_lobby', boardSize: 8, userId: 'user-1' });
    gm.onMessage(ws2, { type: 'join_lobby', boardSize: 8, userId: 'user-2' });

    const payloads1 = parseSentMessages(ws1.send);
    const payloads2 = parseSentMessages(ws2.send);

    const readyForPlayer1 = payloads1.some((message: ServerMessage) => message.type === 'status' && message.isGameReady === true);
    const readyForPlayer2 = payloads2.some((message: ServerMessage) => message.type === 'status' && message.isGameReady === true);
    const roomIds = payloads1
      .concat(payloads2)
      .filter((message: ServerMessage) => message.roomId)
      .map((message: ServerMessage) => message.roomId);

    expect(readyForPlayer1).toBe(true);
    expect(readyForPlayer2).toBe(true);
    expect(roomIds.length).toBeGreaterThan(0);
    expect(new Set(roomIds).size).toBe(1);

    const player1Init = payloads1.find((message: ServerMessage) => message.type === 'init' && message.roomId);
    const player2Init = payloads2.find((message: ServerMessage) => message.type === 'init' && message.roomId);

    expect(player1Init?.myColor).toBe('B');
    expect(player2Init?.myColor).toBe('R');
  });

  test('does not match the same user against themselves even with the same board size', () => {
    const gm = new GameManager(8);

    const ws1: any = {
      readyState: 1,
      OPEN: 1,
      send: vi.fn(),
    };

    const ws2: any = {
      readyState: 1,
      OPEN: 1,
      send: vi.fn(),
    };

    gm.onConnection(ws1);
    gm.onConnection(ws2);

    gm.onMessage(ws1, { type: 'join_lobby', boardSize: 8, userId: 'same-user' });
    gm.onMessage(ws2, { type: 'join_lobby', boardSize: 8, userId: 'same-user' });

    const payloads1 = parseSentMessages(ws1.send);
    const payloads2 = parseSentMessages(ws2.send);

    const firstPlayerGameReady = payloads1.some((message: ServerMessage) => message.type === 'status' && message.isGameReady === true);
    const secondPlayerGameReady = payloads2.some((message: ServerMessage) => message.type === 'status' && message.isGameReady === true);

    expect(firstPlayerGameReady).toBe(false);
    expect(secondPlayerGameReady).toBe(false);
  });

  test('shares each player\'s real opponent name once matched', () => {
    const gm = new GameManager(8);

    const ws1: any = {
      readyState: 1,
      OPEN: 1,
      send: vi.fn(),
    };

    const ws2: any = {
      readyState: 1,
      OPEN: 1,
      send: vi.fn(),
    };

    gm.onConnection(ws1);
    gm.onConnection(ws2);

    gm.onMessage(ws1, { type: 'join_lobby', boardSize: 8, userId: 'user-1', displayName: 'Alice' });
    gm.onMessage(ws2, { type: 'join_lobby', boardSize: 8, userId: 'user-2', displayName: 'Bob' });

    const payloads1 = parseSentMessages(ws1.send);
    const payloads2 = parseSentMessages(ws2.send);

    const player1Init = payloads1.find((message: ServerMessage) => message.type === 'init' && 'opponentDisplayName' in message);
    const player2Init = payloads2.find((message: ServerMessage) => message.type === 'init' && 'opponentDisplayName' in message);

    expect(player1Init?.opponentDisplayName).toBe('Bob');
    expect(player2Init?.opponentDisplayName).toBe('Alice');
  });

  test('lets the first player to rejoin the lobby start the rematch', () => {
    const gm = new GameManager(8);

    const ws1: any = { readyState: 1, OPEN: 1, send: vi.fn() };
    const ws2: any = { readyState: 1, OPEN: 1, send: vi.fn() };

    gm.onConnection(ws1);
    gm.onConnection(ws2);
    gm.onMessage(ws1, { type: 'join_lobby', boardSize: 8, userId: 'user-1' });
    gm.onMessage(ws2, { type: 'join_lobby', boardSize: 8, userId: 'user-2' });

    gm.onMessage(ws2, { type: 'leave_room' });
    gm.onMessage(ws2, { type: 'join_lobby', boardSize: 8, userId: 'user-2' });
    gm.onMessage(ws1, { type: 'join_lobby', boardSize: 8, userId: 'user-1' });

    const player1RematchInit = parseSentMessages(ws1.send)
      .filter((message: ServerMessage) => message.type === 'init' && message.roomId)
      .at(-1);
    const player2RematchInit = parseSentMessages(ws2.send)
      .filter((message: ServerMessage) => message.type === 'init' && message.roomId)
      .at(-1);

    expect(player1RematchInit?.myColor).toBe('R');
    expect(player2RematchInit?.myColor).toBe('B');
  });
});
