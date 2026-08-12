import type { LeaderboardData } from "../domain/leaderboard.entity";

export async function loadLeaderboardData(): Promise<LeaderboardData> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
        items: [
            {
                playerName: "IOnlyDoWins",
                numOfWins: 101,
            },
            {
                playerName: "..........................",
                numOfWins: 9,
            },
            {
                playerName: "3b1green",
                numOfWins: 4,
            },
            {
                playerName: "",
                numOfWins: 2
            },
        ],
    };
}
