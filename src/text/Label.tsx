import React, { type CSSProperties } from "react";
import type { Anchor } from "./anchor.ts";
import { useFrameSafe } from "../scene/frame-context.ts";
import { placementToPx, type Placement } from "../scene/position.ts";
import { useTheme, resolveTone, resolveFontSize, type Tone, type TextRole, type FontRole } from "../theme/index.ts";

export type LabelProps = Placement & {
  text: string;
  anchor?: Anchor;
  /** Pixel nudge applied after placement. */
  offset?: [number, number];
  tone?: Tone;
  size?: TextRole;
  /** Which theme font to use: the interface sans, the serif, or the face that matches TeX. */
  font?: FontRole;
  fontFamily?: string;
  fontWeight?: number | string;
  letterSpacing?: number | string;
  allowOverlap?: boolean;
  /** Outline the text in the figure surface color so it stays legible over marks. */
  halo?: boolean;
  style?: CSSProperties;
  className?: string;
};

function anchorToSvgAlignment(anchor: Anchor): {
  textAnchor: "start" | "middle" | "end";
  dominantBaseline: "hanging" | "central" | "auto";
} {
  let textAnchor: "start" | "middle" | "end" = "middle";
  let dominantBaseline: "hanging" | "central" | "auto" = "central";

  switch (anchor) {
    case "w":
    case "nw":
    case "sw":
    case "start":
      textAnchor = "start";
      break;
    case "e":
    case "ne":
    case "se":
    case "end":
      textAnchor = "end";
      break;
    case "center":
    case "middle":
    case "n":
    case "s":
      textAnchor = "middle";
      break;
  }

  switch (anchor) {
    case "n":
    case "nw":
    case "ne":
      dominantBaseline = "hanging";
      break;
    case "s":
    case "sw":
    case "se":
      dominantBaseline = "auto";
      break;
    case "center":
    case "w":
    case "e":
      dominantBaseline = "central";
      break;
  }

  return { textAnchor, dominantBaseline };
}

/** Outline width, in pixels, on each side of a haloed label's glyphs. */
export const HALO_PX = 3;

export function Label({
  text,
  at,
  x,
  y,
  anchor = "center",
  offset = [0, 0],
  tone = "ink",
  size,
  font = "sans",
  fontFamily,
  fontWeight,
  letterSpacing,
  allowOverlap = false,
  halo = false,
  style,
  className,
}: LabelProps) {
  const theme = useTheme();
  const frame = useFrameSafe();

  const finalSize = resolveFontSize(size, "label", theme);
  const toneColor = resolveTone(tone, theme);
  const face = fontFamily ?? theme.font[font];

  const [px, py] = placementToPx("Label", { at, x, y }, frame);
  const targetX = px + offset[0];
  const targetY = py + offset[1];

  const finalX = Number(targetX.toFixed(2));
  const finalY = Number(targetY.toFixed(2));

  const { textAnchor, dominantBaseline } = anchorToSvgAlignment(anchor);

  return (
    <text
      className={`vellum-text-label ${className ?? ""}`.trim()}
      data-label-text={text}
      data-allow-overlap={allowOverlap ? "true" : undefined}
      x={finalX}
      y={finalY}
      textAnchor={textAnchor}
      dominantBaseline={dominantBaseline}
      fill={toneColor}
      fontSize={finalSize}
      fontFamily={face}
      fontWeight={fontWeight}
      letterSpacing={letterSpacing}
      stroke={halo ? theme.color.surface : undefined}
      strokeWidth={halo ? 2 * HALO_PX : undefined}
      strokeLinejoin={halo ? "round" : undefined}
      paintOrder={halo ? "stroke" : undefined}
      style={font === "math" ? { fontVariantNumeric: "tabular-nums", ...style } : style}
    >
      {text}
    </text>
  );
}
