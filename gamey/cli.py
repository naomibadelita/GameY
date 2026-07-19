import sys
import json
# Importăm clasele tale din board.py
from board import Board, MoveResult

def serialize_board(board: Board) -> dict:
    """Converts the Python Board instance into a clean dictionary that Node.js can read."""
    serialized_rows = []
    for row in board.rows:
        serialized_row = []
        for node in row:
            serialized_row.append({
                "color": node.color,
                "sides": list(node.sides)
            })
        serialized_rows.append(serialized_row)
    return {"rows": serialized_rows}

def deserialize_board(board_data: dict, size: int) -> Board:
    """Rebuilds a Board instance from the JSON data stored by Node.js."""
    new_board = Board(size)
    for i in range(len(board_data["rows"])):
        for j in range(len(board_data["rows"][i])):
            saved_node = board_data["rows"][i][j]
            new_board.rows[i][j].color = saved_node["color"]
            new_board.rows[i][j].sides = set(saved_node["sides"])
    return new_board

if __name__ == "__main__":
    args = sys.argv[1:]
    
    action = None
    if "--action" in args:
        action = args[args.index("--action") + 1]

    # --- 1. HANDLE INIT ACTION ---
    if action == "init":
        game_board = Board(size=5)  # Default size
        print(json.dumps(serialize_board(game_board)))
        sys.exit(0)

    # --- 2. HANDLE MOVE ACTION ---
    elif action == "move":
        try:
            board_data = json.loads(args[args.index("--board") + 1])
            row_idx = int(args[args.index("--x") + 1])
            col_idx = int(args[args.index("--y") + 1])
            player_color = args[args.index("--player") + 1]

            current_size = len(board_data["rows"])
            game_board = deserialize_board(board_data, current_size)

            result = game_board.place_piece(row_idx, col_idx, player_color)

            if result == MoveResult.OCCUPIED:
                print(json.dumps({"error": "This cell is already occupied!"}))
            elif result == MoveResult.VICTORY:
                print(json.dumps({
                    "updatedBoard": serialize_board(game_board),
                    "status": f"Player {player_color} won the game!"
                }))
            else:
                print(json.dumps({
                    "updatedBoard": serialize_board(game_board),
                    "status": "Next turn"
                }))
                
        except Exception as e:
            print(json.dumps({"error": f"Internal Python error: {str(e)}"}))
        sys.exit(0)