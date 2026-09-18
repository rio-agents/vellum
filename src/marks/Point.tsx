import React from "react";
import { useFrameSafe } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, type Weight } from "./style-helpers.ts";
import { Label } from "../text/Label.tsx";
import { MathLabel } from "../text/MathLabel.tsx";
import type { Anchor } from "../text/anchor.ts";

export interface PointProps {
  at: [number, number];
  radius?: number;
  tone?: Tone | string;
  fill?: string;
  stroke?: string;
  strokeTone?: Tone | string;
  strokeWeight?: Weight;
  label?: string;
  labelKind?: "tex" | "text";
  labelAnchor?: Anchor;
  labelOffset?: [number, number];
  className?: string;
}

export function Point({
  at,
  radius = 5,
  tone = "accent",
  fill,
  stroke,
  strokeTone = "surface",
  strokeWeight = "regular",
  label,
  labelKind = "tex",
  labelAnchor = "w",
  labelOffset = [10, 0],
  className,
}: PointProps) {
  const frame = useFrameSafe();
  const theme = useTheme();

  const [px, py] = frame ? frame.toPx(at) : at;

  const fillColor = fill ?? resolveTone(tone, theme);
  const strokeColor = stroke ?? resolveTone(strokeTone, theme);
  const strokeWidth = resolveWeight(strokeWeight, theme);

  return (
    <g className={`webnotes-point ${className ?? ""}`.trim()}>
      <circle
        cx={px}
        cy={py}
        r={radius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {label &&
        (labelKind === "tex" ? (
          <MathLabel
            tex={label}
            at={at}
            anchor={labelAnchor}
            offset={labelOffset}
            tone={tone}
          />
        ) : (
          <Label
            text={label}
            at={at}
            anchor={labelAnchor}
            offset={labelOffset}
            tone={tone}
          />
        ))}
    </g>
  );
}
