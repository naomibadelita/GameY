export interface QModel {
    version: number;
    learningRate: number;
    discountFactor: number;
    explorationRate: number;
    values: Record<string, number>;
    featureValues?: Record<string, number>;
    trainingExperiences?: number;
    lastTrainedAt?: string;
    evaluation?: {
        winRate: number;
        firstPlayerWinRate: number;
        secondPlayerWinRate: number;
        byBoardSize: Record<number, number>;
    };
}

export const defaultQModel: QModel = {
    version: 1,
    learningRate: 0.1,
    discountFactor: 0.95,
    explorationRate: 0,
    values: {},
    featureValues: {},
};