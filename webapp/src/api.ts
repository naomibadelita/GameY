import type { BoardState } from "../../shared/CellValue";
import { isLeaderboardCategory, isLeaderboardMetric, type LeaderboardCategory, type LeaderboardMetric } from "./leaderboard/domain/leaderboard.types";
import type { Profile } from "./statistics/domain/profile.entity";
import type { MatchData, StatisticsData } from "./statistics/domain/statistics.entity";

const API_BASE = '/api';

function handleResponse(response: Response) {
  if (!response.ok) {
    return response.text().then(text => {
      throw new Error(text || response.statusText);
    });
  }
  return response.json();
}

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateUuid(uuid: string): string {
  if (!UUID_PATTERN.test(uuid)) {
    throw new Error('Invalid UUID');
  }

  return uuid;
}

export async function createGame(board: BoardState, isPlayer1: boolean, currentPlayer = 'B', status = 'in-progress') {
  const response = await fetch(`${API_BASE}/game`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ board, isPlayer1, currentPlayer, status }),
  });
  return handleResponse(response);
}

export async function loadGame(id: string) {
  const validId = validateUuid(id);
  const response = await fetch(`${API_BASE}/game/${encodeURIComponent(validId)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function saveGame(id: string, board: BoardState, opponentId: string | null, isPlayer1: boolean, currentPlayer: string, status: string) {
  const validId = validateUuid(id);
  const validOpponentId = opponentId ? validateUuid(opponentId) : null;
  const response = await fetch(`${API_BASE}/game/${encodeURIComponent(validId)}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ board, opponentId: validOpponentId, isPlayer1, currentPlayer, status }),
  });
  return handleResponse(response);
}

export async function loadLeaderboard(category: LeaderboardCategory, metric: LeaderboardMetric) {
  if (!isLeaderboardCategory(category) || !isLeaderboardMetric(metric)) {
    throw new Error('Invalid leaderboard parameters');
  }

  const response = await fetch(`${API_BASE}/leaderboard/${encodeURIComponent(category)}/${encodeURIComponent(metric)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function loadProfile(uid: string): Promise<Profile> {
  const validUid = validateUuid(uid);
  const response = await fetch(`${API_BASE}/profile/${encodeURIComponent(validUid)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

export async function loadStatistics(uid: string): Promise<StatisticsData> {
  const validUid = validateUuid(uid);
  const response = await fetch(`${API_BASE}/statistics/${encodeURIComponent(validUid)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

export async function loadHistory(uid: string, page: number, limit: number): Promise<MatchData[]> {
  const validUid = validateUuid(uid);
  const response = await fetch(`${API_BASE}/history/${encodeURIComponent(validUid)}/${page}/${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}
