import { useNavigate } from 'react-router-dom';
import "./StatisticsPage.css"

export default function StatisticsPage() {
    const navigate = useNavigate();

    return (
        <main className="statistics-page">
            <section className="statistics-card">
                <h1>Statistics & History</h1>

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