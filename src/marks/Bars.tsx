import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, type Weight } from "./style-helpers.ts";

export interface BarDatum {
  x: number;
  y: number;
  width?: number;
  tone?: Tone;
}

export interface BarsProps {
  data?: BarDatum[];
  points?: [number, number][];
  baseline?: number;
  barWidth?: number;
  tone?: Tone;
  fillOpacity?: number;
  strokeTone?: Tone;
  strokeWeight?: Weight;
  className?: string;
}

export function Bars({
  data,
  points,
  baseline = 0,
  barWidth,
  tone = "accent",
  fillOpacity,
  strokeTone,
  strokeWeight = "hairline",
  className,
}: BarsProps) {
  const frame = useFrame();
  const theme = useTheme();

  const defaultFill = resolveTone(tone, theme);
  const opacity = fillOpacity ?? theme.opacity.fill;

  const defaultStroke = strokeTone ? resolveTone(strokeTone, theme) : "none";
  const strokeW = resolveWeight(strokeWeight, theme);

  const { toPx, sx, sy } = frame;

  const items: BarDatum[] =
    data ??
    (points ? points.map(([x, y]) => ({ x, y })) : []);

  if (items.length === 0) return null;

  // Compute default width if not specified: 80% of min spacing
  let defWidth = barWidth;
  if (!defWidth) {
    if (items.length > 1) {
      let minDiff = Infinity;
      for (let i = 1; i < items.length; i++) {
        const diff = Math.abs(items[i].x - items[i - 1].x);
        if (diff > 0 && diff < minDiff) minDiff = diff;
      }
      defWidth = Number.isFinite(minDiff) ? minDiff * 0.8 : 0.8;
    } else {
      defWidth = 0.8;
    }
  }

  const basePy = sy(baseline);

  return (
    <g className={`webnotes-bars ${className ?? ""}`.trim()}>
      {items.map((item, idx) => {
        const w = item.width ?? defWidth!;
        const halfW = w / 2;

        const leftPx = sx(item.x - halfW);
        const rightPx = sx(item.x + halfW);
        const topPx = sy(item.y);

        const rectX = Math.min(leftPx, rightPx);
        const rectW = Math.abs(rightPx - leftPx);
        const rectY = Math.min(topPx, basePy);
        const rectH = Math.abs(topPx - basePy);

        const fill = item.tone ? resolveTone(item.tone, theme) : defaultFill;

        return (
          <rect
            key={idx}
            x={Number(rectX.toFixed(2))}
            y={Number(rectY.toFixed(2))}
            width={Number(rectW.toFixed(2))}
            height={Number(rectH.toFixed(2))}
            fill={fill}
            fillOpacity={opacity}
            stroke={defaultStroke}
            strokeWidth={strokeW}
          />
        );
      })}
    </g>
  );
}
