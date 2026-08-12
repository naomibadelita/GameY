import { loadLeaderboard } from "../../api";
import type { LeaderboardData } from "../domain/leaderboard.entity";

export async function loadLeaderboardData(): Promise<LeaderboardData> {
    return loadLeaderboard('all', 'numOfWins');
}
