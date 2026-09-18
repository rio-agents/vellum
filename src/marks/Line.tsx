import React from "react";
import { useFrameSafe } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";
import { clipLineToBox } from "../math/geometry.ts";

export interface LineProps {
  from?: [number, number];
  to?: [number, number];
  point?: [number, number];
  direction?: [number, number];
  slope?: number;
  intercept?: number;
  tone?: Tone | string;
  weight?: Weight;
  dash?: Dash;
  opacity?: number;
  className?: string;
}

export function Line({
  from,
  to,
  point,
  direction,
  slope,
  intercept = 0,
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

  if (frame) {
    const { toPx, xDomain, yDomain } = frame;
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
      return null;
    }
    const p1 = toPx(startPt);
    const p2 = toPx(endPt);
    x1 = p1[0];
    y1 = p1[1];
    x2 = p2[0];
    y2 = p2[1];
  } else {
    if (from && to) {
      x1 = from[0];
      y1 = from[1];
      x2 = to[0];
      y2 = to[1];
    } else {
      return null;
    }
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
      className={`webnotes-line ${className ?? ""}`.trim()}
    />
  );
}
