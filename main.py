
target = {'A', 'B', 'C'}

class Nod:
    def __init__(self, sides: set = set()):
        self.color: str = None
        self.sides: set = sides
        self.neighbors: list = []

    def add_neighbor(self, nod: 'Nod'):
        self.neighbors.append(nod)
        nod.neighbors.append(self)

class Board:   
    def __init__(self, size: int):
        assert (size > 1)
        
        self.rows: list[list[Nod]] = []
        print(len(self.rows))
        for i in range(size):
            self.rows.append([])
            for j in range(i+1):
                s = set()
                if(j == 0):      s.add('A')
                if(i == j):      s.add('B')
                if(i == size-1): s.add('C')
                
                n = Nod(s)
                if(i > j): n.add_neighbor(self.rows[i-1][j])
                if(j > 0): n.add_neighbor(self.rows[i][j-1])
                self.rows[i].append(n)

if __name__ == '__main__':
    b = Board(8)
    for i in range(len(b.rows)):
        print()
        for j in range(len(b.rows[i])):
            el: Nod = b.rows[i][j]
            print(f'{i}, {j}: {el.sides}')
