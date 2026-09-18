export type Anchor =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw"
  | "center"
  | "start"
  | "end"
  | "middle";

export function computeBoxOffset(
  anchor: Anchor,
  width: number,
  height: number
): [number, number] {
  switch (anchor) {
    case "center":
    case "middle":
      return [-width / 2, -height / 2];
    case "w":
    case "start":
      return [0, -height / 2];
    case "e":
    case "end":
      return [-width, -height / 2];
    case "n":
      return [-width / 2, 0];
    case "s":
      return [-width / 2, -height];
    case "nw":
      return [0, 0];
    case "ne":
      return [-width, 0];
    case "sw":
      return [0, -height];
    case "se":
      return [-width, -height];
    default:
      return [-width / 2, -height / 2];
  }
}
