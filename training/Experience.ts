export interface Experience {
    board: string;
    boardSize: number;
    botColor: 'B' | 'R';
    move: {
        row: number;
        column: number;
    };
    reward: number;
    nextBoard: string;
    terminal: boolean;
    modelVersion?: number;
}

export function serializeBoard(board: { rows: Array<Array<{ color: string }>> }): string {
    return board.rows.flatMap((row) => row.map((node) => node.color)).join('');
}