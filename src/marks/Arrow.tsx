import React from "react";
import { useFrameSafe } from "../scene/frame-context.ts";
import { requireFrame } from "../scene/position.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";
import { arrowMarkerId } from "./markers.tsx";
import { useFigureScope } from "../scene/Figure.tsx";

/** Data endpoints `from`/`to`, or figure-pixel endpoints `x1`/`y1`/`x2`/`y2`. */
export type ArrowGeometry =
  | { from: [number, number]; to: [number, number]; x1?: never; y1?: never; x2?: never; y2?: never }
  | { x1: number; y1: number; x2: number; y2: number; from?: never; to?: never };

export type ArrowProps = ArrowGeometry & {
  tone?: Tone;
  weight?: Weight;
  dash?: Dash;
  opacity?: number;
  markerStart?: boolean;
  markerEnd?: boolean;
  className?: string;
};

export function Arrow({
  from,
  to,
  x1: px1,
  y1: py1,
  x2: px2,
  y2: py2,
  tone = "ink",
  weight = "regular",
  dash = "solid",
  opacity,
  markerStart = false,
  markerEnd = true,
  className,
}: ArrowProps) {
  const frame = useFrameSafe();
  const theme = useTheme();
  const { id: figureId } = useFigureScope();

  const strokeColor = resolveTone(tone, theme);
  const strokeWidth = resolveWeight(weight, theme);
  const strokeDasharray = resolveDash(dash);

  let x1: number, y1: number, x2: number, y2: number;
  if (from && to) {
    const { toPx } = requireFrame("Arrow", frame, "`x1`/`y1`/`x2`/`y2`");
    [x1, y1] = toPx(from);
    [x2, y2] = toPx(to);
  } else if (px1 !== undefined && py1 !== undefined && px2 !== undefined && py2 !== undefined) {
    [x1, y1, x2, y2] = [px1, py1, px2, py2];
  } else {
    throw new Error("Arrow: needs `from`/`to` (data coordinates) or `x1`/`y1`/`x2`/`y2` (figure pixels).");
  }

  const markerUrl = `url(#${arrowMarkerId(figureId, tone)})`;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      markerStart={markerStart ? markerUrl : undefined}
      markerEnd={markerEnd ? markerUrl : undefined}
      opacity={opacity}
      className={`vellum-arrow ${className ?? ""}`.trim()}
    />
  );
}
