import type { MatchData, StatisticsData } from "../domain/statistics.entity";

export function loadStatistic(uid: string): Promise<StatisticsData> {
    return Promise.resolve({
        elo: 1600,
        matchesPlayed: 10 + (uid === '0' ? 0 : 1),
        matchesWon: 5,
        timePlayed: 3512411,
    });
}

export function loadPageOfMatches(
    uid: string,
    page: number,
    limit: number,
): Promise<MatchData[]> {
    return Promise.resolve(
        uid === '0' || page < 0 || page > 8 || limit === -1 ? [] :
            Array.from({ length: limit }, () => ({
                player1: {
                    photoUrl: undefined,
                    displayName: 'Barbaraba',
                },
                player2: {
                    photoUrl: undefined,
                    displayName: 'Robobom',
                },
                winner: 1,
                boardSize: 8,
            })));
}