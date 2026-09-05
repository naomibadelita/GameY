import { useState } from 'react';
import { useStatisticsViewModel } from './useStatisticsViewModel';
import AvatarPicker from './AvatarPicker';
import uploadIcon from '../../assets/upload.svg';
import './StatisticsPage.css';

export default function StatisticsPage() {
    const { state, refs, actions } = useStatisticsViewModel();
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

    const handleAvatarSelect = async (photoUrl: string | null) => {
        const wasUpdated = await actions.selectProfilePhoto(photoUrl);
        if (!wasUpdated) return;
        setIsAvatarPickerOpen(false);
    };

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
                    <button
                        type='button'
                        className='profile-image-button'
                        onClick={() => setIsAvatarPickerOpen(true)}
                        aria-label='Upload profile picture'
                    >
                        <img
                            className="profile-image"
                            src={state.profilePhotoUrl}
                            alt={`${state.profileDisplayName}'s profile`}
                        />
                        <span className="profile-image-overlay" aria-hidden="true">
                            <img src={uploadIcon} alt="" />
                        </span>
                    </button>
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

            {isAvatarPickerOpen ? (
                <AvatarPicker
                    onClose={() => setIsAvatarPickerOpen(false)}
                    onSelect={(photoUrl) => void handleAvatarSelect(photoUrl)}
                />
            ) : null}
        </main>
    );
}

