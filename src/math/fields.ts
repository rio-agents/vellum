import type { Vec2 } from "./linalg.ts";

export interface SlopeSegment {
  /** Grid point where the slope is sampled, in data coordinates. */
  center: Vec2;
  from: Vec2;
  to: Vec2;
  slope: number;
}

export interface SlopeSegmentOptions {
  /** Slope of the solution curve through (x, y). */
  slope: (x: number, y: number) => number;
  x: [number, number];
  y: [number, number];
  /** Number of sample columns and rows; points sit at cell centers. */
  columns: number;
  rows: number;
  /** Rendered segment length in pixels. */
  length: number;
  /** Pixels per data unit on each axis, so segments look tangent when axes are scaled differently. */
  pxPerUnit: { x: number; y: number };
  /** Keep only the points where this returns true. */
  where?: (x: number, y: number) => boolean;
}

/**
 * Short tangent segments of a first-order equation y' = slope(x, y), centered
 * on a regular grid. Each segment has the same on-screen length whatever its
 * slope, and points with a non-finite slope are skipped.
 */
export function slopeSegments({
  slope,
  x,
  y,
  columns,
  rows,
  length,
  pxPerUnit,
  where,
}: SlopeSegmentOptions): SlopeSegment[] {
  const segments: SlopeSegment[] = [];
  const half = length / 2;

  for (let i = 0; i < columns; i++) {
    const cx = x[0] + ((i + 0.5) * (x[1] - x[0])) / columns;
    for (let j = 0; j < rows; j++) {
      const cy = y[0] + ((j + 0.5) * (y[1] - y[0])) / rows;
      if (where && !where(cx, cy)) continue;

      const m = slope(cx, cy);
      if (!Number.isFinite(m)) continue;

      // Direction (1, m) in data units, measured in pixels.
      const px = pxPerUnit.x;
      const py = m * pxPerUnit.y;
      const norm = Math.hypot(px, py);
      const dx = (px / norm) * half / pxPerUnit.x;
      const dy = (py / norm) * half / pxPerUnit.y;

      segments.push({
        center: [cx, cy],
        from: [cx - dx, cy - dy],
        to: [cx + dx, cy + dy],
        slope: m,
      });
    }
  }

  return segments;
}
