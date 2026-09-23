import React from "react";
import { useFrameSafe } from "../scene/frame-context.ts";
import { placementToPx, type Placement } from "../scene/position.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, type Weight } from "./style-helpers.ts";
import { Label } from "../text/Label.tsx";
import { MathLabel } from "../text/MathLabel.tsx";
import type { Anchor } from "../text/anchor.ts";

export type PointProps = Placement & {
  radius?: number;
  tone?: Tone;
  strokeTone?: Tone;
  strokeWeight?: Weight;
  label?: string;
  labelKind?: "tex" | "text";
  labelAnchor?: Anchor;
  labelOffset?: [number, number];
  className?: string;
};

export function Point({
  at,
  x,
  y,
  radius = 5,
  tone = "accent",
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

  const [px, py] = placementToPx("Point", { at, x, y }, frame);

  const fillColor = resolveTone(tone, theme);
  const strokeColor = resolveTone(strokeTone, theme);
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
            x={px}
            y={py}
            anchor={labelAnchor}
            offset={labelOffset}
            tone={tone}
          />
        ) : (
          <Label
            text={label}
            x={px}
            y={py}
            anchor={labelAnchor}
            offset={labelOffset}
            tone={tone}
          />
        ))}
    </g>
  );
}
