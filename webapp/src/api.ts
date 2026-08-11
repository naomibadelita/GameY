export type CellValue = '.' | 'B' | 'R';
export type BoardState = CellValue[][];

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

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

// xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateGameId(id: string): string {
  if (!UUID_PATTERN.test(id)) {
    throw new Error('Invalid game ID');
  }

  return id;
}

export async function createGame(board: BoardState, currentPlayer = 'B', status = 'in-progress') {
  const response = await fetch(`${API_BASE}/game`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ board, currentPlayer, status }),
  });
  return handleResponse(response);
}

export async function loadGame(id: string) {
  const validId = validateGameId(id);
  const response = await fetch(`${API_BASE}/game/${encodeURIComponent(validId)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function saveGame(id: string, board: BoardState, currentPlayer: string, status: string) {
  const validId = validateGameId(id);
  const response = await fetch(`${API_BASE}/game/${encodeURIComponent(validId)}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ board, currentPlayer, status }),
  });
  return handleResponse(response);
}
