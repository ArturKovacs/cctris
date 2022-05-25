import { Color } from "./base";
const NON_I_WALL_KICKS = new Map();
NON_I_WALL_KICKS.set("0>1", [{ x: -1, y: 0 }, { x: -1, y: +1 }, { x: 0, y: -2 }, { x: -1, y: -2 }]);
NON_I_WALL_KICKS.set("1>0", [{ x: +1, y: 0 }, { x: +1, y: -1 }, { x: 0, y: +2 }, { x: +1, y: +2 }]);
NON_I_WALL_KICKS.set("1>2", [{ x: +1, y: 0 }, { x: +1, y: -1 }, { x: 0, y: +2 }, { x: +1, y: +2 }]);
NON_I_WALL_KICKS.set("2>1", [{ x: -1, y: 0 }, { x: -1, y: +1 }, { x: 0, y: -2 }, { x: -1, y: -2 }]);
NON_I_WALL_KICKS.set("2>3", [{ x: +1, y: 0 }, { x: +1, y: +1 }, { x: 0, y: -2 }, { x: +1, y: -2 }]);
NON_I_WALL_KICKS.set("3>2", [{ x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: +2 }, { x: -1, y: +2 }]);
NON_I_WALL_KICKS.set("3>0", [{ x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: +2 }, { x: -1, y: +2 }]);
NON_I_WALL_KICKS.set("0>3", [{ x: +1, y: 0 }, { x: +1, y: +1 }, { x: 0, y: -2 }, { x: +1, y: -2 }]);
const I_WALL_KICKS = new Map();
I_WALL_KICKS.set("0>1", [{ x: -2, y: 0 }, { x: +1, y: 0 }, { x: -2, y: -1 }, { x: +1, y: +2 }]);
I_WALL_KICKS.set("1>0", [{ x: +2, y: 0 }, { x: -1, y: 0 }, { x: +2, y: +1 }, { x: -1, y: -2 }]);
I_WALL_KICKS.set("1>2", [{ x: -1, y: 0 }, { x: +2, y: 0 }, { x: -1, y: +2 }, { x: +2, y: -1 }]);
I_WALL_KICKS.set("2>1", [{ x: +1, y: 0 }, { x: -2, y: 0 }, { x: +1, y: -2 }, { x: -2, y: +1 }]);
I_WALL_KICKS.set("2>3", [{ x: +2, y: 0 }, { x: -1, y: 0 }, { x: +2, y: +1 }, { x: -1, y: -2 }]);
I_WALL_KICKS.set("3>2", [{ x: -2, y: 0 }, { x: +1, y: 0 }, { x: -2, y: -1 }, { x: +1, y: +2 }]);
I_WALL_KICKS.set("3>0", [{ x: +1, y: 0 }, { x: -2, y: 0 }, { x: +1, y: -2 }, { x: -2, y: +1 }]);
I_WALL_KICKS.set("0>3", [{ x: -1, y: 0 }, { x: +2, y: 0 }, { x: -1, y: +2 }, { x: +2, y: -1 }]);
export class Piece {
    constructor(shape, pos, wallKicks) {
        this.shape = shape;
        this.position = pos;
        this.rotation = 0;
        this.wallKicks = wallKicks;
    }
    /**
     * Calls `calllback` for every non-empty cell of the piece.
     *
     * For each cell, the callback gets the color of the cell and the
     * coordinates on the board for that cell.
     */
    forEachCell(callback) {
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
    /**
     * Rotates the shape 90 degrees counter clockwise
     * This does not consider wall-kicks */
    rawRotateCw() {
        let newShape = [];
        for (let newY = 0; newY < this.shape.length; newY++) {
            const newRow = [];
            newShape.push(newRow);
            let oldX = (this.shape.length - +1) - newY;
            for (let newX = 0; newX < this.shape.length; newX++) {
                let oldY = newX;
                const color = this.shape[oldY][oldX];
                newRow.push(color);
            }
        }
        this.shape = newShape;
    }
    rawRotateCcw() {
        let newShape = [];
        for (let newY = 0; newY < this.shape.length; newY++) {
            const newRow = [];
            newShape.push(newRow);
            let oldX = newY;
            for (let newX = 0; newX < this.shape.length; newX++) {
                let oldY = (this.shape.length - 1) - newX;
                const color = this.shape[oldY][oldX];
                newRow.push(color);
            }
        }
        this.shape = newShape;
    }
    rotate(clockwise, canMove) {
        if (clockwise) {
            this.rawRotateCw();
        }
        else {
            this.rawRotateCcw();
        }
        let newRot;
        if (clockwise) {
            newRot = this.rotation + 1;
            if (newRot > 3) {
                newRot = 0;
            }
        }
        else {
            newRot = this.rotation - 1;
            if (newRot < 0) {
                newRot = 3;
            }
        }
        // Just check if this state would collide with something
        if (canMove(this, 0, 0)) {
            this.rotation = newRot;
            return;
        }
        const rotString = this.rotation + ">" + newRot;
        const testOffsets = this.wallKicks.get(rotString);
        if (testOffsets == undefined) {
            console.error("Couldn't find a wallkick for the give state change, this should be impossible");
            return;
        }
        for (const offset of testOffsets) {
            if (canMove(this, offset.x, offset.y)) {
                this.position[0] += offset.x;
                this.position[1] += offset.y;
                this.rotation = newRot;
                return;
            }
        }
        // If we got here, it means that none of the positions were valid, so we must rotate back.
        if (clockwise) {
            this.rawRotateCcw();
        }
        else {
            this.rawRotateCw();
        }
    }
    static makeI(c = Color.Cyan) {
        // Appears vertically flipped (because shape[0] is the bottommost row)
        let shape = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [c, c, c, c],
            [0, 0, 0, 0],
        ];
        return new Piece(shape, [3, +19], I_WALL_KICKS);
    }
    static makeZ(c = Color.Red) {
        // Appears vertically flipped (because shape[0] is the bottommost row)
        let shape = [
            [0, 0, 0],
            [0, c, c],
            [c, c, 0]
        ];
        return new Piece(shape, [3, +20], NON_I_WALL_KICKS);
    }
    static makeS(c = Color.Green) {
        // Appears vertically flipped (because shape[0] is the bottommost row)
        let shape = [
            [0, 0, 0],
            [c, c, 0],
            [0, c, c]
        ];
        return new Piece(shape, [3, +20], NON_I_WALL_KICKS);
    }
    static makeO(c = Color.Yellow) {
        let shape = [
            [c, c],
            [c, c],
        ];
        return new Piece(shape, [4, +21], NON_I_WALL_KICKS);
    }
    static makeT(c = Color.Purple) {
        // Appears vertically flipped (because shape[0] is the bottommost row)
        let shape = [
            [0, 0, 0],
            [c, c, c],
            [0, c, 0]
        ];
        return new Piece(shape, [3, +20], NON_I_WALL_KICKS);
    }
    static makeJ(c = Color.Blue) {
        // Appears vertically flipped (because shape[0] is the bottommost row)
        let shape = [
            [0, 0, 0],
            [c, c, c],
            [c, 0, 0]
        ];
        return new Piece(shape, [3, +20], NON_I_WALL_KICKS);
    }
    static makeL(c = Color.Orange) {
        // Appears vertically flipped (because shape[0] is the bottommost row)
        let shape = [
            [0, 0, 0],
            [c, c, c],
            [0, 0, c]
        ];
        return new Piece(shape, [3, +20], NON_I_WALL_KICKS);
    }
    static makeRandom() {
        let rand = Math.random() * 7;
        if (rand < +1) {
            return this.makeI();
        }
        else if (rand < +2) {
            return this.makeS();
        }
        else if (rand < 3) {
            return this.makeZ();
        }
        else if (rand < 4) {
            return this.makeO();
        }
        else if (rand < 5) {
            return this.makeT();
        }
        else if (rand < 6) {
            return this.makeJ();
        }
        else {
            return this.makeL();
        }
    }
}
