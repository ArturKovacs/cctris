

enum Color {
    Empty = 0,
    Filled,
}

const BG_STYLE = 'black';
const VISIBLE_HOR_CELL_COUNT = 10;
const VISIBLE_VER_CELL_COUNT = 20;

function getStyleForColor(color: Color): string {
    if (color == Color.Empty) {
        return BG_STYLE;
    }
    if (color == Color.Filled) {
        return 'DarkSlateBlue';
    }
    return "pink";
}

class Piece {
    public shape: Color[][];

    // The coordinates on the board of lower left corner of the piece
    public position: [number, number];

    constructor(shape: Color[][], pos: [number, number]) {
        this.shape = shape;
        this.position = pos;
    }

    /**
     * Calls `calllback` for every non-empty cell of the piece.
     * 
     * For each cell, the callback gets the color of the cell and the
     * coordinates on the board for that cell.
     */
    forEachCell(callback: (color: Color, boardX: number, boardY: number) => void) {
        for (let py = 0; py < this.shape.length; py++) {
            const y = this.position[1] + py;
            const pRow = this.shape[py];
            for (let px = 0; px < pRow.length; px++) {
                const x = this.position[0] + px;
                const color = pRow[px];
                if (color !== Color.Empty) {
                    callback(color, x, y);
                }
            }
        }
    }

    static makeI(c: Color = Color.Filled) {
        let shape = [
            [c, c, c, c],
        ];
        return new Piece(shape, [3, 21])
    }

    static makeZ(c: Color = Color.Filled) {
        let shape = [
            [c, c, 0],
            [0, c, c],
        ];
        return new Piece(shape, [3, 21]);
    }

    static makeS(c: Color = Color.Filled) {
        let shape = [
            [0, c, c],
            [c, c, 0],
        ];
        return new Piece(shape, [3, 21]);
    }

    static makeO(c: Color = Color.Filled) {
        let shape = [
            [c, c],
            [c, c],
        ];
        return new Piece(shape, [4, 21]);
    }

    static makeT(c: Color = Color.Filled) {
        let shape = [
            [c, c, c],
            [0, c, 0],
        ]
        return new Piece(shape, [3, 21]);
    }

    static makeJ(c: Color = Color.Filled) {
        let shape = [
            [c, 0, 0],
            [c, c, c],
        ]
        return new Piece(shape, [3, 21]);
    }
    static makeL(c: Color = Color.Filled) {
        let shape = [
            [0, 0, c],
            [c, c, c],
        ]
        return new Piece(shape, [3, 21]);
    }

    static makeRandom() {
        let rand = Math.random() * 7;
        if (rand < 1) {
            return this.makeI();
        } else if (rand < 2) {
            return this.makeS();
        } else if (rand < 3) {
            return this.makeZ();
        } else if (rand < 4) {
            return this.makeO();
        } else if (rand < 5) {
            return this.makeT();
        } else if (rand < 6) {
            return this.makeJ();
        } else {
            return this.makeL();
        }
    }
}

class Game {
    protected canvas: HTMLCanvasElement;

    /** Cells are stored in row-major order, ie it must be indexed like this:
     * `board[y][x]`
     */
    protected board: Color[][];
    protected activePiece: Piece;
    protected preventTouchdown: boolean;
    protected userVelX: number;
    protected userVelY: number;

    constructor() {
        this.canvas = document.getElementById('game') as HTMLCanvasElement;
        this.activePiece = Piece.makeRandom();
        this.preventTouchdown = false;
        this.userVelX = 0;
        this.userVelY = 0;
        this.board = [];
        // The board is actually 10 * 40 big, but only the bottom 20 rows are visible to the player
        for (let y = 0; y < 40; y++) {
            let row = [];
            for (let x = 0; x < 10; x++) {
                row.push(Color.Empty);
            }
            this.board.push(row);
        }

        window.addEventListener('keydown', event => {
            // console.log(event.key);
            if (event.key === "ArrowRight") {
                this.userVelX = 1;
            }
            if (event.key === "ArrowLeft") {
                this.userVelX = -1;
            }
            if (event.key === "ArrowUp") {
                // TODO: rotate the piece
                this.rotateCW();
            }
            if (event.key === "ArrowDown") {
                this.userVelY = -1;
            }
        });

        window.addEventListener('keyup', event => {
            if (event.key === "ArrowRight") {
                if (this.userVelX > 0) this.userVelX = 0;
            }
            if (event.key === "ArrowLeft") {
                if (this.userVelX < 0) this.userVelX = 0;
            }
            if (event.key === "ArrowDown") {
                this.userVelY = 0;
            }
        })

        setInterval(this.fallUpdate.bind(this), 300);
        setInterval(this.userMovementUpdate.bind(this), 80);
    }

    /**
     * Rotates the active piece clockwise
     */
    rotateCW() {
        this.preventTouchdown = true;
    }

    userMovementUpdate() {
        if (this.userVelX != 0) {
            this.movePiece(this.activePiece, this.userVelX, 0);
            this.preventTouchdown = true;
        }
        if (this.userVelY != 0) {
            this.movePiece(this.activePiece, 0, this.userVelY);
        }
    }

    fallUpdate() {
        // If the piece cannot move further down, then let's bake it into the board
        if (!this.canMove(this.activePiece, 0, -1)) {
            // Move the piece down if there wasn't a rotation since the last update
            if (this.preventTouchdown) {
                this.preventTouchdown = false;
                return;
            }
            this.bakePiece(this.activePiece);
            this.activePiece = Piece.makeRandom();
        } else {
            // Move it down
            this.activePiece.position[1] -= 1;
        }
        this.render();
    }

    /** 
     * WARNING: It must be true that: |dx| <= 1 and |dy| <= 1 
     */
    movePiece(piece: Piece, dx: number, dy: number) {
        if (this.canMove(piece, dx, dy)) {
            piece.position[0] += dx;
            piece.position[1] += dy;
            this.render()
        }
    }

    bakePiece(piece: Piece) {
        piece.forEachCell((color, x, y) => {
            this.board[y][x] = color;
        });
    }

    /** Returns true if nothing is in the way of the piece to move by the given amount
     * 
     * WARNING: It must be true that: |dx| <= 1 and |dy| <= 1 
    */
    canMove(piece: Piece, dx: number, dy: number): boolean {
        let foundSolidInTheWay = false;
        piece.forEachCell((_color, x, y) => {
            if (this.isSolid(x + dx, y + dy)) {
                foundSolidInTheWay = true;
            }
        });
        return !foundSolidInTheWay;
    }

    isSolid(x: number, y: number): boolean {
        if (x < 0 || x >= this.board[0].length) return true;
        if (y < 0 || y >= this.board.length) return true;

        return this.board[y][x] !== Color.Empty;
    }

    render() {
        let ctx = this.canvas.getContext("2d");
        if (!ctx) {
            console.error("Could not get canvas context");
            return;
        }

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        const cellWidth = this.canvas.width / VISIBLE_HOR_CELL_COUNT;
        const cellHeight = this.canvas.height / VISIBLE_VER_CELL_COUNT;

        const drawCell = (color: Color, x: number, y: number) => {
            if (color !== Color.Empty) {
                ctx!.fillStyle = getStyleForColor(color);

                let pixelX = x * cellWidth;
                // Adding one to the y coordinate because the cell positions 
                // specify the location of the lower left corner of the cell but
                // `fillRect` expects the position of the top left corner
                let pixelY = this.canvas.height - (y + 1) * cellHeight;
                ctx!.fillRect(pixelX, pixelY, cellWidth, cellHeight)
            }
        };

        // Draw the board
        for (let y = 0; y < VISIBLE_VER_CELL_COUNT; y++) {
            const row = this.board[y];
            for (let x = 0; x < VISIBLE_HOR_CELL_COUNT; x++) {
                const color = row[x];
                drawCell(color, x, y);
            }
        }
        // Draw the active piece
        this.activePiece.forEachCell((color, x, y) => {
            drawCell(color, x, y);
        })
    }
}

let game = new Game();
window.requestAnimationFrame(game.render.bind(game));
