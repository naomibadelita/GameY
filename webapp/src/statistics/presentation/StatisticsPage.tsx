import { useNavigate } from 'react-router-dom';
import "./StatisticsPage.css"
import { useEffect, useRef, useState } from 'react';
import type { Profile } from '../domain/profile.entity';
import type { MatchData, StatisticsData } from '../domain/statistics.entity';
import { loadProfile } from '../data/profile.loader';
import { loadPageOfMatches, loadStatistic } from '../data/statistics.loader';

interface StatisticsPageParams { readonly uid: string };
export default function StatisticsPage({ uid }: StatisticsPageParams) {
    const navigate = useNavigate();

    const [profile, setProfile] = useState<Profile | undefined>(undefined);
    const [statistics, setStatistics] = useState<StatisticsData | undefined>(undefined);

    const [page, setPage] = useState<number>(0);
    const [history, setHistory] = useState<MatchData[]>([]);
    const loadHistoryPage = async () => {
        console.log('Try to load!');
        if (page === -1) return;
        const newData = await loadPageOfMatches(uid, page, 10);
        setHistory([...history, ...newData]);
        const newPage = newData.length === 0 ? -1 : page + 1;
        setPage(newPage);
    };

    const init = async () => {
        setProfile(await loadProfile(uid));
        setStatistics(await loadStatistic(uid));
        loadHistoryPage();
    }

    const loaderRef = useRef<HTMLDivElement | null>(null);

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

    const renderMatch = (match: MatchData) => {
        return (
            <li>
                {match.player1.displayName}
                {match.winner == 1 ? ' won' : ''}
                &lt;---{match.boardSize}---&gt;
                {match.winner == 2 ? 'won ' : ''}
                {match.player2.displayName}
            </li>
        );
    }

    return (
        <main className="statistics-page">
            <section className="statistics-card">
                <h1>Statistics & History</h1>
                <h3>{profile?.displayName}</h3>
                <h3>{statistics?.elo}</h3>

                <ul>{history.map(renderMatch)}</ul>
                <div ref={loaderRef} style={{ textAlign: 'center', padding: '10px' }}></div>

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