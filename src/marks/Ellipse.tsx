import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";
import { ellipsePoints, type Mat2, type Vec2 } from "../math/index.ts";

export interface EllipseProps {
  covariance?: Mat2;
  center?: [number, number];
  radius?: number;
  semiAxes?: [number, number];
  angle?: number;
  samples?: number;
  tone?: Tone;
  fillOpacity?: number;
  strokeTone?: Tone;
  weight?: Weight;
  dash?: Dash;
  className?: string;
}

export function Ellipse({
  covariance,
  center = [0, 0],
  radius = 1,
  semiAxes,
  angle = 0,
  samples = 180,
  tone = "accent",
  fillOpacity,
  strokeTone,
  weight = "regular",
  dash = "solid",
  className,
}: EllipseProps) {
  const frame = useFrame();
  const theme = useTheme();

  const themeTone = resolveTone(tone, theme);
  const strokeColor = strokeTone ? resolveTone(strokeTone, theme) : themeTone;
  const strokeWidth = resolveWeight(weight, theme);
  const strokeDasharray = resolveDash(dash);

  const fillColor = fillOpacity !== undefined && fillOpacity > 0 ? themeTone : "none";
  const opacity = fillOpacity;

  let pts: Vec2[];

  if (covariance) {
    pts = ellipsePoints(center, covariance, radius, samples);
  } else if (semiAxes) {
    // Generate from semiAxes [a, b] and tilt angle
    const [a, b] = semiAxes;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    pts = [];
    for (let k = 0; k <= samples; k++) {
      const t = (2 * Math.PI * k) / samples;
      const ex = a * radius * Math.cos(t);
      const ey = b * radius * Math.sin(t);
      const rx = center[0] + ex * cosA - ey * sinA;
      const ry = center[1] + ex * sinA + ey * cosA;
      pts.push([rx, ry]);
    }
  } else {
    return null;
  }

  const svgPoints = pts.map((p) => {
    const [px, py] = frame.toPx(p);
    return `${px.toFixed(2)},${py.toFixed(2)}`;
  });

  const pathData = `M ${svgPoints.join(" L ")} Z`;

  return (
    <path
      d={pathData}
      fill={fillColor}
      fillOpacity={opacity}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      className={`vellum-ellipse ${className ?? ""}`.trim()}
    />
  );
}
