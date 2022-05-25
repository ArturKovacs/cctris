
import { Color, getStyleForColor } from "./base";
import { Piece } from "./piece";

const VISIBLE_HOR_CELL_COUNT = 10;
const VISIBLE_VER_CELL_COUNT = 20;


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

    protected userMoveIntervalX: number;
    protected userMoveIntervalY: number;

    constructor() {
        this.canvas = document.getElementById('game') as HTMLCanvasElement;
        this.activePiece = Piece.makeRandom();
        this.preventTouchdown = false;
        this.userVelX = 0;
        this.userVelY = 0;
        this.userMoveIntervalX = 0;
        this.userMoveIntervalY = 0;
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
            if (event.key === "a") {
                this.fallUpdate();
            }
            const restartHorMove = () => {
                this.userMovementUpdate();
                if (this.userMoveIntervalX) {
                    clearInterval(this.userMoveIntervalX);
                    this.userMoveIntervalX = 0;
                }
                this.userMoveIntervalX = setInterval(this.userMovementUpdate.bind(this), 80) as any;
            };
            if (event.key === "ArrowRight") {
                this.userVelX = 1;
                restartHorMove();
            }
            if (event.key === "ArrowLeft") {
                this.userVelX = -1;
                restartHorMove();
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
    }

    /**
     * Rotates the active piece clockwise
     */
    rotateCW() {
        this.preventTouchdown = true;
        this.activePiece.rotate(true, this.canMove.bind(this));
        this.render();
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
            this.checkLineClear();
            this.activePiece = Piece.makeRandom();
        } else {
            // Move it down
            this.activePiece.position[1] -= 1;
        }
        this.render();
    }


    checkLineClear() {
        const moveRowsDown = (from: number) => {
            for (let y = from; y < this.board.length - 1; y++) {
                const dstRow = this.board[y];
                const srcRow = this.board[y + 1];
                for (let x = 0; x < dstRow.length; x++) {
                    dstRow[x] = srcRow[x];
                }
            }
            // Then clear the top row
            const top = this.board[this.board.length - 1];
            for (let x = 0; x < top.length; x++) {
                top[x] = Color.Empty;
            }
        };

        for (let y = 0; y < this.board.length; y++) {
            const row = this.board[y];
            let full = true;
            for (let x = 0; x < row.length; x++) {
                const color = row[x];
                if (color === Color.Empty) {
                    full = false;
                    break;
                }
            }
            if (full) {
                moveRowsDown(y);
                y--;
            }
        }
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
