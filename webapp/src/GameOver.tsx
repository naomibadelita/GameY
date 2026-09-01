import './GameOver.css';
import { useGameOverViewModel } from './hooks/useGameOverViewModel';

interface GameOverProps {
    readonly winner: 'B' | 'R';
    readonly eloBefore: number | null;
    readonly eloAfter: number | null;
    readonly onPlayAgain: () => void;
    readonly onRematch: () => void;
    readonly onMainMenu: () => void;
}

export default function GameOver({ winner, eloBefore, eloAfter, onPlayAgain, onRematch, onMainMenu }: GameOverProps) {
    const { state, actions } = useGameOverViewModel({
        winner,
        eloBefore,
        eloAfter,
        onRematch,
    });

    return (
        <div className="game-over-page">
            <div className="game-over-content">
                <h1 className="game-over-title">GAME OVER</h1>
                <p className={`game-over-winner ${state.opponentId ? '' : 'game-over-winner-spaced'}`}>
                    Winner: {state.winnerText}
                </p>
                {state.showElo && (
                    <p className={`game-over-elo ${state.isEloIncreased ? 'game-over-elo-increased' : 'game-over-elo-decreased'}`}>
                        ELO {state.eloBefore} → {state.eloAfter}
                    </p>
                )}
                {state.rematchRequester && state.isOpponentAvailable ? (
                    <p className="rematch-message">{state.rematchRequester} requested a rematch.</p>
                ) : null}
                {!state.isOpponentAvailable ? (
                    <p className="rematch-message">Opponent left the game.</p>
                ) : null}
                <div className="game-over-actions">
                    <button type="button" className="play-again-btn" onClick={onPlayAgain}>
                        Play again
                    </button>
                    <button
                        type="button"
                        className="play-again-btn rematch-btn"
                        onClick={actions.handleRematchClick}
                        disabled={state.isRematchDisabled}
                    >
                        {state.rematchButtonText}
                    </button>
                    <button type="button" className="play-again-btn" onClick={onMainMenu}>
                        Main menu
                    </button>
                </div>
            </div>
        </div>
    );
}
