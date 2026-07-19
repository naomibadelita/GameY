import express from 'express';
import { execFileSync } from 'node:child_process';

const app = express();
const PORT = 8080;

const PYTHON = process.env.PYTHON_PATH || 'python';

app.disable('x-powered-by');
app.use(express.json());

let currentGameBoard = null;

// 1. Endpoint to initialize or reset the game session
app.get('/game/start', (req, res) => {
    try {
        const pythonOutput = execFileSync(
            PYTHON,
            [
                '../gamey/cli.py',
                '--action',
                'init'
            ],
            {
                encoding: 'utf8'
            }
        );

        currentGameBoard = JSON.parse(pythonOutput);

        console.log("New game initialized via Python engine!");
        res.status(200).json(currentGameBoard);

    } catch (error) {
        console.error("Initialization failed:", error);
        res.status(500).json({
            error: "Failed to execute board.py: " + error.message
        });
    }
});

// 2. Endpoint to process and validate a player's move
app.post('/game/move', (req, res) => {

    const { x, y, z, player } = req.body;

    if (currentGameBoard === null) {
        return res.status(400).json({
            error: "Game session not started. Please call /game/start first."
        });
    }

    try {

        const pythonOutput = execFileSync(
            PYTHON,
            [
                '../gamey/cli.py',
                '--action', 'move',
                '--board', JSON.stringify(currentGameBoard),
                '--x', String(x),
                '--y', String(y),
                '--z', String(z),
                '--player', String(player)
            ],
            {
                encoding: 'utf8'
            }
        );

        const result = JSON.parse(pythonOutput);

        if (result.error) {
            return res.status(400).json({ error: result.error });
        }

        currentGameBoard = result.updatedBoard;

        res.status(200).json(currentGameBoard);

    } catch (error) {
        console.error("Move processing exception:", error);

        res.status(400).json({
            error: "Invalid move or error inside the Python engine rules: " + error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 GameY API server running on http://localhost:${PORT}`);
});