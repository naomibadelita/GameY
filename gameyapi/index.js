const express = require('express');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const db = new sqlite3.Database(path.join(__dirname, 'gameys.db'));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

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
      photoUrl TEXT,

      createdAt INTEGER NOT NULL,
      lastActive INTEGER NOT NULL,

      matchesPlayed INTEGER NOT NULL,
      matchesWon INTEGER NOT NULL,
      elo INTEGER NOT NULL DEFAULT 1600
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      opponentId TEXT,
      isPlayer1 INTEGER NOT NULL,

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
      'INSERT INTO users (id, email, passwordHash, displayName, createdAt, lastActive, matchesPlayed, matchesWon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, email, passwordHash, displayName, now, now, 0, 0],
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
  const { board, isPlayer1, currentPlayer = 'B', status = 'in-progress' } = req.body;

  if (!board) {
    return res.status(400).json({ error: 'board is required' });
  }

  const now = Date.now();
  db.run(
    'INSERT INTO games (id, userId, isPlayer1, board, currentPlayer, status, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, req.userId, isPlayer1, JSON.stringify(board), currentPlayer, status, now],
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
      opponentId: row.opponentId,
      isPlayer1: row.isPlayer1,

      board: JSON.parse(row.board),
      currentPlayer: row.currentPlayer,
      status: row.status,
      updatedAt: row.updatedAt,
    });
  });
});

function updateElo(userId, opponentId, hasWon, callback) {
  db.all(
    'SELECT id, elo FROM users WHERE id IN (?, ?)',
    [userId, opponentId],
    (selectError, users) => {
      if (selectError) {
        callback(selectError);
        return;
      }

      const user = users.find((item) => item.id === userId);
      const opponent = users.find((item) => item.id === opponentId);
      if (!user || !opponent) {
        callback(new Error('Player not found'));
        return;
      }

      const expectedScore = 1 / (1 + Math.pow(10, (opponent.elo - user.elo) / 400));
      const actualScore = hasWon ? 1 : 0;
      const ratingChange = Math.round(32 * (actualScore - expectedScore));

      db.run(
        `UPDATE users
         SET elo = CASE id
           WHEN ? THEN ?
           WHEN ? THEN ?
         END
         WHERE id IN (?, ?)`,
        [
          userId,
          user.elo + ratingChange,
          opponentId,
          opponent.elo - ratingChange,
          userId,
          opponentId,
        ],
        callback
      );
    }
  );
}

function saveFinishedGame(board, winner, players) {
  return new Promise((resolve) => {
    const now = Date.now();
    players.filter((player) => player.userId).forEach((player) => {
      const opponent = players.find((item) => item.color !== player.color);
      const hasWon = player.color === winner;
      db.run(
        'INSERT INTO games (id, userId, opponentId, isPlayer1, board, currentPlayer, status, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [randomUUID(), player.userId, opponent?.userId ?? null, player.color === 'B', JSON.stringify(board), winner, 'finished', now]
      );
      db.run(
        'UPDATE users SET matchesPlayed = matchesPlayed + 1, matchesWon = matchesWon + ?, lastActive = ? WHERE id = ?',
        [hasWon ? 1 : 0, now, player.userId]
      );
    });

    if (players[0]?.userId && players[1]?.userId) {
      updateElo(players[0].userId, players[1].userId, players[0].color === winner, resolve);
    } else {
      resolve();
    }
  });
}

router.post('/game/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { board, opponentId, isPlayer1, currentPlayer, status } = req.body;

  if (!board) {
    return res.status(400).json({ error: 'board is required' });
  }

  const now = Date.now();
  db.run(
    'UPDATE games SET board = ?, opponentId = ?, currentPlayer = ?, status = ?, updatedAt = ? WHERE id = ? AND userId = ?',
    [JSON.stringify(board), opponentId, currentPlayer, status, now, id, req.userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }

      if (status === 'finished') {
        const hasWon = (isPlayer1 && currentPlayer === 'R') ||
          (!isPlayer1 && currentPlayer === 'B');

        return db.run(
          `UPDATE users
         SET matchesPlayed = matchesPlayed + 1,
             matchesWon = matchesWon + ?,
             lastActive = ?
         WHERE id = ?`,
          [hasWon ? 1 : 0, now, req.userId],
          function (userError) {
            if (userError) {
              return res.status(500).json({ error: userError.message });
            }
            if (!isPlayer1 || !opponentId) {
              return res.json({ id, board, currentPlayer, status, updatedAt: now });
            }

            updateElo(req.userId, opponentId, hasWon, (eloError) => {
              if (eloError) {
                return res.status(500).json({ error: eloError.message });
              }
              res.json({ id, board, currentPlayer, status, updatedAt: now });
            });
          }
        );
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

function hasUserWon(game) {
  const isPlayer1 = Boolean(game.isPlayer1);
  return (isPlayer1 && game.currentPlayer === 'B') ||
    (!isPlayer1 && game.currentPlayer === 'R');
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
          .filter(user => Object.hasOwn(data, user.id))
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
      const isRequestedCategory = category === 'all' || board.length === Number(category);
      if (isRequestedCategory && hasUserWon(game)) {
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

  if (metric === 'numOfWins') {
    return getLeaderboardByWins(res, category);
  }
  return res.status(404).json({ error: 'Metric not found' });
});

/// Public profile
async function loadProfile(uid) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [uid], (err, row) => {
      if (err) {
        reject(new HttpError(500, err.message));
        return;
      }
      if (!row) {
        reject(new HttpError(404, 'User not found'));
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
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(status).json(message);
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

function loadStatistics(uid) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT matchesPlayed, matchesWon, elo FROM users WHERE id = ?',
      [uid],
      (err, row) => {
        if (err) {
          reject(new HttpError(500, err.message));
          return;
        }
        if (!row) {
          reject(new HttpError(404, 'User not found'));
          return;
        }
        resolve({
          elo: row.elo,
          matchesPlayed: row.matchesPlayed,
          matchesWon: row.matchesWon,
          timePlayed: 0,
        });
      }
    );
  });
}

router.get('/statistics/:uid', verifyToken, async (req, res) => {
  const { uid } = req.params;
  try {
    res.json(await loadStatistics(uid));
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(status).json({ error: message });
  }
});

router.get('/history/:uid/:page/:limit', verifyToken, async (req, res) => {
  const { uid, page, limit } = req.params;
  try {
    const games = await getUserGames(uid, page, limit);
    const profile = await loadProfile(uid);
    const anonymousProfile = { displayName: 'Anonymous', photoUrl: undefined };
    const result = await Promise.all(games.map(async (game) => {
      const opponentProfile = game.opponentId
        ? await loadProfile(game.opponentId)
        : anonymousProfile;
      const isPlayer1 = Boolean(game.isPlayer1);
      const userWon = hasUserWon(game);

      return {
        player1: isPlayer1 ? profile : opponentProfile,
        player2: isPlayer1 ? opponentProfile : profile,
        winner: userWon === isPlayer1 ? 1 : 2,
        boardSize: JSON.parse(game.board).length,
      };
    }));
    res.json(result);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(status).json({ error: message });
  }
});

module.exports = Object.assign(router, { saveFinishedGame });
