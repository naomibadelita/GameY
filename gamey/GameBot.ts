import {Board, MoveResult} from './Board';

export interface BotMove{
    row: number;
    column: number;
}

export class GameBot{
    public chooseMove(board: Board, botColor: string, playerColor: string,): BotMove | null {
        const emptyMoves= this.getEmptyMoves(board);

        //We are placing a bot piece on each empty node in a copy of the board
        // the node will be chosen immediately if the placement completes all sides (A,B,C)
        for(const move of emptyMoves){
            if(this.simulateMove(board, move, botColor) === MoveResult.VICTORY){
                return move;
            }
        }

        //if the player could win on an empty node next turn,
        // place the bot's piece there first ti block that node
        for(const move of emptyMoves) {
            if(this.simulateMove(board,move,playerColor) === MoveResult.VICTORY){
                return move;
            }
        }

        //Otherwise, prefer a move adjacent to the most bot pieces
        return emptyMoves.reduce<BotMove | null>((bestMove,move) => {
            if(bestMove === null)
            {
                return move;
            }

            return this.getMoveScore(board, move, botColor) > 
                this.getMoveScore(board, bestMove, botColor)
                ? move
                : bestMove;
        },null);
    }

    private getEmptyMoves(board: Board): BotMove[] {
        const moves: BotMove[]=[];
        for(let row=0; row<board.size; row++){
            for(let column=0; column<=row;column++){
                if(board.rows[row][column].color === '.'){
                    moves.push({row,column});
                }
            }
        }

        return moves;
    }

    private simulateMove(board: Board, move: BotMove, color: string): MoveResult{
        const copyBoard= new Board(board.size);

        //Re-create all already-placed pieces on a separate board.
        for(let row=0; row<board.size; row++){
            for(let column=0; column<=row; column++){
                const existingColor=board.rows[row][column].color;
                if(existingColor!='.')
                {
                    copyBoard.placePiece(row,column,existingColor);
                }
            }
        }

        return copyBoard.placePiece(move.row,move.column,color);
    }

    private getMoveScore(board: Board,move: BotMove,botColor: string) : number{
        //prefer extending an existing connected bot group
        return board.rows[move.row][move.column].neighbors
            .filter(neighbor => neighbor.color === botColor)
            .length;
    }
}