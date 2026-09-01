import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth';
import { loadProfile } from '../data/profile.loader';
import { loadPageOfMatches, loadStatistic } from '../data/statistics.loader';
import type { Profile } from '../domain/profile.entity';
import type { MatchData, StatisticsData } from '../domain/statistics.entity';

export type MatchResult = 'winner' | 'loser' | 'draw';

export interface FormattedPlayer {
    displayName: string;
    photoUrl: string;
    result: MatchResult;
}

export interface FormattedMatch {
    id: string;
    boardSize: number;
    player1: FormattedPlayer;
    player2: FormattedPlayer;
}

export function useStatisticsViewModel() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const uid = user?.userId;

    const [error, setError] = useState('');
    const [profile, setProfile] = useState<Profile | undefined>(undefined);
    const [statistics, setStatistics] = useState<StatisticsData | undefined>(undefined);
    const [history, setHistory] = useState<MatchData[]>([]);
    const [page, setPage] = useState<number>(0);
    const loaderRef = useRef<HTMLLIElement | null>(null);

    const loadHistoryPage = useCallback(() => {
        if (page === -1 || !uid) return;

        loadPageOfMatches(uid, page, 10)
            .then((newData) => {
                setHistory((prev) => [...prev, ...newData]);
                setPage(newData.length === 0 ? -1 : (prev) => prev + 1);
            })
            .catch((err) => setError(err instanceof Error ? err.message : 'An error occurred'));
    }, [uid, page]);

    useEffect(() => {
        if (!uid) {
            setError('User authentication failed.');
            return;
        }

        void loadProfile(uid)
            .then(setProfile)
            .catch((err) => setError(err instanceof Error ? err.message : 'An error occurred'));

        void loadStatistic(uid)
            .then(setStatistics)
            .catch((err) => setError(err instanceof Error ? err.message : 'An error occurred'));

        loadHistoryPage();
    }, [uid]);

    useEffect(() => {
        const currentLoader = loaderRef.current;
        if (!currentLoader) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadHistoryPage();
                }
            },
            { threshold: 1.0 }
        );

        observer.observe(currentLoader);
        return () => observer.unobserve(currentLoader);
    }, [loadHistoryPage]);

    const matches: FormattedMatch[] = useMemo(() => {
        return history.map((match, index) => {
            let p1Result: 'winner' | 'loser' | 'draw' = 'draw';
            let p2Result: 'winner' | 'loser' | 'draw' = 'draw';

            if (match.winner === 1) {
                p1Result = 'winner';
                p2Result = 'loser';
            } else if (match.winner === 2) {
                p1Result = 'loser';
                p2Result = 'winner';
            }

            return {
                id: `match-${match.boardSize}-${match.player1.displayName}-${match.player2.displayName}-${index}`,
                boardSize: match.boardSize,
                player1: {
                    displayName: match.player1.displayName,
                    photoUrl: match.player1.photoUrl ?? 'https://picsum.photos/48',
                    result: p1Result,
                },
                player2: {
                    displayName: match.player2.displayName,
                    photoUrl: match.player2.photoUrl ?? 'https://picsum.photos/48',
                    result: p2Result,
                },
            };
        });
    }, [history]);

    return {
        state: {
            profile,
            statistics,
            matches,
            error,
            hasMatches: history.length > 0,
            profilePhotoUrl: profile?.photoUrl ?? 'https://picsum.photos/96',
            profileDisplayName: profile?.displayName ?? 'Loading profile...',
            eloText: statistics?.elo ?? '-',
        },
        refs: {
            loaderRef,
        },
        actions: {
            navigateBack: () => navigate('/menu'),
        },
    };
}
