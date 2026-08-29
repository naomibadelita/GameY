const leaderboardCategories = ['all', '6', '8', '10'] as const;
const leaderboardCategorySet: ReadonlySet<string> = new Set(leaderboardCategories);
export type LeaderboardCategory = typeof leaderboardCategories[number];
export function isLeaderboardCategory(value: string): value is LeaderboardCategory {
    return leaderboardCategorySet.has(value);
}

const leaderboardMetrics = ['numOfWins'] as const;
const leaderboardMetricSet: ReadonlySet<string> = new Set(leaderboardMetrics);
export type LeaderboardMetric = typeof leaderboardMetrics[number];
export function isLeaderboardMetric(value: string): value is LeaderboardMetric {
    return leaderboardMetricSet.has(value);
}
