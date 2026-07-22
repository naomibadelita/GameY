export const MoveResult = {
    SUCCESS: 0,
    OCCUPIED: 1,
    VICTORY: 2,
};

export type MoveResult = typeof MoveResult[keyof typeof MoveResult];

const target = new Set<string>(['A', 'B', 'C']);

export class Node {
    color: string = '.';
    neighbors: Node[] = [];
    sides: Set<string>;
    public constructor(sides: Set<string>) {
        this.sides = sides;
    }

    public addNeighbor(node: Node) {
        this.neighbors.push(node);
        node.neighbors.push(this);
    }

    private getSameColorNeighbors(): Node[] {
        return this.neighbors.filter((v) => v.color == this.color);
    }

    private spreadToNeighbors(neighbors: Node[]) {
        for (const v of neighbors) {
            if ([...this.sides].some(side => !v.sides.has(side))) {
                v.sides = new Set<string>([...v.sides, ...this.sides]);
                const otherNeighbors = v.getSameColorNeighbors()
                    .filter(vv => vv !== this);
                v.spreadToNeighbors(otherNeighbors);
            }
        }
    }

    private recalculateConnectedSides() {
        const neighbors = this.getSameColorNeighbors();
        for (const v of neighbors) {
            this.sides = new Set<string>([...this.sides, ...v.sides]);
        }
        this.spreadToNeighbors(neighbors);
    }

    public setColor(color: string) {
        this.color = color;
        this.recalculateConnectedSides();
    }
}

export class Board {
    rows: Node[][] = [];
    size: number;

    private createNode(i: number, j: number): Node {
        const s = new Set<string>();
        if (j == 0) s.add('A');
        if (i == j) s.add('B');
        if (i == this.size - 1) s.add('C');

        const n = new Node(s);
        if (i > j) {
            n.addNeighbor(this.rows[i - 1][j]);
        }
        if (j > 0) {
            n.addNeighbor(this.rows[i][j - 1]);
            n.addNeighbor(this.rows[i - 1][j - 1]);
        }

        return n;
    }

    private generateRows() {
        this.rows = this.rows.filter(_ => true);

        for (let i = 0; i < this.size; ++i) {
            this.rows.push([]);
            for (let j = 0; j <= i; ++j) {
                const n = this.createNode(i, j);
                this.rows[i].push(n);
            }
        }
    }

    public constructor(size: number) {
        if (size <= 1) {
            throw new Error("A board should be instantiated with a size > 1!");
        }
        this.size = size;
        this.generateRows();
    }

    public placePiece(i: number, j: number, color: string): MoveResult {
        const node = this.rows[i][j];
        if (node.color !== '.') {
            return MoveResult.OCCUPIED;
        }
        node.setColor(color)
        if ([...target].every(side => node.sides.has(side))) {
            return MoveResult.VICTORY;
        }
        return MoveResult.SUCCESS;
    }

    public reset(): void {
        this.generateRows();
    }
}
