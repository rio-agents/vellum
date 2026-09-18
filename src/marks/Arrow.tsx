import React from "react";
import { useFrameSafe } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";
import { getArrowMarkerUrl } from "./markers.tsx";

export interface ArrowProps {
  from: [number, number];
  to: [number, number];
  tone?: Tone | string;
  weight?: Weight;
  dash?: Dash;
  opacity?: number;
  markerStart?: boolean;
  markerEnd?: boolean;
  className?: string;
}

export function Arrow({
  from,
  to,
  tone = "ink",
  weight = "regular",
  dash = "solid",
  opacity,
  markerStart = false,
  markerEnd = true,
  className,
}: ArrowProps) {
  const frame = useFrameSafe();
  const theme = useTheme();

  const strokeColor = resolveTone(tone, theme);
  const strokeWidth = resolveWeight(weight, theme);
  const strokeDasharray = resolveDash(dash);

  const [x1, y1] = frame ? frame.toPx(from) : from;
  const [x2, y2] = frame ? frame.toPx(to) : to;

  const markerUrl = getArrowMarkerUrl(tone);

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      markerStart={markerStart ? markerUrl : undefined}
      markerEnd={markerEnd ? markerUrl : undefined}
      opacity={opacity}
      className={`webnotes-arrow ${className ?? ""}`.trim()}
    />
  );
}
