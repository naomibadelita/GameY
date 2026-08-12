export interface LeaderboardData {
    items: LeaderboardItem[];
}

export interface LeaderboardItem {
    playerName: string;
    numOfWins: number;
}
