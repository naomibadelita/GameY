import { loadHistory, loadStatistics } from "../../api";
import type { MatchData, StatisticsData } from "../domain/statistics.entity";

export function loadStatistic(uid: string): Promise<StatisticsData> {
    return loadStatistics(uid);
}

export function loadPageOfMatches(
    uid: string,
    page: number,
    limit: number,
): Promise<MatchData[]> {
    return loadHistory(uid, page, limit);
}