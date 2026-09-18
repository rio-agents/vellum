import React from "react";
import { Arrow } from "./Arrow.tsx";
import { MathLabel } from "../text/MathLabel.tsx";
import { Label } from "../text/Label.tsx";
import type { Anchor } from "../text/anchor.ts";
import type { Tone } from "../theme/types.ts";
import type { Weight, Dash } from "./style-helpers.ts";

export interface VectorProps {
  from?: [number, number];
  to: [number, number];
  label?: string;
  labelKind?: "tex" | "text";
  labelAnchor?: Anchor;
  labelOffset?: [number, number];
  tone?: Tone | string;
  weight?: Weight;
  dash?: Dash;
  opacity?: number;
  className?: string;
}

export function Vector({
  from = [0, 0],
  to,
  label,
  labelKind = "tex",
  labelAnchor,
  labelOffset = [8, 0],
  tone = "accent",
  weight = "bold",
  dash = "solid",
  opacity,
  className,
}: VectorProps) {
  // Auto-anchor based on direction if not provided
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];

  let defaultAnchor: Anchor = "w";
  if (!labelAnchor) {
    if (Math.abs(dx) < 1e-4) {
      defaultAnchor = dy >= 0 ? "s" : "n";
    } else if (dx > 0) {
      defaultAnchor = "w";
    } else {
      defaultAnchor = "e";
    }
  }

  const anchor = labelAnchor ?? defaultAnchor;

  return (
    <g className={`webnotes-vector ${className ?? ""}`.trim()}>
      <Arrow
        from={from}
        to={to}
        tone={tone}
        weight={weight}
        dash={dash}
        opacity={opacity}
      />
      {label &&
        (labelKind === "tex" ? (
          <MathLabel
            tex={label}
            at={to}
            anchor={anchor}
            offset={labelOffset}
            tone={tone}
          />
        ) : (
          <Label
            text={label}
            at={to}
            anchor={anchor}
            offset={labelOffset}
            tone={tone}
          />
        ))}
    </g>
  );
}
