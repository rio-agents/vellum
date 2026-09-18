import React, { type ReactNode } from "react";
import { scaleLinear } from "../math/scale.ts";
import { FrameContext, type FrameContextValue } from "./frame-context.ts";
import { useFigureContext } from "./Figure.tsx";

export interface RectArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PanelPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface PanelProps {
  area: RectArea;
  x: [number, number];
  y: [number, number];
  aspect?: "equal" | "auto";
  clip?: boolean;
  padding?: number | PanelPadding;
  panelIndex?: number;
  children: ReactNode;
}

export function Panel({
  area,
  x: xDomain,
  y: yDomain,
  aspect = "auto",
  clip = false,
  padding = 0,
  panelIndex = 0,
  children,
}: PanelProps) {
  const figure = useFigureContext();

  const padTop = typeof padding === "number" ? padding : (padding.top ?? 0);
  const padRight = typeof padding === "number" ? padding : (padding.right ?? 0);
  const padBottom = typeof padding === "number" ? padding : (padding.bottom ?? 0);
  const padLeft = typeof padding === "number" ? padding : (padding.left ?? 0);

  const availW = Math.max(1, area.width - padLeft - padRight);
  const availH = Math.max(1, area.height - padTop - padBottom);

  const deltaX = Math.abs(xDomain[1] - xDomain[0]);
  const deltaY = Math.abs(yDomain[1] - yDomain[0]);

  let xRange: [number, number];
  let yRange: [number, number];
  let effX: number;
  let effY: number;
  let effW: number;
  let effH: number;

  if (aspect === "equal") {
    const scaleX = availW / (deltaX || 1);
    const scaleY = availH / (deltaY || 1);
    const s = Math.min(scaleX, scaleY);

    effW = s * deltaX;
    effH = s * deltaY;

    effX = area.x + padLeft + (availW - effW) / 2;
    effY = area.y + padTop + (availH - effH) / 2;

    xRange = [effX, effX + effW];
    // SVG y-axis is inverted: Cartesian y_min at bottom, y_max at top
    yRange = [effY + effH, effY];
  } else {
    effX = area.x + padLeft;
    effY = area.y + padTop;
    effW = availW;
    effH = availH;

    xRange = [effX, effX + effW];
    yRange = [effY + effH, effY];
  }

  const sx = scaleLinear({ domain: xDomain, range: xRange });
  const sy = scaleLinear({ domain: yDomain, range: yRange });

  const toPx = ([dx, dy]: [number, number]): [number, number] => [
    Number(sx(dx).toFixed(2)),
    Number(sy(dy).toFixed(2)),
  ];

  const fromPx = ([px, py]: [number, number]): [number, number] => [
    sx.invert(px),
    sy.invert(py),
  ];

  const pxPerUnit = {
    x: effW / (deltaX || 1),
    y: effH / (deltaY || 1),
  };

  const clipId = `${figure.id}-panel-${panelIndex}-clip`;

  const frameValue: FrameContextValue = {
    area: {
      x: Number(effX.toFixed(2)),
      y: Number(effY.toFixed(2)),
      width: Number(effW.toFixed(2)),
      height: Number(effH.toFixed(2)),
    },
    xDomain,
    yDomain,
    toPx,
    fromPx,
    sx,
    sy,
    pxPerUnit,
    clipId: clip ? clipId : undefined,
    panelIndex,
  };

  return (
    <FrameContext.Provider value={frameValue}>
      {clip && (
        <defs>
          <clipPath id={clipId}>
            <rect
              x={Number(effX.toFixed(2))}
              y={Number(effY.toFixed(2))}
              width={Number(effW.toFixed(2))}
              height={Number(effH.toFixed(2))}
            />
          </clipPath>
        </defs>
      )}
      <g className={`webnotes-panel webnotes-panel-${panelIndex}`} clipPath={clip ? `url(#${clipId})` : undefined}>
        {children}
      </g>
    </FrameContext.Provider>
  );
}
