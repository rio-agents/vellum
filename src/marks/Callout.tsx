import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, type Weight } from "./style-helpers.ts";
import { Label } from "../text/Label.tsx";
import { MathLabel } from "../text/MathLabel.tsx";
import type { Anchor } from "../text/anchor.ts";

export interface CalloutProps {
  at: [number, number];
  to: [number, number];
  label: string;
  labelKind?: "tex" | "text";
  anchor?: Anchor;
  tone?: Tone;
  weight?: Weight;
  className?: string;
}

export function Callout({
  at,
  to,
  label,
  labelKind = "text",
  anchor = "w",
  tone = "muted",
  weight = "hairline",
  className,
}: CalloutProps) {
  const frame = useFrame();
  const theme = useTheme();

  const strokeColor = resolveTone(tone, theme);
  const strokeWidth = resolveWeight(weight, theme);

  const [x1, y1] = frame.toPx(at);
  const [x2, y2] = frame.toPx(to);

  return (
    <g className={`webnotes-callout ${className ?? ""}`.trim()}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {labelKind === "tex" ? (
        <MathLabel
          tex={label}
          at={to}
          anchor={anchor}
          tone="ink"
        />
      ) : (
        <Label
          text={label}
          at={to}
          anchor={anchor}
          tone="ink"
        />
      )}
    </g>
  );
}
