import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, type Weight } from "./style-helpers.ts";
import { Label } from "../text/Label.tsx";
import { MathLabel } from "../text/MathLabel.tsx";
import type { Anchor } from "../text/anchor.ts";

export interface AxesProps {
  /**
   * Where the axes cross, in data coordinates, or `"edges"` for the lower-left
   * corner of the panel. Ignored when `frame` is set.
   */
  origin?: [number, number] | "edges";
  /**
   * Draw a closed box around the panel with ticks pointing inward on the bottom
   * and left edges, instead of two crossing axis lines.
   */
  frame?: boolean;
  ticksX?: number | number[];
  ticksY?: number | number[];
  tickLength?: number;
  showTicks?: boolean;
  showTickLabels?: boolean;
  tickFormatX?: (d: number) => string;
  tickFormatY?: (d: number) => string;
  xLabel?: string;
  yLabel?: string;
  xLabelKind?: "tex" | "text";
  yLabelKind?: "tex" | "text";
  tone?: Tone;
  weight?: Weight;
}

/** Writes a negative number with a true minus sign, as typeset mathematics does. */
export function withMinusSign(text: string): string {
  return text.replace(/^-(?=[\d.])/, "−");
}

// Axis lines, ticks, and the frame are horizontal or vertical, so they are drawn
// with crisp edges: on a 1x screen they land on whole pixels instead of blurring
// across two. Only the rules get this; it would make text and math jagged.
export function Axes({
  origin,
  frame: framed = false,
  ticksX = 5,
  ticksY = 5,
  tickLength,
  showTicks = true,
  showTickLabels = false,
  tickFormatX,
  tickFormatY,
  xLabel,
  yLabel,
  xLabelKind = "tex",
  yLabelKind = "tex",
  tone = "faint",
  weight = "hairline",
}: AxesProps) {
  const frame = useFrame();
  const theme = useTheme();

  const strokeColor = resolveTone(tone, theme);
  const strokeWidth = resolveWeight(weight, theme);
  const tLen = tickLength ?? theme.space.tickLength;

  const { xDomain, yDomain, sx, sy, toPx, area } = frame;

  let ox: number;
  let oy: number;
  if (framed || origin === "edges") {
    ox = xDomain[0];
    oy = yDomain[0];
  } else if (origin) {
    ox = origin[0];
    oy = origin[1];
  } else {
    // Default: use 0 if within domain, else clamp to edge
    ox = 0 >= xDomain[0] && 0 <= xDomain[1] ? 0 : xDomain[0];
    oy = 0 >= yDomain[0] && 0 <= yDomain[1] ? 0 : yDomain[0];
  }

  const [pxOx, pxOy] = toPx([ox, oy]);
  const [xStartPx] = toPx([xDomain[0], oy]);
  const [xEndPx] = toPx([xDomain[1], oy]);
  const [, yStartPx] = toPx([ox, yDomain[0]]);
  const [, yEndPx] = toPx([ox, yDomain[1]]);

  const xTickVals = Array.isArray(ticksX) ? ticksX : sx.ticks(ticksX);
  const yTickVals = Array.isArray(ticksY) ? ticksY : sy.ticks(ticksY);

  const formatX = tickFormatX ?? sx.tickFormat(typeof ticksX === "number" ? ticksX : 5);
  const formatY = tickFormatY ?? sy.tickFormat(typeof ticksY === "number" ? ticksY : 5);

  // A framed panel's ticks point inward, so its tick labels sit right at the edge.
  const xTick = framed ? -tLen : tLen;
  const yTick = framed ? tLen : -tLen;
  const xLabelGap = (framed ? 0 : tLen) + 3;
  const yLabelGap = (framed ? 0 : tLen) + 5;

  const cornerY = (val: number) => framed && val === yDomain[0] && xTickVals.includes(xDomain[0]);

  const axisTitle = (text: string, kind: "tex" | "text", at: [number, number], anchor: Anchor, offset: [number, number]) =>
    kind === "tex" ? (
      <MathLabel tex={text} at={at} offset={offset} anchor={anchor} size="label" tone="ink" />
    ) : (
      <Label text={text} at={at} offset={offset} anchor={anchor} size="label" tone="ink" />
    );

  return (
    <g className="vellum-axes">
      {framed ? (
        <rect
          x={area.x}
          y={area.y}
          width={area.width}
          height={area.height}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          shapeRendering="crispEdges"
        />
      ) : (
        <>
          <line x1={xStartPx} y1={pxOy} x2={xEndPx} y2={pxOy} stroke={strokeColor} strokeWidth={strokeWidth} shapeRendering="crispEdges" />
          <line x1={pxOx} y1={yStartPx} x2={pxOx} y2={yEndPx} stroke={strokeColor} strokeWidth={strokeWidth} shapeRendering="crispEdges" />
        </>
      )}

      {showTicks &&
        xTickVals.map((val) => {
          const [px] = toPx([val, oy]);
          return (
            <g key={`xtick-${val}`}>
              <line x1={px} y1={pxOy} x2={px} y2={pxOy + xTick} stroke={strokeColor} strokeWidth={strokeWidth} shapeRendering="crispEdges" />
              {showTickLabels && (
                <Label
                  text={withMinusSign(formatX(val))}
                  at={[val, oy]}
                  offset={[0, xLabelGap]}
                  anchor="n"
                  size="tick"
                  tone="muted"
                  font="math"
                />
              )}
            </g>
          );
        })}

      {showTicks &&
        yTickVals.map((val) => {
          const [, py] = toPx([ox, val]);
          return (
            <g key={`ytick-${val}`}>
              <line x1={pxOx + yTick} y1={py} x2={pxOx} y2={py} stroke={strokeColor} strokeWidth={strokeWidth} shapeRendering="crispEdges" />
              {showTickLabels && (
                <Label
                  text={withMinusSign(formatY(val))}
                  at={[ox, val]}
                  // In a frame, the bottom label sits just above the edge so it clears the x label below the corner.
                  offset={[-yLabelGap, cornerY(val) ? -3 : 0]}
                  anchor={cornerY(val) ? "se" : "e"}
                  size="tick"
                  tone="muted"
                  font="math"
                />
              )}
            </g>
          );
        })}

      {xLabel && axisTitle(xLabel, xLabelKind, [xDomain[1], oy], "w", [10, 0])}
      {yLabel && axisTitle(yLabel, yLabelKind, [ox, yDomain[1]], "s", [0, -10])}
    </g>
  );
}
