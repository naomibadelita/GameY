const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { randomUUID } = require('node:crypto');

const app = express();
app.disable('x-powered-by');
const port = process.env.PORT || 3000;
const db = new sqlite3.Database('gameys.db');

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      board TEXT NOT NULL,
      currentPlayer TEXT NOT NULL,
      status TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/game', (req, res) => {
  const id = randomUUID();
  const { board, currentPlayer = 'B', status = 'in-progress' } = req.body;

  if (!board) {
    return res.status(400).json({ error: 'board is required' });
  }

  const now = Date.now();
  db.run(
    'INSERT INTO games (id, board, currentPlayer, status, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [id, JSON.stringify(board), currentPlayer, status, now],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, board, currentPlayer, status, updatedAt: now });
    }
  );
});

app.get('/game/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM games WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      id: row.id,
      board: JSON.parse(row.board),
      currentPlayer: row.currentPlayer,
      status: row.status,
      updatedAt: row.updatedAt,
    });
  });
});

app.post('/game/:id', (req, res) => {
  const { id } = req.params;
  const { board, currentPlayer, status } = req.body;

  if (!board) {
    return res.status(400).json({ error: 'board is required' });
  }

  const now = Date.now();
  db.run(
    'UPDATE games SET board = ?, currentPlayer = ?, status = ?, updatedAt = ? WHERE id = ?',
    [JSON.stringify(board), currentPlayer, status, now, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }
      res.json({ id, board, currentPlayer, status, updatedAt: now });
    }
  );
});

app.listen(port, () => {
  console.log(`GameY API listening at http://localhost:${port}`);
});
