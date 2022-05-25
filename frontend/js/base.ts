

export enum Color {
    Empty = 0,
    Cyan,
    Yellow,
    Purple,
    Green,
    Red,
    Blue,
    Orange,
}

const BG_STYLE = 'black';

export function getStyleForColor(color: Color): string {
    if (color == Color.Empty) {
        return BG_STYLE;
    }
    if (color == Color.Cyan) {
        return 'Cyan';
    }
    if (color == Color.Yellow) {
        return 'Yellow';
    }
    if (color == Color.Purple) {
        return 'Purple';
    }
    if (color == Color.Green) {
        return 'Green';
    }
    if (color == Color.Red) {
        return 'Red';
    }
    if (color == Color.Blue) {
        return 'Blue';
    }
    if (color == Color.Orange) {
        return 'Orange';
    }
    return "pink";
}
