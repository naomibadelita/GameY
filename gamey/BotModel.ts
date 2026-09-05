export interface BotModel {
    version: number;
    adjacentOwnPiece: number;
    reachNewSide: number;
    connectGroups: number;
    isolatedPiecePenalty: number;
}

export const defaultBotModel: BotModel = {
    version: 1,
    adjacentOwnPiece: 10,
    reachNewSide: 20,
    connectGroups: 30,
    isolatedPiecePenalty: 15,
};