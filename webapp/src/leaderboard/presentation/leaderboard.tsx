import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadLeaderboardData } from '../data/leaderboard.loader';
import type { LeaderboardData } from '../domain/leaderboard.entity';
import './leaderboard.css';

function Leaderboard() {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);

    useEffect(() => {
        void loadLeaderboardData().then(setLeaderboard);
    }, []);

    return (
        <main className="leaderboard-page">
            <section className="leaderboard-card">
                <h1>Leaderboard</h1>

                {!leaderboard ? (
                    <h3 className="leaderboard-loading">Loading...</h3>
                ) : (
                    <ol className="leaderboard-list">
                        {leaderboard.items.map((item, index) => (
                            <li
                                key={`${item.playerName}-${index}`}
                                className="leaderboard-item"
                            >
                                <div className="leaderboard-item-content">
                                    <span>{item.playerName || 'Anonymous player'}</span>
                                    <strong>{item.numOfWins} wins</strong>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}

                <button
                    type="button"
                    className="back-button"
                    onClick={() => navigate('/game')}
                >
                    Back to game
                </button>
            </section>
        </main>
    );
}

export default Leaderboard;
