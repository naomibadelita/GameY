import type { BoardState } from "../../shared/CellValue";

// const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
const API_BASE = 'http://localhost:3000';

function handleResponse(response: Response) {
  if (!response.ok) {
    return response.text().then(text => {
      throw new Error(text || response.statusText);
    });
  }
  return response.json();
}

export async function createGame(board: BoardState, currentPlayer = 'B', status = 'in-progress') {
  const response = await fetch(`${API_BASE}/game`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board, currentPlayer, status }),
  });
  return handleResponse(response);
}

export async function loadGame(id: string) {
  const response = await fetch(`${API_BASE}/game/${encodeURIComponent(id)}`);
  return handleResponse(response);
}

export async function saveGame(id: string, board: BoardState, currentPlayer: string, status: string) {
  const response = await fetch(`${API_BASE}/game/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board, currentPlayer, status }),
  });
  return handleResponse(response);
}
