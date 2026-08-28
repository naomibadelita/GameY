import type { Profile } from "./profile.entity";

export interface StatisticsData {
    elo: number;
    matchesPlayed: number;
    matchesWon: number;
    timePlayed: number;
}

export interface MatchData {
    player1: Profile;
    player2: Profile;
    winner: 1 | 2 | undefined;
    boardSize: number;
}

// export interface MatchHistoryData {
//     matches: MatchData[];
// }

// export interface StatisticsScreenData {
//     profile: Profile;
//     statistics: StatisticsData;
//     history: MatchHistoryData;
// }