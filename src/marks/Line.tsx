import React from "react";
import { useFrameSafe } from "../scene/frame-context.ts";
import { requireFrame } from "../scene/position.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";
import { clipLineToBox } from "../math/geometry.ts";

type NoPixelEnds = { x1?: never; y1?: never; x2?: never; y2?: never };
type NoDataEnds = { from?: never; to?: never; point?: never; direction?: never; slope?: never; intercept?: never };

/**
 * Data forms, clipped to the enclosing Panel where unbounded: a segment `from`/`to`,
 * a line through `point` along `direction`, or `y = slope x + intercept`.
 * Pixel form: `x1`/`y1`/`x2`/`y2` in figure pixels.
 */
export type LineGeometry =
  | ({ from: [number, number]; to: [number, number]; point?: never; direction?: never; slope?: never; intercept?: never } & NoPixelEnds)
  | ({ point: [number, number]; direction: [number, number]; from?: never; to?: never; slope?: never; intercept?: never } & NoPixelEnds)
  | ({ slope: number; intercept?: number; from?: never; to?: never; point?: never; direction?: never } & NoPixelEnds)
  | ({ x1: number; y1: number; x2: number; y2: number } & NoDataEnds);

export type LineProps = LineGeometry & {
  tone?: Tone;
  weight?: Weight;
  dash?: Dash;
  opacity?: number;
  className?: string;
};

export function Line({
  from,
  to,
  point,
  direction,
  slope,
  intercept = 0,
  x1: px1,
  y1: py1,
  x2: px2,
  y2: py2,
  tone = "ink",
  weight = "regular",
  dash = "solid",
  opacity,
  className,
}: LineProps) {
  const frame = useFrameSafe();
  const theme = useTheme();

  const strokeColor = resolveTone(tone, theme);
  const strokeWidth = resolveWeight(weight, theme);
  const strokeDasharray = resolveDash(dash);

  let x1: number;
  let y1: number;
  let x2: number;
  let y2: number;

  if (px1 !== undefined && py1 !== undefined && px2 !== undefined && py2 !== undefined) {
    x1 = px1;
    y1 = py1;
    x2 = px2;
    y2 = py2;
  } else {
    const { toPx, xDomain, yDomain } = requireFrame("Line", frame, "`x1`/`y1`/`x2`/`y2`");
    let startPt: [number, number];
    let endPt: [number, number];

    if (from && to) {
      startPt = from;
      endPt = to;
    } else if (point && direction) {
      const box = {
        xMin: Math.min(xDomain[0], xDomain[1]),
        xMax: Math.max(xDomain[0], xDomain[1]),
        yMin: Math.min(yDomain[0], yDomain[1]),
        yMax: Math.max(yDomain[0], yDomain[1]),
      };
      const clipped = clipLineToBox(point, direction, box);
      if (!clipped) return null;
      startPt = clipped[0];
      endPt = clipped[1];
    } else if (slope !== undefined) {
      const pt: [number, number] = [0, intercept];
      const dir: [number, number] = [1, slope];
      const box = {
        xMin: Math.min(xDomain[0], xDomain[1]),
        xMax: Math.max(xDomain[0], xDomain[1]),
        yMin: Math.min(yDomain[0], yDomain[1]),
        yMax: Math.max(yDomain[0], yDomain[1]),
      };
      const clipped = clipLineToBox(pt, dir, box);
      if (!clipped) return null;
      startPt = clipped[0];
      endPt = clipped[1];
    } else {
      throw new Error("Line: needs `from`/`to`, `point`/`direction`, `slope`, or `x1`/`y1`/`x2`/`y2`.");
    }
    const p1 = toPx(startPt);
    const p2 = toPx(endPt);
    x1 = p1[0];
    y1 = p1[1];
    x2 = p2[0];
    y2 = p2[1];
  }

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      opacity={opacity}
      className={`vellum-line ${className ?? ""}`.trim()}
    />
  );
}
