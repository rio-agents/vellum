import { cholesky2, type Mat2, type Vec2 } from "./linalg.ts";

export interface Box {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export function ellipsePoints(
  center: Vec2,
  cov: Mat2,
  radius: number = 1,
  samples: number = 180
): Vec2[] {
  const L = cholesky2(cov);
  const points: Vec2[] = [];
  for (let k = 0; k <= samples; k++) {
    const t = (2 * Math.PI * k) / samples;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const x = center[0] + radius * L[0][0] * cosT;
    const y = center[1] + radius * (L[1][0] * cosT + L[1][1] * sinT);
    points.push([x, y]);
  }
  return points;
}

export interface EllipseTangentPoints {
  xMax: Vec2;
  xMin: Vec2;
  yMax: Vec2;
  yMin: Vec2;
}

export function ellipseTangentPoints(cov: Mat2, radius: number = 1): EllipseTangentPoints {
  const sxx = cov[0][0];
  const sxy = cov[0][1];
  const syy = cov[1][1];

  const stdX = Math.sqrt(Math.max(0, sxx));
  const stdY = Math.sqrt(Math.max(0, syy));

  const xMax: Vec2 = [radius * stdX, stdX > 0 ? (radius * sxy) / stdX : 0];
  const xMin: Vec2 = [-xMax[0], -xMax[1]];

  const yMax: Vec2 = [stdY > 0 ? (radius * sxy) / stdY : 0, radius * stdY];
  const yMin: Vec2 = [-yMax[0], -yMax[1]];

  return { xMax, xMin, yMax, yMin };
}

export function projectOnto(point: Vec2, direction: Vec2): Vec2 {
  const len2 = direction[0] * direction[0] + direction[1] * direction[1];
  if (len2 < 1e-14) return [0, 0];
  const scale = (point[0] * direction[0] + point[1] * direction[1]) / len2;
  return [scale * direction[0], scale * direction[1]];
}

export function clipLineToBox(
  point: Vec2,
  direction: Vec2,
  box: Box
): [Vec2, Vec2] | null {
  const dx = direction[0];
  const dy = direction[1];
  const px = point[0];
  const py = point[1];

  let tEnter = -Infinity;
  let tExit = Infinity;

  // X slab
  if (Math.abs(dx) < 1e-14) {
    if (px < box.xMin || px > box.xMax) return null;
  } else {
    let t1 = (box.xMin - px) / dx;
    let t2 = (box.xMax - px) / dx;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tEnter = Math.max(tEnter, t1);
    tExit = Math.min(tExit, t2);
    if (tEnter > tExit) return null;
  }

  // Y slab
  if (Math.abs(dy) < 1e-14) {
    if (py < box.yMin || py > box.yMax) return null;
  } else {
    let t1 = (box.yMin - py) / dy;
    let t2 = (box.yMax - py) / dy;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tEnter = Math.max(tEnter, t1);
    tExit = Math.min(tExit, t2);
    if (tEnter > tExit) return null;
  }

  return [
    [px + tEnter * dx, py + tEnter * dy],
    [px + tExit * dx, py + tExit * dy],
  ];
}

export function rotate2(point: Vec2, angleRad: number, origin: Vec2 = [0, 0]): Vec2 {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = point[0] - origin[0];
  const dy = point[1] - origin[1];
  return [
    origin[0] + dx * cos - dy * sin,
    origin[1] + dx * sin + dy * cos,
  ];
}
