import './GameOver.css';
import { useAuth } from './Auth';
import { useAtomValue } from 'jotai';
import { myColorAtom, opponentDisplayNameAtom } from './Atoms';

interface GameOverProps {
    readonly winner: 'B' | 'R';
    readonly onPlayAgain: () => void;
}

export default function GameOver({ winner, onPlayAgain }: GameOverProps) {
    const { user } = useAuth();
    const myColor = useAtomValue(myColorAtom);
    const opponentDisplayName = useAtomValue(opponentDisplayNameAtom);
    const winner_text = winner === myColor
        ? (user?.displayName ?? 'You')
        : (opponentDisplayName ?? 'Opponent');

    return (
        <div className="game-over-page">
            <div className="game-over-content">
                <h1 className="game-over-title">GAME OVER</h1>
                <p className="game-over-winner">Winner: {winner_text}</p>
                <button type="button" className="play-again-btn" onClick={onPlayAgain}>
                    Play again
                </button>
            </div>
        </div>
    );
}
