import pytest
from gamey.board import Board, MoveResult

# Use `python -m pytest tests/test_board.py::TestBoard `
# to run the test in terminal.
# Or `python -m pytest` to run all test files.

class TestBoard:
    @pytest.fixture
    def empty_board(self) -> Board:
        return Board(8)

    def test_multiple_piece_placement(self, empty_board: Board):
        assert empty_board.place_piece(0, 0, 'white') == MoveResult.SUCCESS
        assert empty_board.place_piece(0, 0, 'white') == MoveResult.OCCUPIED
        assert empty_board.place_piece(1, 0, 'white') == MoveResult.SUCCESS
        assert empty_board.place_piece(1, 0, 'black') == MoveResult.OCCUPIED
        assert empty_board.place_piece(1, 1, 'black') == MoveResult.SUCCESS
        assert empty_board.place_piece(1, 1, 'white') == MoveResult.OCCUPIED
        assert empty_board.place_piece(2, 0, 'black') == MoveResult.SUCCESS
        assert empty_board.place_piece(2, 0, 'white') == MoveResult.OCCUPIED

    def test_game_winning_1(self, empty_board: Board):
        empty_board.place_piece(0, 0, 'white')
        empty_board.place_piece(1, 0, 'white')
        empty_board.place_piece(2, 1, 'white')
        empty_board.place_piece(3, 1, 'white')
        empty_board.place_piece(4, 2, 'white')
        empty_board.place_piece(5, 2, 'white')
        empty_board.place_piece(6, 3, 'white')
        assert empty_board.place_piece(7, 3, 'white') == MoveResult.VICTORY

    def test_game_winning_2(self, empty_board: Board):
        empty_board.place_piece(0, 0, 'white')
        empty_board.place_piece(1, 0, 'white')
        empty_board.place_piece(2, 1, 'white')
        empty_board.place_piece(3, 1, 'white')
        empty_board.place_piece(5, 2, 'white')
        empty_board.place_piece(6, 3, 'white')
        empty_board.place_piece(7, 3, 'white')
        assert empty_board.place_piece(4, 2, 'white') == MoveResult.VICTORY

    def test_game_winning_3(self, empty_board: Board):
        empty_board.place_piece(0, 0, 'white')
        empty_board.place_piece(1, 0, 'white')
        empty_board.place_piece(2, 1, 'white')
        empty_board.place_piece(3, 1, 'black')
        empty_board.place_piece(3, 2, 'black')
        empty_board.place_piece(4, 2, 'white')
        empty_board.place_piece(5, 2, 'white')
        empty_board.place_piece(6, 3, 'white')
        empty_board.place_piece(7, 3, 'white')
        assert empty_board.place_piece(3, 1, 'white') == MoveResult.OCCUPIED

    def test_game_winning_4(self, empty_board: Board):
        empty_board.place_piece(3, 0, 'white') # 'A'
        empty_board.place_piece(3, 1, 'white')
        empty_board.place_piece(4, 4, 'white') # 'B'
        empty_board.place_piece(4, 3, 'white')
        empty_board.place_piece(7, 4, 'white') # 'C'
        empty_board.place_piece(6, 3, 'white')
        empty_board.place_piece(5, 2, 'white')
        assert empty_board.place_piece(4, 2, 'white') == MoveResult.VICTORY
