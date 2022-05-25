export var Color;
(function (Color) {
    Color[Color["Empty"] = 0] = "Empty";
    Color[Color["Cyan"] = 1] = "Cyan";
    Color[Color["Yellow"] = 2] = "Yellow";
    Color[Color["Purple"] = 3] = "Purple";
    Color[Color["Green"] = 4] = "Green";
    Color[Color["Red"] = 5] = "Red";
    Color[Color["Blue"] = 6] = "Blue";
    Color[Color["Orange"] = 7] = "Orange";
})(Color || (Color = {}));
const BG_STYLE = 'black';
export function getStyleForColor(color) {
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
