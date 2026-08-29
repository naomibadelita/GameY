const express = require('express');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { resolve } = require('node:dns');

const router = express.Router();
const db = new sqlite3.Database(path.join(__dirname, 'gameys.db'));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register endpoint
router.post('/register', (req, res) => {
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
router.post('/login', (req, res) => {
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

router.post('/game', verifyToken, (req, res) => {
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

router.get('/game/:id', verifyToken, (req, res) => {
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

router.post('/game/:id', verifyToken, (req, res) => {
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

function getGamesData(processData, offset = 0, limit = -1) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * 
      FROM games 
      WHERE status = ? 
      ORDER BY updatedAt DESC 
      LIMIT ? 
      OFFSET ? 
      `, ['finished', limit, offset], (gamesError, games) => {
      if (gamesError) {
        reject(gamesError);
        return;
      }
      const data = {};
      for (const game of games) {
        data[game.userId] = processData(game, data[game.userId]);
      }
      resolve(data);
    });
  });
}

async function replaceUidWithName(data) {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, displayName FROM users', [], (usersError, users) => {
      if (usersError) {
        reject(usersError)
        return;
      }
      const items = Object.fromEntries(
        users
          .filter(user => data[user.id])
          .map(user => [user.displayName, data[user.id]])
      );
      resolve(items);
    });
  });
}

async function getLeaderboardByWins(res, category) {
  try {
    let items = await getGamesData((game, numOfWins = 0) => {
      const board = JSON.parse(game.board);
      if (
        game.currentPlayer === 'R' &&
        category === 'all' ||
        board.length === Number(category)
      ) {
        return numOfWins + 1;
      }
      return numOfWins;
    });
    items = await replaceUidWithName(items);
    items = Object.entries(items).map(([displayName, numOfWins]) => ({
      playerName: displayName,
      numOfWins: numOfWins,
    }));
    items = items.sort((first, second) => second.numOfWins - first.numOfWins);
    res.json({ items });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

router.get('/leaderboard/:category/:metric', verifyToken, (req, res) => {
  const { category, metric } = req.params;

  switch (metric) {
    case 'numOfWins':
      return getLeaderboardByWins(res, category);

    default:
      return res.status(404).json({ error: 'Metric not found' });
  }
});

/// Public profile

async function loadProfile(uid) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [uid], (err, row) => {
      if (err) {
        reject({ status: 500, error: err.message });
        return;
      }
      if (!row) {
        reject({ status: 404, error: 'User not found' });
        return;
      }
      resolve({
        displayName: row.displayName,
        photoUrl: row.photoUrl, // may be undefined, but it's ok
      });
    });
  });
}
router.get('/profile/:uid', verifyToken, async (req, res) => {
  const { uid } = req.params;
  try {
    res.json(await loadProfile(uid));
  } catch (err) {
    res.status(err.status).json(err.error);
  }
});

function getUserGames(uid, page = 0, limit = -1) {
  const offset = page * limit;
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * 
      FROM games 
      WHERE status = ? AND userId = ?
      ORDER BY updatedAt DESC 
      LIMIT ? 
      OFFSET ? 
      `, ['finished', uid, limit, offset], (gamesError, games) => {
      if (gamesError) {
        reject(gamesError);
        return;
      }
      resolve(games);
    });
  });
}

router.get('/statistics/:uid', verifyToken, async (req, res) => {
  const { uid } = req.params;
  const games = await getUserGames(uid);
  res.json({
    elo: 1600,
    matchesPlayed: games.length,
    matchesWon: games.length,
    timePlayed: 0,
  });
});

router.get('/history/:uid/:page/:limit', verifyToken, async (req, res) => {
  const { uid, page, limit } = req.params;
  const games = await getUserGames(uid, page, limit);
  const profile = await loadProfile(uid);
  const result = games.map((game) => ({
    player1: profile,
    player2: { displayName: 'Anonymous' },
    winner: 1,
    boardSize: JSON.parse(game.board).length,
  }));
  res.json(result);
});

module.exports = router;
