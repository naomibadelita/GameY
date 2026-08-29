import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import type { Profile } from '../domain/profile.entity';
import type { MatchData, StatisticsData } from '../domain/statistics.entity';
import { loadProfile } from '../data/profile.loader';
import { loadPageOfMatches, loadStatistic } from '../data/statistics.loader';
import './StatisticsPage.css';

export default function StatisticsPage() {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') ?? 'undefined');
    const uid = user?.userId ?? '0';

    const [error, setError] = useState('');
    const [profile, setProfile] = useState<Profile | undefined>(undefined);
    const [statistics, setStatistics] = useState<StatisticsData | undefined>(undefined);

    const [page, setPage] = useState<number>(0);
    const [history, setHistory] = useState<MatchData[]>([]);
    const loadHistoryPage = () => {
        if (page === -1) return;
        loadPageOfMatches(uid, page, 10)
            .then((newData) => {
                setHistory([...history, ...newData]);
                console.log(`history: ${JSON.stringify(history)}`);
                const newPage = newData.length === 0 ? -1 : page + 1;
                setPage(newPage);
            })
            .catch((err) => setError(err instanceof Error ? err.message : 'An error occurred'));
    };

    const init = () => {
        void loadProfile(uid)
            .then((data) => setProfile(data))
            .catch((err) => setError(err instanceof Error ? err.message : 'An error occurred'));
        void loadStatistic(uid)
            .then((data) => setStatistics(data))
            .catch((err) => setError(err instanceof Error ? err.message : 'An error occurred'));
        loadHistoryPage();
    }

    const loaderRef = useRef<HTMLLIElement | null>(null);

    useEffect(() => { init(); }, []);

    useEffect(() => {
        const currentLoader = loaderRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0].isIntersecting) return;
                loadHistoryPage();
            },
            { threshold: 1.0 }
        );

        if (currentLoader) observer.observe(currentLoader);

        return () => {
            if (currentLoader) observer.unobserve(currentLoader);
        };
    }, [page]);

    const renderPlayer = (player: Profile, result: string, right = false) => {
        return (
            <div className={`history-player ${right ? 'history-player-right' : ''}`}>
                <img
                    className={`match-player-image match-player-image-${result}`}
                    src={player.photoUrl ?? 'https://picsum.photos/48'}
                    alt={`${player.displayName}'s profile`}
                />
                <span className={`history-player-name ${result === 'winner' ? 'winner-name' : ''}`}>
                    {player.displayName}
                </span>
            </div>
        );
    }

    const renderMatch = (match: MatchData, index: number) => {
        let player1Result = 'draw';
        let player2Result = 'draw';

        switch (match.winner) {
            case 1:
                player1Result = 'winner';
                player2Result = 'loser';
                break;
            case 2:
                player1Result = 'loser';
                player2Result = 'winner';
                break;
        }

        return (
            <li className="history-item" key={index} >
                {renderPlayer(match.player1, player1Result)}

                <div className="history-match-details">
                    <span className="board-size">{match.boardSize}</span>
                </div>

                {renderPlayer(match.player2, player2Result, true)}
            </li>
        );
    }

    const renderContent = () => {
        if (error) {
            return <div className="leaderboard-error">{error}</div>;
        }

        return (
            <div className="history-section">
                <h2>Match history</h2>

                <ul className="history-list">
                    {history.map((element, index) => renderMatch(element, index))}
                    {history.length === 0 && (
                        <li className="history-empty">No match history yet.</li>
                    )}
                    <li ref={loaderRef} className="history-loader" aria-hidden="true" />
                </ul>
            </div>
        );
    }

    return (
        <main className="statistics-page">
            <section className="statistics-card">
                <h1>Statistics &amp; History</h1>

                <header className="statistics-header">
                    <img
                        className="profile-image"
                        src={profile?.photoUrl ?? 'https://picsum.photos/96'}
                        alt={`${profile?.displayName ?? 'Anonymous'}'s profile`}
                    />
                    <div className="profile-column">
                        <h2>{profile?.displayName ?? 'Loading profile...'}</h2>
                        <div className="elo-row">
                            <span>ELO rating</span>
                            <strong>{statistics?.elo ?? '-'}</strong>
                        </div>
                    </div>
                </header>

                {renderContent()}

                <button
                    type="button"
                    className="statistics-back-button"
                    onClick={() => navigate('/menu')}
                >
                    Back to game
                </button>
            </section>
        </main>
    );
}
