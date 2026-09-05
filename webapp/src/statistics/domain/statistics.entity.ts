import type { Profile } from "./profile.entity";

export interface StatisticsData {
    elo: number;
    matchesPlayed: number;
    matchesWon: number;
    timePlayed: number;
}

// TODO: Probably MatchData should only contain the UID.
// Profile has presentation logic (eg. photoUrl) that might change
// based on how it's presented.
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
