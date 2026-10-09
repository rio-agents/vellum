import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";
import { contourLines, levelRegionPolygons } from "../math/level-sets.ts";

interface LevelSetProps {
  /** The function whose level set is drawn, in data coordinates. */
  fn: (x: number, y: number) => number;
  /** Region to trace, in data coordinates; defaults to the panel domain. */
  x?: [number, number];
  y?: [number, number];
  /** Grid cells across the region; rows follow from the panel's aspect. */
  resolution?: number;
}

function gridSize(resolution: number, area: { width: number; height: number }) {
  const columns = Math.max(2, Math.round(resolution));
  const rows = Math.max(2, Math.round((resolution * area.height) / Math.max(1, area.width)));
  return { columns, rows };
}

export interface ContourProps extends LevelSetProps {
  /** One level or several; each draws the curve fn(x, y) = level. */
  levels: number | number[];
  tone?: Tone;
  weight?: Weight;
  dash?: Dash;
  opacity?: number;
  className?: string;
}

/**
 * Level curves fn(x, y) = c, traced with marching squares. For a direction
 * field these are its isoclines: every mark on one has the same slope.
 */
export function Contour({
  fn,
  levels,
  x,
  y,
  resolution = 120,
  tone = "ink",
  weight = "regular",
  dash = "solid",
  opacity,
  className,
}: ContourProps) {
  const frame = useFrame();
  const theme = useTheme();
  const { columns, rows } = gridSize(resolution, frame.area);
  const d = (Array.isArray(levels) ? levels : [levels])
    .flatMap((level) => contourLines({ fn, level, x: x ?? frame.xDomain, y: y ?? frame.yDomain, columns, rows }))
    .map((line) => line.map(([px, py], i) => `${i ? "L" : "M"}${frame.sx(px).toFixed(2)} ${frame.sy(py).toFixed(2)}`).join(""))
    .join("");
  if (!d) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={resolveTone(tone, theme)}
      strokeWidth={resolveWeight(weight, theme)}
      strokeDasharray={resolveDash(dash)}
      strokeLinejoin="round"
      opacity={opacity}
      className={`vellum-contour ${className ?? ""}`.trim()}
    />
  );
}

export interface LevelRegionProps extends LevelSetProps {
  /** Fill where fn(x, y) is above this level, or below it with `side="below"`. */
  level?: number;
  side?: "above" | "below";
  tone?: Tone;
  fillOpacity?: number;
  className?: string;
}

/**
 * Fills the region where fn(x, y) > level (or < level), such as the part of a
 * direction field where solutions rise. The boundary follows the level curve
 * smoothly rather than in grid steps.
 */
export function LevelRegion({
  fn,
  level = 0,
  side = "above",
  x,
  y,
  resolution = 80,
  tone = "accentSubtle",
  fillOpacity = 1,
  className,
}: LevelRegionProps) {
  const frame = useFrame();
  const theme = useTheme();
  const { columns, rows } = gridSize(resolution, frame.area);
  const d = levelRegionPolygons({ fn, level, side, x: x ?? frame.xDomain, y: y ?? frame.yDomain, columns, rows })
    .map((polygon) => polygon.map(([px, py], i) => `${i ? "L" : "M"}${frame.sx(px).toFixed(2)} ${frame.sy(py).toFixed(2)}`).join("") + "Z")
    .join("");
  if (!d) return null;
  return (
    <path
      d={d}
      fill={resolveTone(tone, theme)}
      fillOpacity={fillOpacity}
      stroke="none"
      className={`vellum-level-region ${className ?? ""}`.trim()}
    />
  );
}
