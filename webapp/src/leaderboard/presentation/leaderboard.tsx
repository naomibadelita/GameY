import { useLeaderboardViewModel } from './useLeaderboardViewModel';
import './leaderboard.css';

function Leaderboard() {
    const { state, actions } = useLeaderboardViewModel();

    const renderContent = () => {
        if (state.error) {
            return <div className="leaderboard-error">{state.error}</div>;
        }

        if (state.isLoading) {
            return <h3 className="leaderboard-loading">Loading...</h3>;
        }

        return (
            <ol className="leaderboard-list">
                {state.items.map((item) => (
                    <li
                        key={item.id}
                        className="leaderboard-item"
                    >
                        <div className="leaderboard-item-content">
                            <span>{item.playerName}</span>
                            <strong>{item.winsLabel}</strong>
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
                        value={state.category}
                        onChange={(event) => actions.setCategory(event.target.value)}
                    >
                        {state.categoryOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>

                {renderContent()}

                <button
                    type="button"
                    className="back-button"
                    onClick={actions.navigateBack}
                >
                    Back to game
                </button>
            </section>
        </main>
    );
}

export default Leaderboard;
