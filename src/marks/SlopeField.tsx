import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, type Weight } from "./style-helpers.ts";
import { slopeSegments } from "../math/fields.ts";

export interface SlopeFieldProps {
  /** Slope of the solution curve through (x, y), as in y' = slope(x, y). */
  slope: (x: number, y: number) => number;
  /** Sample columns and rows across the field; defaults suit a prose-width panel. */
  columns?: number;
  rows?: number;
  /** Region to fill, in data coordinates; defaults to the panel domain. */
  x?: [number, number];
  y?: [number, number];
  /** On-screen segment length in pixels. */
  length?: number;
  /** Draw only the grid points where this returns true. */
  where?: (x: number, y: number) => boolean;
  tone?: Tone;
  weight?: Weight;
  opacity?: number;
  className?: string;
}

/**
 * A direction field for y' = slope(x, y): one short tangent segment at each
 * grid point. Segments keep a fixed on-screen length and are drawn in pixel
 * space, so they stay tangent to solution curves on unequal axes.
 */
export function SlopeField({
  slope,
  columns = 21,
  rows = 13,
  x,
  y,
  length = 13,
  where,
  tone = "muted",
  weight = 1.1,
  opacity = 0.6,
  className,
}: SlopeFieldProps) {
  const frame = useFrame();
  const theme = useTheme();

  const segments = slopeSegments({
    slope,
    x: x ?? frame.xDomain,
    y: y ?? frame.yDomain,
    columns,
    rows,
    length,
    pxPerUnit: frame.pxPerUnit,
    where,
  });

  const path = segments
    .map(({ from, to }) => {
      const [x1, y1] = frame.toPx(from);
      const [x2, y2] = frame.toPx(to);
      return `M${x1} ${y1}L${x2} ${y2}`;
    })
    .join("");

  if (!path) return null;

  return (
    <path
      d={path}
      fill="none"
      stroke={resolveTone(tone, theme)}
      strokeWidth={resolveWeight(weight, theme)}
      strokeLinecap="round"
      opacity={opacity}
      className={`vellum-slope-field ${className ?? ""}`.trim()}
    />
  );
}
