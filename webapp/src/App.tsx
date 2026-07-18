import { useState } from 'react'
import './App.css'
import GameBoard from './GameBoard';

function App() {
    const defaultBoardSize = 8;

  return (
    <div className="app-container">
      <h1>Game Hex</h1>
      <GameBoard boardSize={defaultBoardSize} />
    </div>
  );
}

export default App
