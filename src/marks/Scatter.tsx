import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, type Weight } from "./style-helpers.ts";

export interface ScatterProps {
  points: readonly [number, number][];
  radius?: number;
  tone?: Tone;
  fillOpacity?: number;
  strokeTone?: Tone;
  strokeWeight?: Weight;
  pointTone?: (point: [number, number], index: number) => Tone;
  filterInside?: boolean;
  className?: string;
}

export function Scatter({
  points,
  radius = 2.5,
  tone = "muted",
  fillOpacity,
  strokeTone,
  strokeWeight,
  pointTone,
  filterInside = false,
  className,
}: ScatterProps) {
  const frame = useFrame();
  const theme = useTheme();

  const defaultFillColor = resolveTone(tone, theme);
  const opacity = fillOpacity ?? theme.opacity.cloud;

  const strokeColor = strokeTone ? resolveTone(strokeTone, theme) : "none";
  const strokeWidth = strokeWeight ? resolveWeight(strokeWeight, theme) : 0;

  const { toPx, xDomain, yDomain } = frame;

  const xMin = Math.min(xDomain[0], xDomain[1]);
  const xMax = Math.max(xDomain[0], xDomain[1]);
  const yMin = Math.min(yDomain[0], yDomain[1]);
  const yMax = Math.max(yDomain[0], yDomain[1]);

  const activePoints = filterInside
    ? points.filter(([x, y]) => x >= xMin && x <= xMax && y >= yMin && y <= yMax)
    : points;

  return (
    <g className={`vellum-scatter ${className ?? ""}`.trim()}>
      {activePoints.map(([x, y], idx) => {
        const [px, py] = toPx([x, y]);
        const fill = pointTone ? resolveTone(pointTone([x, y], idx), theme) : defaultFillColor;

        return (
          <circle
            key={idx}
            cx={px}
            cy={py}
            r={radius}
            fill={fill}
            fillOpacity={opacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      })}
    </g>
  );
}
