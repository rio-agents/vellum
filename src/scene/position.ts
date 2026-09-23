import type { FrameContextValue } from "./frame-context.ts";

/**
 * Where a positioned mark sits. The coordinate rule for the whole library:
 *
 * - scalar SVG-style coordinates (`x`, `y`, `x1`, `y2`, `width`, …) are figure pixels,
 *   even inside a Panel;
 * - point tuples (`at`, `from`, `to`, `points`, `center`) are data coordinates of the
 *   enclosing Panel and are an error outside one;
 * - `offset` is always a pixel nudge applied after positioning.
 */
export type Placement =
  | { at: [number, number]; x?: never; y?: never }
  | { x: number; y: number; at?: never };

/** Returns the enclosing Panel's frame for a mark given data coordinates, failing clearly outside one. */
export function requireFrame(
  mark: string,
  frame: FrameContextValue | null,
  pixelAlternative: string
): FrameContextValue {
  if (!frame) {
    throw new Error(
      `${mark}: point coordinates are data coordinates and need an enclosing <Panel>; use ${pixelAlternative} for figure pixels.`
    );
  }
  return frame;
}

/** Resolves a Label, MathLabel, or Point placement to figure pixels. */
export function placementToPx(
  mark: string,
  placement: { at?: [number, number]; x?: number; y?: number },
  frame: FrameContextValue | null
): [number, number] {
  const { at, x, y } = placement;
  if (at && (x !== undefined || y !== undefined)) {
    throw new Error(`${mark}: give either \`at\` (data coordinates) or \`x\`/\`y\` (figure pixels), not both.`);
  }
  if (at) return requireFrame(mark, frame, "`x`/`y`").toPx(at);
  if (x === undefined || y === undefined) {
    throw new Error(`${mark}: needs \`at\` (data coordinates) or both \`x\` and \`y\` (figure pixels).`);
  }
  return [x, y];
}
