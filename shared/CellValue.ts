export type CellValue = '.' | 'B' | 'R';
export type BoardState = CellValue[][];

export function createInitialBoard(size: number): CellValue[][] {
    const board: CellValue[][] = [];

    for (let y = 0; y < size; y++) {
        const row: CellValue[] = new Array(y + 1).fill('.');
        board.push(row);
    }

    return board;
}

export function normalizeBoardForSize(board: BoardState, size: number): BoardState {
    if (board.length >= size && board.every((row, index) => row.length >= index + 1)) {
        return board;
    }

    return createInitialBoard(size);
}
