import React from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { resolveWeight, type Weight } from "./style-helpers.ts";
import { Label } from "../text/Label.tsx";
import { MathLabel } from "../text/MathLabel.tsx";

export interface AxesProps {
  origin?: [number, number] | "edges";
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

export function Axes({
  origin,
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
  tone = "border",
  weight = "hairline",
}: AxesProps) {
  const frame = useFrame();
  const theme = useTheme();

  const strokeColor = resolveTone(tone, theme);
  const strokeWidth = resolveWeight(weight, theme);
  const tLen = tickLength ?? theme.space.tickLength;

  const { xDomain, yDomain, sx, sy, toPx, area } = frame;

  // Determine origin
  let ox: number;
  let oy: number;

  if (origin === "edges") {
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

  // X axis line: from xDomain[0] to xDomain[1] at oy
  const [xStartPx] = toPx([xDomain[0], oy]);
  const [xEndPx] = toPx([xDomain[1], oy]);

  // Y axis line: from yDomain[0] to yDomain[1] at ox
  const [, yStartPx] = toPx([ox, yDomain[0]]);
  const [, yEndPx] = toPx([ox, yDomain[1]]);

  // Ticks
  const xTickVals = Array.isArray(ticksX) ? ticksX : sx.ticks(ticksX);
  const yTickVals = Array.isArray(ticksY) ? ticksY : sy.ticks(ticksY);

  const formatX = tickFormatX ?? sx.tickFormat(typeof ticksX === "number" ? ticksX : 5);
  const formatY = tickFormatY ?? sy.tickFormat(typeof ticksY === "number" ? ticksY : 5);

  return (
    <g className="webnotes-axes">
      {/* Horizontal X Axis */}
      <line
        x1={xStartPx}
        y1={pxOy}
        x2={xEndPx}
        y2={pxOy}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      {/* Vertical Y Axis */}
      <line
        x1={pxOx}
        y1={yStartPx}
        x2={pxOx}
        y2={yEndPx}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      {/* X Ticks and Labels */}
      {showTicks &&
        xTickVals.map((val) => {
          const [px] = toPx([val, oy]);
          return (
            <g key={`xtick-${val}`}>
              <line
                x1={px}
                y1={pxOy}
                x2={px}
                y2={pxOy + tLen}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              {showTickLabels && (
                <Label
                  text={formatX(val)}
                  at={[val, oy]}
                  offset={[0, tLen + 2]}
                  anchor="n"
                  size="tick"
                  tone="muted"
                />
              )}
            </g>
          );
        })}

      {/* Y Ticks and Labels */}
      {showTicks &&
        yTickVals.map((val) => {
          const [, py] = toPx([ox, val]);
          return (
            <g key={`ytick-${val}`}>
              <line
                x1={pxOx - tLen}
                y1={py}
                x2={pxOx}
                y2={py}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              {showTickLabels && (
                <Label
                  text={formatY(val)}
                  at={[ox, val]}
                  offset={[-(tLen + 3), 0]}
                  anchor="e"
                  size="tick"
                  tone="muted"
                />
              )}
            </g>
          );
        })}

      {/* Axis Labels */}
      {xLabel &&
        (xLabelKind === "tex" ? (
          <MathLabel
            tex={xLabel}
            at={[xDomain[1], oy]}
            offset={[10, 0]}
            anchor="w"
            size="label"
            tone="ink"
          />
        ) : (
          <Label
            text={xLabel}
            at={[xDomain[1], oy]}
            offset={[10, 0]}
            anchor="w"
            size="label"
            tone="ink"
          />
        ))}

      {yLabel &&
        (yLabelKind === "tex" ? (
          <MathLabel
            tex={yLabel}
            at={[ox, yDomain[1]]}
            offset={[0, -10]}
            anchor="s"
            size="label"
            tone="ink"
          />
        ) : (
          <Label
            text={yLabel}
            at={[ox, yDomain[1]]}
            offset={[0, -10]}
            anchor="s"
            size="label"
            tone="ink"
          />
        ))}
    </g>
  );
}
