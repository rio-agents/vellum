import type { Vec2 } from "./linalg.ts";

export interface ScalarSolutionOptions {
  /** Right-hand side of y' = rate(x, y). */
  rate: (x: number, y: number) => number;
  /** The initial condition (x0, y0) the solution passes through. */
  through: Vec2;
  /** Interval of x to follow the solution across; the start must lie inside it. */
  x: [number, number];
  /** Stop once y leaves this interval; the step that leaves it is kept so a drawn curve reaches the edge. */
  y?: [number, number];
  /** Step size in x. Defaults to 1/400 of the x interval. */
  step?: number;
  /** Follow the solution to the right, to the left, or both ways from the start. */
  direction?: "both" | "forward" | "backward";
}

function rk4Step(rate: (x: number, y: number) => number, x: number, y: number, h: number): number {
  const k1 = rate(x, y);
  const k2 = rate(x + h / 2, y + (h / 2) * k1);
  const k3 = rate(x + h / 2, y + (h / 2) * k2);
  const k4 = rate(x + h, y + h * k3);
  return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

function follow(
  rate: (x: number, y: number) => number,
  [x0, y0]: Vec2,
  end: number,
  h: number,
  y?: [number, number]
): Vec2[] {
  const points: Vec2[] = [];
  let x = x0;
  let v = y0;
  const sign = Math.sign(end - x0);
  if (sign === 0) return points;
  const maxSteps = Math.ceil(Math.abs(end - x0) / h) + 1;
  for (let i = 0; i < maxSteps; i++) {
    const step = Math.min(h, Math.abs(end - x)) * sign;
    if (step === 0) break;
    const next = rk4Step(rate, x, v, step);
    x += step;
    v = next;
    if (!Number.isFinite(v)) break;
    points.push([x, v]);
    if (y && (v < y[0] || v > y[1])) break;
  }
  return points;
}

/**
 * Samples the solution of y' = rate(x, y) through a given point with the
 * classical fourth-order Runge–Kutta method. Points are ordered by increasing x.
 */
export function scalarSolution({
  rate,
  through,
  x,
  y,
  step,
  direction = "both",
}: ScalarSolutionOptions): Vec2[] {
  const h = Math.abs(step ?? (x[1] - x[0]) / 400);
  if (!(h > 0)) throw new Error("scalarSolution needs a positive step.");
  const forward = direction === "backward" ? [] : follow(rate, through, x[1], h, y);
  const backward = direction === "forward" ? [] : follow(rate, through, x[0], h, y);
  return [...backward.reverse(), through, ...forward];
}
