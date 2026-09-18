import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";

export interface RectProps {
  x: [number, number];
  y: [number, number];
  tone?: Tone | string;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeTone?: Tone | string;
  weight?: Weight;
  dash?: Dash;
  className?: string;
}

export function Rect({
  x,
  y,
  tone = "accent",
  fill,
  fillOpacity,
  stroke,
  strokeTone,
  weight = "hairline",
  dash = "solid",
  className,
}: RectProps) {
  const frame = useFrame();
  const theme = useTheme();

  const themeTone = resolveTone(tone, theme);
  const fillColor = fill ?? themeTone;
  const opacity = fillOpacity ?? theme.opacity.fill;

  const strokeColor = stroke ?? (strokeTone ? resolveTone(strokeTone, theme) : "none");
  const strokeWidth = resolveWeight(weight, theme);
  const strokeDasharray = resolveDash(dash);

  const { sx, sy } = frame;

  const x0Px = sx(x[0]);
  const x1Px = sx(x[1]);
  const y0Px = sy(y[0]);
  const y1Px = sy(y[1]);

  const left = Math.min(x0Px, x1Px);
  const top = Math.min(y0Px, y1Px);
  const width = Math.abs(x1Px - x0Px);
  const height = Math.abs(y1Px - y0Px);

  return (
    <rect
      x={Number(left.toFixed(2))}
      y={Number(top.toFixed(2))}
      width={Number(width.toFixed(2))}
      height={Number(height.toFixed(2))}
      fill={fillColor}
      fillOpacity={opacity}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      className={`webnotes-rect ${className ?? ""}`.trim()}
    />
  );
}
