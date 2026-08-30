import { useEffect, useState } from 'react';
import './GameOver.css';
import { useAuth } from './Auth';
import { useAtomValue } from 'jotai';
import { myColorAtom, opponentDisplayNameAtom, opponentIdAtom } from './Atoms';
import { loadStatistics } from './api';

interface GameOverProps {
    readonly winner: 'B' | 'R';
    readonly eloBefore: number | null;
    readonly onPlayAgain: () => void;
}

export default function GameOver({ winner, eloBefore, onPlayAgain }: GameOverProps) {
    const { user } = useAuth();
    const myColor = useAtomValue(myColorAtom);
    const opponentDisplayName = useAtomValue(opponentDisplayNameAtom);
    const opponentId = useAtomValue(opponentIdAtom);
    const [eloAfter, setEloAfter] = useState<number | null>(null);
    const winner_text = winner === myColor
        ? (user?.displayName ?? 'You')
        : (opponentDisplayName ?? 'Opponent');

    // TODO: Separate data (elo loading) from presentation (this)
    useEffect(() => {
        if (!user?.userId || !opponentId || eloBefore === null) {
            return;
        }

        let cancelled = false;
        let timeoutId: number | undefined;

        const loadUpdatedElo = async (attempt = 0) => {
            try {
                const statistics = await loadStatistics(user.userId);
                if (cancelled) return;

                if (statistics.elo !== eloBefore) {
                    setEloAfter(statistics.elo);
                    return;
                }

                if (attempt === 9) return;

                timeoutId = window.setTimeout(() => loadUpdatedElo(attempt + 1), 200);
            } catch (error) {
                console.error('Failed to load updated ELO:', error);
            }
        };

        void loadUpdatedElo();

        return () => {
            cancelled = true;
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [eloBefore, opponentId, user?.userId]);

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
