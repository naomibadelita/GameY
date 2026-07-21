import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Board, MoveResult } from '../../gamey/Board';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 8080;

// Send webapp/dist/ to the visitor
const app = express();
const distPath = path.join(__dirname, '../../webapp/dist');
app.use(express.static(distPath));
app.get('{*splat}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Create the WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server });

const board = new Board(8);
let isP1Turn = true;

const colorMap: Record<number, string> = {
  1: 'B',
  2: 'R'
}

function serializeBoard(board: Board): string {
  let result = '';
  for (const row of board.rows) {
    for (const node of row) {
      result = result + node.color;
    }
  }
  return result;
}

// Handle the events
wss.on('connection', (ws) => {
  console.log('Player connected.');
  const s = wss.clients.size;
  const color = colorMap[s] ?? '.'
  ws.send(JSON.stringify({
    type: 'myColor',
    myColor: color
  }))

  ws.on('message', (rawData) => {
    if (wss.clients.size < 2) return;
    const data = JSON.parse(rawData.toString());
    if (data.type != 'move') return;
    const isP1 = data.color === 'B';
    if (isP1Turn !== isP1) return;

    const result = board.placePiece(data.y, data.x, data.color);
    if (result === MoveResult.OCCUPIED) return;

    isP1Turn = !isP1Turn;
    const winner = result === MoveResult.VICTORY ? data.color : '.'
    const message = {
      type: 'update',
      board: serializeBoard(board),
      isP1Turn: isP1Turn,
      winner: winner
    };

    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });

  ws.on('close', () => {
    console.log('Player disconnected.');
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
