from enum import Enum

class MoveResult(Enum):
    SUCCESS = 0
    OCCUPIED = 1
    VICTORY = 2

target = {'A', 'B', 'C'}

class Node:
    def __init__(self, sides: set = set()):
        self.color: str = None
        self.sides: set = sides
        self.neighbors: list[Node] = []

    def add_neighbor(self, node: 'Node'):
        self.neighbors.append(node)
        node.neighbors.append(self)

    def __get_same_color_neighbors(self) -> list['Node']:
        return list(filter(lambda v: v.color == self.color, self.neighbors))

    def __spread_to_neighbors(self, neighbors: list['Node']):
        for v in neighbors:
            if v.sides < self.sides:
                v.sides = v.sides.union(self.sides)
                other_neighbors = v.__get_same_color_neighbors()
                other_neighbors.remove(self)
                v.__spread_to_neighbors(other_neighbors)

    def __recalculate_connected_sides(self):
        neighbors = self.__get_same_color_neighbors()
        for v in neighbors:
            self.sides = self.sides.union(v.sides)
        self.__spread_to_neighbors(neighbors)

    def set_color(self, color: str):
        self.color = color
        self.__recalculate_connected_sides()

class Board:
    def __init__(self, size: int):
        assert (size > 1)

        self.rows: list[list[Node]] = []
        for i in range(size):
            self.rows.append([])
            for j in range(i+1):
                s = set()
                if(j == 0):      s.add('A')
                if(i == j):      s.add('B')
                if(i == size-1): s.add('C')

                n = Node(s)
                if(i > j):
                    n.add_neighbor(self.rows[i-1][j])
                if(j > 0):
                    n.add_neighbor(self.rows[i][j-1])
                    n.add_neighbor(self.rows[i-1][j-1])
                self.rows[i].append(n)

    def place_piece(self, i: int, j: int, color: str):
        node: Node = self.rows[i][j]
        if(node.color != None):
            return MoveResult.OCCUPIED
        node.set_color(color)
        if node.sides == target:
            return MoveResult.VICTORY
        return MoveResult.SUCCESS
