import './GameOver.css';
import { useState } from 'react';
import { useAuth } from './Auth';
import { useAtomValue } from 'jotai';
import { myColorAtom, opponentDisplayNameAtom, opponentIdAtom, rematchRequesterAtom, isOpponentAvailableAtom } from './Atoms';

interface GameOverProps {
    readonly winner: 'B' | 'R';
    readonly eloBefore: number | null;
    readonly eloAfter: number | null;
    readonly onPlayAgain: () => void;
    readonly onRematch: () => void;
    readonly onMainMenu: () => void;
}

export default function GameOver({ winner, eloBefore, eloAfter, onPlayAgain, onRematch, onMainMenu }: GameOverProps) {
    const [hasRequestedRematch, setHasRequestedRematch] = useState(false);
    const { user } = useAuth();
    const myColor = useAtomValue(myColorAtom);
    const opponentDisplayName = useAtomValue(opponentDisplayNameAtom);
    const opponentId = useAtomValue(opponentIdAtom);
    const rematchRequester = useAtomValue(rematchRequesterAtom);
    const isOpponentAvailable = useAtomValue(isOpponentAvailableAtom);
    const winner_text = winner === myColor
        ? (user?.displayName ?? 'You')
        : (opponentDisplayName ?? 'Opponent');
    let rematchButtonText = 'Rematch';

    if (hasRequestedRematch) {
        rematchButtonText = 'Request sent';
    } else if (rematchRequester) {
        rematchButtonText = 'Accept rematch';
    }

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
                {rematchRequester && isOpponentAvailable ? (
                    <p className="rematch-message">{rematchRequester} requested a rematch.</p>
                ) : null}
                {!isOpponentAvailable ? (
                    <p className="rematch-message">Opponent left the game.</p>
                ) : null}
                <div className="game-over-actions">
                    <button type="button" className="play-again-btn" onClick={onPlayAgain}>
                        Play again
                    </button>
                    <button
                        type="button"
                        className="play-again-btn rematch-btn"
                        onClick={() => {
                            setHasRequestedRematch(true);
                            onRematch();
                        }}
                        disabled={!isOpponentAvailable || hasRequestedRematch}
                    >
                        {rematchButtonText}
                    </button>
                    <button type="button" className="play-again-btn" onClick={onMainMenu}>
                        Main menu
                    </button>
                </div>
            </div>
        </div>
    );
}
