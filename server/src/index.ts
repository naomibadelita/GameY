import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServerManager } from './WebSocketServerManager';
import { GameManager } from './GameManager';
import { loadBotModel } from '../../gamey/BotModelLoader';
import { loadQModel } from '../../training/QModelLoader';
import gameyApiRouter from '../../gameyapi/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configuredPort = Number(process.env.PORT);
const PORT = Number.isInteger(configuredPort) && configuredPort > 0
  ? configuredPort
  : 8080;
const configuredBoardSize = Number(process.env.DEFAULT_BOARD_SIZE);
const DEFAULT_BOARD_SIZE = Number.isInteger(configuredBoardSize) && configuredBoardSize > 1
  ? configuredBoardSize
  : 8;

// Send webapp/dist/ to the visitor
const app = express();
const distPath = path.join(__dirname, '../../webapp/dist');
const avatarsPath = path.join(__dirname, '../../assets/avatars');
app.use(express.json());
app.use('/api', gameyApiRouter);
app.use('/avatars', express.static(avatarsPath));
app.use(express.static(distPath));
app.get(/^\/(?!api|ws).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Create the WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Handle the connection and game logic
const wssm = new WebSocketServerManager(wss);
const botModel = await loadBotModel(
  new URL('../../training/bot-model.json', import.meta.url),
);
const qModel = await loadQModel(
  new URL('../../training/q-model.json', import.meta.url),
);
console.log(`Loaded bot model version ${botModel.version}.`);
console.log(`Loaded Q-model version ${qModel.version} with ${Object.keys(qModel.values).length} learned values.`);
const gm = new GameManager(DEFAULT_BOARD_SIZE, botModel, qModel);
wssm.subscribe(gm);

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Start the server with another port, ` +
      'for example: $env:PORT="8081"; npm run dev',
    );
    process.exitCode = 1;
    return;
  }

  console.error('Server failed to start:', error);
  process.exitCode = 1;
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
