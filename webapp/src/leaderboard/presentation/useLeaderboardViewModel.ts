import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadLeaderboardData } from '../data/leaderboard.loader';
import type { LeaderboardData } from '../domain/leaderboard.entity';
import { isLeaderboardCategory, type LeaderboardCategory } from '../domain/leaderboard.types';

export interface FormattedLeaderboardItem {
    id: string;
    playerName: string;
    winsLabel: string;
}

export const CATEGORY_OPTIONS: readonly { value: LeaderboardCategory; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: '6', label: '6x6' },
    { value: '8', label: '8x8' },
    { value: '10', label: '10x10' },
];

export function useLeaderboardViewModel() {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
    const [category, setCategory] = useState<LeaderboardCategory>('all');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isCurrentRequest = true;
        setIsLoading(true);
        setLeaderboard(null);
        setError('');

        void loadLeaderboardData(category)
            .then((data) => {
                if (isCurrentRequest) {
                    setLeaderboard(data);
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                if (isCurrentRequest) {
                    setError(err instanceof Error ? err.message : 'An error occurred');
                    setIsLoading(false);
                }
            });

        return () => {
            isCurrentRequest = false;
        };
    }, [category]);

    const handleCategoryChange = useCallback((value: string) => {
        if (!isLeaderboardCategory(value)) return;
        setCategory(value);
    }, []);

    const formattedItems: FormattedLeaderboardItem[] = useMemo(() => {
        if (!leaderboard) return [];
        return leaderboard.items.map((item, index) => ({
            id: `${item.playerName}-${index}`,
            playerName: item.playerName || 'Anonymous player',
            winsLabel: item.numOfWins === 1 ? '1 win' : `${item.numOfWins} wins`,
        }));
    }, [leaderboard]);

    return {
        state: {
            category,
            categoryOptions: CATEGORY_OPTIONS,
            items: formattedItems,
            error,
            isLoading,
        },
        actions: {
            setCategory: handleCategoryChange,
            navigateBack: () => navigate('/menu'),
        },
    };
}
