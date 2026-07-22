import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServerManager } from './WebSocketServerManager';
import { GameManager } from './GameManager';

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

// Handle the connection and game logic
const wssm = new WebSocketServerManager(wss);
const gm = new GameManager(8);
wssm.subscribe(gm);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
