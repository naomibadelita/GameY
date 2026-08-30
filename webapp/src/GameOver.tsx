import './GameOver.css';
import { useAuth } from './Auth';
import { useAtomValue } from 'jotai';
import { myColorAtom, opponentDisplayNameAtom, opponentIdAtom } from './Atoms';

interface GameOverProps {
    readonly winner: 'B' | 'R';
    readonly eloBefore: number | null;
    readonly eloAfter: number | null;
    readonly onPlayAgain: () => void;
}

export default function GameOver({ winner, eloBefore, eloAfter, onPlayAgain }: GameOverProps) {
    const { user } = useAuth();
    const myColor = useAtomValue(myColorAtom);
    const opponentDisplayName = useAtomValue(opponentDisplayNameAtom);
    const opponentId = useAtomValue(opponentIdAtom);
    const winner_text = winner === myColor
        ? (user?.displayName ?? 'You')
        : (opponentDisplayName ?? 'Opponent');

    return (
        <div className="game-over-page">
            <div className="game-over-content">
                <h1 className="game-over-title">GAME OVER</h1>
                <p className={`game-over-winner ${opponentId ? '' : 'game-over-winner-spaced'}`}>
                    Winner: {winner_text}
                </p>
                {opponentId && eloBefore !== null && eloAfter !== null && (
                    <p className={`game-over-elo ${eloAfter > eloBefore ? 'game-over-elo-increased' : 'game-over-elo-decreased'}`}>
                        ELO {eloBefore} → {eloAfter}
                    </p>
                )}
                <button type="button" className="play-again-btn" onClick={onPlayAgain}>
                    Play again
                </button>
            </div>
        </div>
    );
}
