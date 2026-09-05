import type { Experience } from './Experience';
import type { QModel } from './QModel';
import { getMoveFeatureKeyFromState } from './Features';

export function getStateKey(board: string, botColor: string): string {
    return `${botColor}:${board}`;
}

export function getActionKey(row: number, column: number): string {
    return `${row},${column}`;
}

export function getLegalActions(board: string, boardSize: number): string[] {
    const actions: string[] = [];
    let index = 0;
    for (let row = 0; row < boardSize; row++) {
        for (let column = 0; column <= row; column++) {
            if (board[index] === '.') actions.push(getActionKey(row, column));
            index++;
        }
    }
    return actions;
}

export function trainFromExperience(model: QModel, experience: Experience): void {
    const state = getStateKey(experience.board, experience.botColor);
    const action = getActionKey(experience.move.row, experience.move.column);
    const currentKey = `${state}:${action}`;
    const currentValue = model.values[currentKey] ?? 0;
    const nextState = getStateKey(experience.nextBoard, experience.botColor);
    const nextActions = experience.terminal
        ? []
        : getLegalActions(experience.nextBoard, experience.boardSize);
    const nextValue = nextActions.reduce(
        (best, nextAction) => Math.max(best, model.values[`${nextState}:${nextAction}`] ?? 0),
        0,
    );
    const target = experience.reward + model.discountFactor * nextValue;
    model.values[currentKey] = currentValue + model.learningRate * (target - currentValue);

    model.featureValues ??= {};
    const featureKey = getMoveFeatureKeyFromState(
        experience.board,
        experience.boardSize,
        experience.move,
        experience.botColor,
        experience.botColor === 'B' ? 'R' : 'B',
    );
    const featureValue = model.featureValues[featureKey] ?? 0;
    model.featureValues[featureKey] = featureValue + model.learningRate * (target - featureValue);
}