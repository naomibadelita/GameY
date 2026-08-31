import { describe, expect, test, vi } from 'vitest';
import { GameManager } from '../server/src/GameManager';

type ServerMessage = {
  type?: string;
  isGameReady?: boolean;
  boardSize?: number;
  roomId?: string | null;
  myColor?: string;
  displayName?: string;
  requesterDisplayName?: string;
  opponentDisplayName?: string;
  error?: string;
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
      close: vi.fn(),
    };

    const ws2: any = {
      readyState: 1,
      OPEN: 1,
      send: vi.fn(),
      close: vi.fn(),
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

  test('creates a private room before an opponent joins', () => {
    const gm = new GameManager(8);
    const ws: any = { readyState: 1, OPEN: 1, send: vi.fn() };

    gm.onConnection(ws);
    gm.onMessage(ws, {
      type: 'create_private_room',
      boardSize: 6,
      displayName: 'Guest-1',
    });

    const messages = parseSentMessages(ws.send);
    const roomId = messages.find((message) => message.type === 'status' && message.roomId)?.roomId;

    expect(roomId).toMatch(/^room-/);
    expect(messages.some((message) => message.type === 'status' && message.isGameReady === false)).toBe(true);
  });

  test('lets an anonymous player join a private room by its id', () => {
    const gm = new GameManager(8);
    const creator: any = { readyState: 1, OPEN: 1, send: vi.fn() };
    const guest: any = { readyState: 1, OPEN: 1, send: vi.fn() };

    gm.onConnection(creator);
    gm.onConnection(guest);
    gm.onMessage(creator, {
      type: 'create_private_room',
      boardSize: 10,
      displayName: 'Guest-1',
    });

    const roomId = parseSentMessages(creator.send)
      .find((message) => message.type === 'status' && message.roomId)?.roomId;

    gm.onMessage(guest, {
      type: 'join_private_room',
      roomId,
      displayName: 'Guest-2',
    });

    const creatorMessages = parseSentMessages(creator.send);
    const guestMessages = parseSentMessages(guest.send);

    expect(creatorMessages.some((message) => message.type === 'status' && message.isGameReady === true)).toBe(true);
    expect(guestMessages.some((message) => message.type === 'status' && message.isGameReady === true)).toBe(true);
    expect(creatorMessages.at(-3)?.opponentDisplayName).toBe('Guest-2');
    expect(guestMessages.at(-3)?.opponentDisplayName).toBe('Guest-1');
  });

  test('rejects a third player when a private room is full', () => {
    const gm = new GameManager(8);
    const creator: any = { readyState: 1, OPEN: 1, send: vi.fn() };
    const guest: any = { readyState: 1, OPEN: 1, send: vi.fn() };
    const thirdPlayer: any = { readyState: 1, OPEN: 1, send: vi.fn() };

    gm.onConnection(creator);
    gm.onConnection(guest);
    gm.onConnection(thirdPlayer);
    gm.onMessage(creator, { type: 'create_private_room', boardSize: 8 });
    const roomId = parseSentMessages(creator.send)
      .find((message) => message.type === 'status' && message.roomId)?.roomId;

    gm.onMessage(guest, { type: 'join_private_room', roomId });
    gm.onMessage(thirdPlayer, { type: 'join_private_room', roomId });

    const messages = parseSentMessages(thirdPlayer.send);
    expect(messages.some((message) => message.error === 'This game is full.')).toBe(true);
  });

  test('starts a new game after both players request a rematch', () => {
    const gm = new GameManager(8);
    const creator: any = { readyState: 1, OPEN: 1, send: vi.fn() };
    const guest: any = { readyState: 1, OPEN: 1, send: vi.fn() };

    gm.onConnection(creator);
    gm.onConnection(guest);
    gm.onMessage(creator, { type: 'create_private_room', boardSize: 8, displayName: 'Player' });
    const roomId = parseSentMessages(creator.send)
      .find((message) => message.type === 'status' && message.roomId)?.roomId;
    gm.onMessage(guest, { type: 'join_private_room', roomId, displayName: 'Guest' });

    const creatorInitialColor = parseSentMessages(creator.send)
      .filter((message) => message.type === 'init' && message.roomId)
      .at(-1)?.myColor;
    const guestInitialColor = parseSentMessages(guest.send)
      .filter((message) => message.type === 'init' && message.roomId)
      .at(-1)?.myColor;

    creator.send.mockClear();
    guest.send.mockClear();
    gm.onMessage(creator, { type: 'request_rematch' });

    expect(creator.send).not.toHaveBeenCalled();
    expect(parseSentMessages(guest.send)).toEqual([
      expect.objectContaining({
        type: 'rematch_requested',
        requesterDisplayName: 'Player',
        roomId,
      }),
    ]);

    gm.onMessage(guest, { type: 'request_rematch' });

    const creatorMessages = parseSentMessages(creator.send);
    const guestMessages = parseSentMessages(guest.send);
    expect(creatorMessages.some((message) => message.type === 'status' && message.isGameReady === true)).toBe(true);
    expect(guestMessages.some((message) => message.type === 'status' && message.isGameReady === true)).toBe(true);
    expect(creatorMessages.find((message) => message.type === 'init')?.myColor).not.toBe(creatorInitialColor);
    expect(guestMessages.find((message) => message.type === 'init')?.myColor).not.toBe(guestInitialColor);
  });
});
