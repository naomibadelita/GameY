//the board mathematics
import {type CellValue } from "../types/game";

export function createInitialBoard(size: number): CellValue[][]{
    const board: CellValue[][]=[];

    for(let y=0; y<size; y++){
        const row: CellValue[]=new Array(y+1).fill('.');
        board.push(row);
    }

    return board; 
}
