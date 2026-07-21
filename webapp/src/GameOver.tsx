import './GameOver.css';

interface GameOverProps {
    readonly winner: 'B' | 'R';
    readonly onPlayAgain: () => void;
}

export default function GameOver({ winner, onPlayAgain }: GameOverProps) {
    const winner_text = winner === 'B'
        ? 'Jucător 1 (Albastru - B)'
        : 'Jucător 2 (Roșu - R)';

    return (
        <div className="game-over-page">
            <div className="game-over-content">
                <h1 className="game-over-title">GAME OVER</h1>
                <p className="game-over-winner">Winner: {winner_text}</p>
                <button className="play-again-btn" onClick={onPlayAgain}>
                    Joacă Din Nou
                </button>
            </div>
        </div>
    );
}
