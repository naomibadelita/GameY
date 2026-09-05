import type { LeaderboardCategory, LeaderboardMetric } from "./leaderboard/domain/leaderboard.types";
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

function getLeaderboardCategoryPath(category: LeaderboardCategory): string {
  switch (category) {
    case 'all': return 'all';
    case '6': return '6';
    case '8': return '8';
    case '10': return '10';
    default:
      throw new Error('Invalid leaderboard category');
  }
}

function getLeaderboardMetricPath(metric: LeaderboardMetric): string {
  if (metric === 'numOfWins') {
    return 'numOfWins';
  }
  throw new Error('Invalid leaderboard metric');
}

export async function loadLeaderboard(category: LeaderboardCategory, metric: LeaderboardMetric) {
  const categoryPath = getLeaderboardCategoryPath(category);
  const metricPath = getLeaderboardMetricPath(metric);

  const response = await fetch(`${API_BASE}/leaderboard/${categoryPath}/${metricPath}`, {
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

export async function setProfilePhotoUrl(photoUrl: string | null): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profile/photo`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ photoUrl }),
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
