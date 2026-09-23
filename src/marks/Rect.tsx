import React from "react";
import { useFrameSafe } from "../scene/frame-context.ts";
import { requireFrame } from "../scene/position.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";

/** Opposite corners in data coordinates, or a box in figure pixels. */
export type RectGeometry =
  | { from: [number, number]; to: [number, number]; x?: never; y?: never; width?: never; height?: never }
  | { x: number; y: number; width: number; height: number; from?: never; to?: never };

export type RectProps = RectGeometry & {
  tone?: Tone;
  /** Fill opacity; 0 draws an outline only. */
  fillOpacity?: number;
  strokeTone?: Tone;
  weight?: Weight;
  dash?: Dash;
  className?: string;
};

export function Rect({
  from,
  to,
  x,
  y,
  width,
  height,
  tone = "accent",
  fillOpacity,
  strokeTone,
  weight = "hairline",
  dash = "solid",
  className,
}: RectProps) {
  const frame = useFrameSafe();
  const theme = useTheme();

  let box: { left: number; top: number; width: number; height: number };
  if (from && to) {
    const { sx, sy } = requireFrame("Rect", frame, "`x`/`y`/`width`/`height`");
    const [x0, y0, x1, y1] = [sx(from[0]), sy(from[1]), sx(to[0]), sy(to[1])];
    box = { left: Math.min(x0, x1), top: Math.min(y0, y1), width: Math.abs(x1 - x0), height: Math.abs(y1 - y0) };
  } else if (x !== undefined && y !== undefined && width !== undefined && height !== undefined) {
    box = { left: x, top: y, width, height };
  } else {
    throw new Error("Rect: needs `from`/`to` (data corners) or `x`/`y`/`width`/`height` (figure pixels).");
  }

  return (
    <rect
      x={Number(box.left.toFixed(2))}
      y={Number(box.top.toFixed(2))}
      width={Number(box.width.toFixed(2))}
      height={Number(box.height.toFixed(2))}
      fill={fillOpacity === 0 ? "none" : resolveTone(tone, theme)}
      fillOpacity={fillOpacity === 0 ? undefined : (fillOpacity ?? theme.opacity.fill)}
      stroke={strokeTone ? resolveTone(strokeTone, theme) : "none"}
      strokeWidth={resolveWeight(weight, theme)}
      strokeDasharray={resolveDash(dash)}
      className={`vellum-rect ${className ?? ""}`.trim()}
    />
  );
}
