import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";
import { scalarSolution } from "../math/ode.ts";

export interface SolutionCurveProps {
  /** Right-hand side of y' = rate(x, y). */
  rate: (x: number, y: number) => number;
  /** The initial condition the solution passes through, in data coordinates. */
  through: [number, number];
  /** Interval of x to draw; defaults to the panel's x domain. */
  domain?: [number, number];
  /** Follow the solution to the right, to the left, or both ways from the start. */
  direction?: "both" | "forward" | "backward";
  /** Integration step in x; defaults to 1/400 of the drawn interval. */
  step?: number;
  tone?: Tone;
  weight?: Weight;
  dash?: Dash;
  opacity?: number;
  className?: string;
}

/**
 * The solution of y' = rate(x, y) through one point, computed with fourth-order
 * Runge–Kutta and drawn until it leaves the panel. Use it when the equation has
 * no convenient formula, or to show that a drawn curve really follows the field.
 */
export function SolutionCurve({
  rate,
  through,
  domain,
  direction = "both",
  step,
  tone = "accent",
  weight = "bold",
  dash = "solid",
  opacity,
  className,
}: SolutionCurveProps) {
  const frame = useFrame();
  const theme = useTheme();
  const [y0, y1] = frame.yDomain;
  const margin = (y1 - y0) * 0.1;
  const points = scalarSolution({
    rate,
    through,
    x: domain ?? frame.xDomain,
    y: [Math.min(y0, y1) - margin, Math.max(y0, y1) + margin],
    step,
    direction,
  });
  if (points.length < 2) return null;
  const d = points
    .map(([x, y], i) => `${i ? "L" : "M"}${frame.sx(x).toFixed(2)} ${frame.sy(y).toFixed(2)}`)
    .join("");
  return (
    <path
      d={d}
      fill="none"
      stroke={resolveTone(tone, theme)}
      strokeWidth={resolveWeight(weight, theme)}
      strokeDasharray={resolveDash(dash)}
      strokeLinejoin="round"
      strokeLinecap="round"
      opacity={opacity}
      className={`vellum-solution-curve ${className ?? ""}`.trim()}
    />
  );
}
