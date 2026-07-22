import { useState } from 'react';
import './App.css'
import GameBoard from './GameBoard';
import GameOver from './GameOver';

function App() {
  const defaultBoardSize = 4;
  const [gameState, setGameState] = useState<'playing' | 'over'>('playing');
  const [winner, setWinner] = useState<'B' | 'R' | null>(null);

  const handleGameOver = (winnerColor: 'B' | 'R') => {
    setWinner(winnerColor);
    setGameState('over');
  };

  const handlePlayAgain = () => {
    setGameState('playing');
    setWinner(null);
    window.location.reload();
  };

  return (
    <div className="app-container">
      <h1>Game Y</h1>
      {gameState === 'playing' ? (
        <GameBoard boardSize={defaultBoardSize} onGameOver={handleGameOver} />
      ) : (
        <GameOver winner={winner!} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}

export default App
