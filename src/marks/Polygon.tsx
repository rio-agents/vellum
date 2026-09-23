import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";

export interface PolygonProps {
  points: readonly [number, number][];
  tone?: Tone;
  fillOpacity?: number;
  strokeTone?: Tone;
  weight?: Weight;
  dash?: Dash;
  className?: string;
}

export function Polygon({
  points,
  tone = "accent",
  fillOpacity,
  strokeTone,
  weight = "regular",
  dash = "solid",
  className,
}: PolygonProps) {
  const frame = useFrame();
  const theme = useTheme();

  const themeTone = resolveTone(tone, theme);
  const fillColor = themeTone;
  const opacity = fillOpacity ?? theme.opacity.fill;

  const strokeColor = strokeTone ? resolveTone(strokeTone, theme) : themeTone;
  const strokeWidth = resolveWeight(weight, theme);
  const strokeDasharray = resolveDash(dash);

  const pointsString = points
    .map((p) => {
      const [px, py] = frame.toPx(p as [number, number]);
      return `${px.toFixed(2)},${py.toFixed(2)}`;
    })
    .join(" ");

  return (
    <polygon
      points={pointsString}
      fill={fillColor}
      fillOpacity={opacity}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      className={`vellum-polygon ${className ?? ""}`.trim()}
    />
  );
}
