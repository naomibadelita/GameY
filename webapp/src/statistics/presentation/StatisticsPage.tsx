import { useStatisticsViewModel } from './useStatisticsViewModel';
import './StatisticsPage.css';

export default function StatisticsPage() {
    const { state, refs, actions } = useStatisticsViewModel();

    const renderContent = () => {
        if (state.error) {
            return <div className="leaderboard-error">{state.error}</div>;
        }

        return (
            <div className="history-section">
                <h2>Match history</h2>

                <ul className="history-list">
                    {state.matches.map((match) => (
                        <li className="history-item" key={match.id}>
                            <div className="history-player">
                                <img
                                    className={`match-player-image match-player-image-${match.player1.result}`}
                                    src={match.player1.photoUrl}
                                    alt={`${match.player1.displayName}'s profile`}
                                />
                                <span className={`history-player-name ${match.player1.result === 'winner' ? 'winner-name' : ''}`}>
                                    {match.player1.displayName}
                                </span>
                            </div>

                            <div className="history-match-details">
                                <span className="board-size">{match.boardSize}</span>
                            </div>

                            <div className="history-player history-player-right">
                                <img
                                    className={`match-player-image match-player-image-${match.player2.result}`}
                                    src={match.player2.photoUrl}
                                    alt={`${match.player2.displayName}'s profile`}
                                />
                                <span className={`history-player-name ${match.player2.result === 'winner' ? 'winner-name' : ''}`}>
                                    {match.player2.displayName}
                                </span>
                            </div>
                        </li>
                    ))}
                    {!state.hasMatches ? (
                        <li className="history-empty">No match history yet.</li>
                    ) : null}
                    <li ref={refs.loaderRef} className="history-loader" aria-hidden="true" />
                </ul>
            </div>
        );
    };

    return (
        <main className="statistics-page">
            <section className="statistics-card">
                <h1>Statistics &amp; History</h1>

                <header className="statistics-header">
                    <img
                        className="profile-image"
                        src={state.profilePhotoUrl}
                        alt={`${state.profileDisplayName}'s profile`}
                    />
                    <div className="profile-column">
                        <h2>{state.profileDisplayName}</h2>
                        <div className="elo-row">
                            <span>ELO rating</span>
                            <strong>{state.eloText}</strong>
                        </div>
                    </div>
                </header>

                {renderContent()}

                <button
                    type="button"
                    className="statistics-back-button"
                    onClick={actions.navigateBack}
                >
                    Back to game
                </button>
            </section>
        </main>
    );
}

