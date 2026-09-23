import React from "react";
import { line as d3Line, curveLinear, type CurveFactory } from "d3-shape";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";

export interface CurveProps {
  fn?: (x: number) => number;
  points?: [number, number][];
  domain?: [number, number];
  samples?: number;
  curve?: CurveFactory;
  tone?: Tone;
  weight?: Weight;
  dash?: Dash;
  opacity?: number;
  className?: string;
}

export function Curve({
  fn,
  points,
  domain,
  samples = 200,
  curve = curveLinear,
  tone = "ink",
  weight = "regular",
  dash = "solid",
  opacity,
  className,
}: CurveProps) {
  const frame = useFrame();
  const theme = useTheme();

  const strokeColor = resolveTone(tone, theme);
  const strokeWidth = resolveWeight(weight, theme);
  const strokeDasharray = resolveDash(dash);

  const { toPx, xDomain } = frame;

  let pts: [number, number][];

  if (points) {
    pts = points;
  } else if (fn) {
    const d = domain ?? xDomain;
    const step = (d[1] - d[0]) / Math.max(1, samples);
    pts = [];
    for (let i = 0; i <= samples; i++) {
      const xVal = d[0] + i * step;
      const yVal = fn(xVal);
      if (Number.isFinite(yVal)) {
        pts.push([xVal, yVal]);
      }
    }
  } else {
    return null;
  }

  const lineGen = d3Line<[number, number]>()
    .x((p) => frame.sx(p[0]))
    .y((p) => frame.sy(p[1]))
    .curve(curve);

  const pathData = lineGen(pts);
  if (!pathData) return null;

  return (
    <path
      d={pathData}
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      opacity={opacity}
      className={`vellum-curve ${className ?? ""}`.trim()}
    />
  );
}
