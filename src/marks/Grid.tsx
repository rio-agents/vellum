import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";

export interface GridProps {
  ticksX?: number | number[];
  ticksY?: number | number[];
  tone?: Tone;
  weight?: Weight;
  dash?: Dash;
  opacity?: number;
}

export function Grid({
  ticksX = 5,
  ticksY = 5,
  tone = "border",
  weight = "hairline",
  dash = "dotted",
  opacity = 0.7,
}: GridProps) {
  const frame = useFrame();
  const theme = useTheme();

  const strokeColor = resolveTone(tone, theme);
  const strokeWidth = resolveWeight(weight, theme);
  const strokeDasharray = resolveDash(dash);

  const { xDomain, yDomain, sx, sy, toPx } = frame;

  const xTickVals = Array.isArray(ticksX) ? ticksX : sx.ticks(ticksX);
  const yTickVals = Array.isArray(ticksY) ? ticksY : sy.ticks(ticksY);

  const [, yMinPx] = toPx([xDomain[0], yDomain[0]]);
  const [, yMaxPx] = toPx([xDomain[0], yDomain[1]]);
  const [xMinPx] = toPx([xDomain[0], yDomain[0]]);
  const [xMaxPx] = toPx([xDomain[1], yDomain[0]]);

  return (
    <g className="vellum-grid" opacity={opacity}>
      {xTickVals.map((xVal) => {
        const [px] = toPx([xVal, yDomain[0]]);
        return (
          <line
            key={`xgrid-${xVal}`}
            x1={px}
            y1={yMinPx}
            x2={px}
            y2={yMaxPx}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      })}
      {yTickVals.map((yVal) => {
        const [, py] = toPx([xDomain[0], yVal]);
        return (
          <line
            key={`ygrid-${yVal}`}
            x1={xMinPx}
            y1={py}
            x2={xMaxPx}
            y2={py}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
          />
        );
      })}
    </g>
  );
}
