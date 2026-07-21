import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// import { Board, MoveResult } from '../../gamey/Board';

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

// const board = new Board(8);

// Handle the events
wss.on('connection', (ws) => {
  console.log('Player connected');

  ws.on('message', (data) => {
    if (wss.clients.size < 2) return;

    console.log('Move received:', data.toString());

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(data.toString());
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
