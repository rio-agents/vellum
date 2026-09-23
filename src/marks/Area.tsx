import React from "react";
import { area as d3Area, curveLinear, type CurveFactory } from "d3-shape";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, type Weight } from "./style-helpers.ts";

export interface AreaDataPoint {
  x: number;
  y0: number;
  y1: number;
}

export interface AreaProps {
  fn?: (x: number) => number;
  baseline?: number | ((x: number) => number);
  points?: [number, number][] | [number, number, number][];
  domain?: [number, number];
  samples?: number;
  curve?: CurveFactory;
  tone?: Tone;
  fillOpacity?: number;
  strokeTone?: Tone;
  strokeWeight?: Weight;
  className?: string;
}

export function Area({
  fn,
  baseline = 0,
  points,
  domain,
  samples = 200,
  curve = curveLinear,
  tone = "accent",
  fillOpacity,
  strokeTone,
  strokeWeight,
  className,
}: AreaProps) {
  const frame = useFrame();
  const theme = useTheme();

  const fillColor = resolveTone(tone, theme);
  const opacity = fillOpacity ?? theme.opacity.fill;

  const strokeColor = strokeTone ? resolveTone(strokeTone, theme) : "none";
  const strokeWidth = strokeWeight ? resolveWeight(strokeWeight, theme) : 0;

  const { xDomain } = frame;

  let pts: AreaDataPoint[];

  if (points) {
    pts = points.map((p) => {
      if (p.length === 3) {
        return { x: p[0], y0: p[1], y1: p[2] };
      }
      const b = typeof baseline === "function" ? baseline(p[0]) : baseline;
      return { x: p[0], y0: b, y1: p[1] };
    });
  } else if (fn) {
    const d = domain ?? xDomain;
    const step = (d[1] - d[0]) / Math.max(1, samples);
    pts = [];
    for (let i = 0; i <= samples; i++) {
      const xVal = d[0] + i * step;
      const yVal = fn(xVal);
      const b = typeof baseline === "function" ? baseline(xVal) : baseline;
      if (Number.isFinite(yVal) && Number.isFinite(b)) {
        pts.push({ x: xVal, y0: b, y1: yVal });
      }
    }
  } else {
    return null;
  }

  const areaGen = d3Area<AreaDataPoint>()
    .x((d) => frame.sx(d.x))
    .y0((d) => frame.sy(d.y0))
    .y1((d) => frame.sy(d.y1))
    .curve(curve);

  const pathData = areaGen(pts);
  if (!pathData) return null;

  return (
    <path
      d={pathData}
      fill={fillColor}
      fillOpacity={opacity}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      className={`webnotes-area ${className ?? ""}`.trim()}
    />
  );
}
