import React from "react";
import { Rect } from "./Rect.tsx";
import { useFrame } from "../scene/frame-context.ts";
import type { Tone } from "../theme/types.ts";

export interface RegionProps {
  x?: [number, number];
  y?: [number, number];
  tone?: Tone | string;
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
      x={targetX}
      y={targetY}
      tone={tone}
      fillOpacity={fillOpacity}
      className={`webnotes-region ${className ?? ""}`.trim()}
    />
  );
}
