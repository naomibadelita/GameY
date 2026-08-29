import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadLeaderboardData } from '../data/leaderboard.loader';
import type { LeaderboardData } from '../domain/leaderboard.entity';
import { isLeaderboardCategory, type LeaderboardCategory } from '../domain/leaderboard.types';
import './leaderboard.css';

function Leaderboard() {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
    const [category, setCategory] = useState<LeaderboardCategory>('all');
    const [error, setError] = useState('');

    useEffect(() => {
        let isCurrentRequest = true;

        setLeaderboard(null);
        setError('');

        void loadLeaderboardData(category)
            .then((data) => {
                if (isCurrentRequest) {
                    setLeaderboard(data);
                }
            })
            .catch((err) => {
                if (isCurrentRequest) {
                    setError(err instanceof Error ? err.message : 'An error occurred');
                }
            });

        return () => {
            isCurrentRequest = false;
        };
    }, [category]);

    const renderContent = () => {
        if (error) {
            return <div className="leaderboard-error">{error}</div>;
        }

        if (!leaderboard) {
            return <h3 className="leaderboard-loading">Loading...</h3>;
        }

        return (
            <ol className="leaderboard-list">
                {leaderboard.items.map((item, index) => (
                    <li
                        key={`${item.playerName}-${index}`}
                        className="leaderboard-item"
                    >
                        <div className="leaderboard-item-content">
                            <span>{item.playerName || 'Anonymous player'}</span>
                            <strong>
                                {item.numOfWins !== 1
                                    ? `${item.numOfWins} wins`
                                    : `1 win`}
                            </strong>
                        </div>
                    </li>
                ))}
            </ol>
        );
    };

    return (
        <main className="leaderboard-page">
            <section className="leaderboard-card">
                <h1>Leaderboard</h1>

                <label className="leaderboard-category">
                    <span>Category</span>
                    <select
                        value={category}
                        onChange={(event) => {
                            const { value } = event.target;
                            if (!isLeaderboardCategory(value)) return;
                            setCategory(value);
                        }}
                    >
                        <option value="all">All</option>
                        <option value="6">6x6</option>
                        <option value="8">8x8</option>
                        <option value="10">10x10</option>
                    </select>
                </label>

                {renderContent()}

                <button
                    type="button"
                    className="back-button"
                    onClick={() => navigate('/menu')}
                >
                    Back to game
                </button>
            </section>
        </main>
    );
}

export default Leaderboard;
