import type { Vec2 } from "./linalg.ts";

export interface LevelGridOptions {
  /** The function whose level set is traced. */
  fn: (x: number, y: number) => number;
  x: [number, number];
  y: [number, number];
  /** Number of grid cells across and up the region. */
  columns: number;
  rows: number;
}

interface SampledGrid {
  values: number[][];
  at: (i: number, j: number) => Vec2;
}

function sampleGrid({ fn, x, y, columns, rows }: LevelGridOptions, level: number): SampledGrid {
  const at = (i: number, j: number): Vec2 => [x[0] + (i * (x[1] - x[0])) / columns, y[0] + (j * (y[1] - y[0])) / rows];
  const values: number[][] = [];
  for (let i = 0; i <= columns; i++) {
    values[i] = [];
    for (let j = 0; j <= rows; j++) {
      const [px, py] = at(i, j);
      const v = fn(px, py) - level;
      // A non-finite sample is treated as far from the level, so no line passes through it.
      values[i][j] = Number.isFinite(v) ? v : Number.NaN;
    }
  }
  return { values, at };
}

/**
 * Traces the curve fn(x, y) = level with marching squares and returns it as
 * polylines in data coordinates. Pieces that meet at a cell edge are joined,
 * so dashed strokes stay continuous; a closed loop repeats its first point.
 */
export function contourLines(options: LevelGridOptions & { level: number }): Vec2[][] {
  const { columns, rows } = options;
  const { values, at } = sampleGrid(options, options.level);

  // Each crossing is identified by the grid edge it lies on, so neighbouring
  // cells agree on it exactly.
  const crossing = new Map<string, Vec2>();
  const edgePoint = (key: string, a: [number, number], b: [number, number]): string => {
    if (!crossing.has(key)) {
      const va = values[a[0]][a[1]];
      const vb = values[b[0]][b[1]];
      const t = va / (va - vb);
      const pa = at(a[0], a[1]);
      const pb = at(b[0], b[1]);
      crossing.set(key, [pa[0] + t * (pb[0] - pa[0]), pa[1] + t * (pb[1] - pa[1])]);
    }
    return key;
  };

  const links = new Map<string, string[]>();
  const link = (p: string, q: string) => {
    if (!links.has(p)) links.set(p, []);
    if (!links.has(q)) links.set(q, []);
    links.get(p)!.push(q);
    links.get(q)!.push(p);
  };

  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      const corners: [number, number][] = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
      const v = corners.map(([a, b]) => values[a][b]);
      if (v.some(Number.isNaN)) continue;
      const above = v.map((value) => value > 0);
      // Edges in order: bottom, right, top, left.
      const edges: { key: string; a: [number, number]; b: [number, number] }[] = [
        { key: `h${i},${j}`, a: [i, j], b: [i + 1, j] },
        { key: `v${i + 1},${j}`, a: [i + 1, j], b: [i + 1, j + 1] },
        { key: `h${i},${j + 1}`, a: [i, j + 1], b: [i + 1, j + 1] },
        { key: `v${i},${j}`, a: [i, j], b: [i, j + 1] },
      ];
      const crossed = edges
        .map((edge, k) => ({ edge, k }))
        .filter(({ k }) => above[k] !== above[(k + 1) % 4])
        .map(({ edge }) => edgePoint(edge.key, edge.a, edge.b));
      if (crossed.length === 2) {
        link(crossed[0], crossed[1]);
      } else if (crossed.length === 4) {
        // A saddle: the cell's mean decides which corners the level separates.
        const centerAbove = (v[0] + v[1] + v[2] + v[3]) / 4 > 0;
        if (centerAbove === above[0]) {
          link(crossed[0], crossed[1]);
          link(crossed[2], crossed[3]);
        } else {
          link(crossed[3], crossed[0]);
          link(crossed[1], crossed[2]);
        }
      }
    }
  }

  const used = new Set<string>();
  const lines: Vec2[][] = [];
  const walk = (start: string) => {
    const keys = [start];
    used.add(start);
    let current = start;
    for (;;) {
      const next = links.get(current)!.find((k) => !used.has(k));
      if (!next) break;
      used.add(next);
      keys.push(next);
      current = next;
    }
    if (keys.length > 2 && links.get(current)!.includes(start)) keys.push(start);
    return keys;
  };

  // Open curves start at an end, a point with one neighbour; what remains are loops.
  for (const [key, neighbours] of links) {
    if (neighbours.length === 1 && !used.has(key)) lines.push(walk(key).map((k) => crossing.get(k)!));
  }
  for (const key of links.keys()) {
    if (!used.has(key)) lines.push(walk(key).map((k) => crossing.get(k)!));
  }
  return lines;
}

function polygonArea(polygon: Vec2[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    area += (x1 * y2 - x2 * y1) / 2;
  }
  return area;
}

/**
 * The region where fn(x, y) > level (or < level), as polygons in data
 * coordinates, all counterclockwise. Each grid cell is split into two
 * triangles on which fn is treated as linear, and full cells in a row are
 * merged into rectangles. Drawn as one path, the pieces fill without seams.
 */
export function levelRegionPolygons(options: LevelGridOptions & { level: number; side?: "above" | "below" }): Vec2[][] {
  const { columns, rows, side = "above" } = options;
  const sign = side === "above" ? 1 : -1;
  const { values, at } = sampleGrid(options, options.level);
  const inside = (v: number) => !Number.isNaN(v) && sign * v > 0;
  const polygons: Vec2[][] = [];
  const cell = at(1, 1);
  const origin = at(0, 0);
  const minArea = 1e-9 * Math.abs((cell[0] - origin[0]) * (cell[1] - origin[1]));

  const clipTriangle = (corners: [number, number][]) => {
    const v = corners.map(([a, b]) => sign * values[a][b]);
    if (v.some(Number.isNaN)) return;
    const p = corners.map(([a, b]) => at(a, b));
    const out: Vec2[] = [];
    for (let k = 0; k < 3; k++) {
      const n = (k + 1) % 3;
      if (v[k] > 0) out.push(p[k]);
      if (v[k] > 0 !== v[n] > 0) {
        const t = v[k] / (v[k] - v[n]);
        out.push([p[k][0] + t * (p[n][0] - p[k][0]), p[k][1] + t * (p[n][1] - p[k][1])]);
      }
    }
    // Skip slivers left where a grid point lies on the level up to rounding.
    if (out.length >= 3 && polygonArea(out) > minArea) polygons.push(out);
  };

  for (let j = 0; j < rows; j++) {
    let runStart = -1;
    const closeRun = (end: number) => {
      if (runStart < 0) return;
      const [x0, y0] = at(runStart, j);
      const [x1, y1] = at(end, j + 1);
      polygons.push([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
      runStart = -1;
    };
    for (let i = 0; i < columns; i++) {
      const full = inside(values[i][j]) && inside(values[i + 1][j]) && inside(values[i + 1][j + 1]) && inside(values[i][j + 1]);
      if (full) {
        if (runStart < 0) runStart = i;
        continue;
      }
      closeRun(i);
      clipTriangle([[i, j], [i + 1, j], [i + 1, j + 1]]);
      clipTriangle([[i, j], [i + 1, j + 1], [i, j + 1]]);
    }
    closeRun(columns);
  }
  return polygons;
}
