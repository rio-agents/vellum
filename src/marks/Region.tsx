import React from "react";
import { Rect } from "./Rect.tsx";
import { useFrame } from "../scene/frame-context.ts";
import type { Tone } from "../theme/types.ts";

export interface RegionProps {
  /** Data span along x; defaults to the whole panel. */
  x?: [number, number];
  /** Data span along y; defaults to the whole panel. */
  y?: [number, number];
  tone?: Tone;
  fillOpacity?: number;
  className?: string;
}

export function Region({
  x,
  y,
  tone = "accent",
  fillOpacity,
  className,
}: RegionProps) {
  const frame = useFrame();
  const targetX = x ?? frame.xDomain;
  const targetY = y ?? frame.yDomain;

  return (
    <Rect
      from={[targetX[0], targetY[0]]}
      to={[targetX[1], targetY[1]]}
      tone={tone}
      fillOpacity={fillOpacity}
      className={`webnotes-region ${className ?? ""}`.trim()}
    />
  );
}
