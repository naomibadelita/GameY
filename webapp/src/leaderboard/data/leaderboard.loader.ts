import { loadLeaderboard } from "../../api";
import type { LeaderboardData } from "../domain/leaderboard.entity";
import type { LeaderboardCategory } from "../domain/leaderboard.types";

export async function loadLeaderboardData(category: LeaderboardCategory): Promise<LeaderboardData> {
    return loadLeaderboard(category, 'numOfWins');
}
