const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.disable('x-powered-by');
const port = process.env.PORT || 3000;
const db = new sqlite3.Database('gameys.db');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.userId = decoded.userId;
    req.email = decoded.email;
    req.displayName = decoded.displayName;
    next();
  });
};

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      displayName TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      board TEXT NOT NULL,
      currentPlayer TEXT NOT NULL,
      status TEXT NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register endpoint
app.post('/register', (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'email, password, and displayName are required' });
  }

  const userId = randomUUID();
  bcrypt.hash(password, 10, (err, passwordHash) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to hash password' });
    }

    const now = Date.now();
    db.run(
      'INSERT INTO users (id, email, passwordHash, displayName, createdAt) VALUES (?, ?, ?, ?, ?)',
      [userId, email, passwordHash, displayName, now],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: err.message });
        }

        const token = jwt.sign(
          { userId, email, displayName },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.status(201).json({
          userId,
          email,
          displayName,
          token,
        });
      }
    );
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    bcrypt.compare(password, user.passwordHash, (err, isPasswordValid) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to verify password' });
      }

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, displayName: user.displayName },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        token,
      });
    });
  });
});

// Get user profile endpoint
app.get('/profile', verifyToken, (req, res) => {
  res.json({
    userId: req.userId,
    email: req.email,
    displayName: req.displayName,
  });
});

app.post('/game', verifyToken, (req, res) => {
  const id = randomUUID();
  const { board, currentPlayer = 'B', status = 'in-progress' } = req.body;

  if (!board) {
    return res.status(400).json({ error: 'board is required' });
  }

  const now = Date.now();
  db.run(
    'INSERT INTO games (id, userId, board, currentPlayer, status, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id, req.userId, JSON.stringify(board), currentPlayer, status, now],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, board, currentPlayer, status, updatedAt: now });
    }
  );
});

app.get('/game/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM games WHERE id = ? AND userId = ?', [id, req.userId], (err, row) => {
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

app.post('/game/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { board, currentPlayer, status } = req.body;

  if (!board) {
    return res.status(400).json({ error: 'board is required' });
  }

  const now = Date.now();
  db.run(
    'UPDATE games SET board = ?, currentPlayer = ?, status = ?, updatedAt = ? WHERE id = ? AND userId = ?',
    [JSON.stringify(board), currentPlayer, status, now, id, req.userId],
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
