import React from "react";
import { Rect } from "./Rect.tsx";
import { Label } from "../text/Label.tsx";
import { MathLabel } from "../text/MathLabel.tsx";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { useFigureScope } from "../scene/Figure.tsx";
import { arrowMarkerId } from "./markers.tsx";
import { resolveWeight, resolveDash, type Weight, type Dash } from "./style-helpers.ts";
import type { RectArea } from "../scene/layout.ts";
/** A point in figure pixels, including inside a Panel. */
export interface PixelPoint {
  x: number;
  y: number;
}
export type BoxSide = "top" | "right" | "bottom" | "left";
/** An explicit anchor along a box side, from 0 (start) to 1 (end). */
export function boxAnchor(box: RectArea, side: BoxSide, fraction = 0.5): PixelPoint {
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1)
    throw new Error("boxAnchor: fraction must be between 0 and 1.");
  switch (side) {
    case "top": return { x: box.x + box.width * fraction, y: box.y };
    case "bottom": return { x: box.x + box.width * fraction, y: box.y + box.height };
    case "left": return { x: box.x, y: box.y + box.height * fraction };
    case "right": return { x: box.x + box.width, y: box.y + box.height * fraction };
  }
}
/** A labeled box. A second line of TeX can name the operation or state. */
export function DiagramBox({ x, y, width, height, label, tex, tone = "ink" }: RectArea & {
  label?: string;
  tex?: string;
  tone?: Tone;
}) {
  return <g className="vellum-diagram-box">
  <Rect x={x} y={y} width={width} height={height} tone={tone} strokeTone={tone} weight="regular"/>
  {label && <Label text={label} x={x + width / 2} y={y + height / 2 - (tex ? 12 : 0)} size="label"/>}
  {tex && <MathLabel tex={tex} x={x + width / 2} y={y + height / 2 + (label ? 13 : 0)} tone={tone}/>}
 </g>;
}
/** A connector in figure pixels. Waypoints make elbows; two controls make a cubic. */
export function Connector({ from, to, via = [], controls, tone = "ink", weight = "regular", dash = "solid", arrow = true }: {
  from: PixelPoint;
  to: PixelPoint;
  via?: PixelPoint[];
  controls?: [
    PixelPoint,
    PixelPoint
  ];
  tone?: Tone;
  weight?: Weight;
  dash?: Dash;
  arrow?: boolean;
}) {
  if (controls && via.length)
    throw new Error("Connector: choose waypoints or curve controls, not both.");
  const theme = useTheme();
  const { id } = useFigureScope();
  const d = controls
    ? `M ${from.x} ${from.y} C ${controls[0].x} ${controls[0].y}, ${controls[1].x} ${controls[1].y}, ${to.x} ${to.y}`
    : `M ${from.x} ${from.y} ${[...via, to].map(p => `L ${p.x} ${p.y}`).join(" ")}`;
  return <path className="vellum-connector" d={d} fill="none" stroke={resolveTone(tone, theme)} strokeWidth={resolveWeight(weight, theme)} strokeDasharray={resolveDash(dash)} markerEnd={arrow ? `url(#${arrowMarkerId(id, tone)})` : undefined}/>;
}
/** An explicit boundary around a group of marks, with its name above the boundary. */
export function DiagramGroup({ label, tone = "muted", children, ...box }: RectArea & {
  label: string;
  tone?: Tone;
  children?: React.ReactNode;
}) {
  return <g className="vellum-diagram-group">
  <Rect {...box} fillOpacity={0} strokeTone={tone} dash="dashed"/>
  <Label text={label} x={box.x} y={box.y - 12} anchor="w" size="caption" tone={tone}/>
  {children}
 </g>;
}
/** Place known box sizes in a row or column; placement remains explicit. */
export function diagramRow(sizes: {
  width: number;
  height: number;
}[], x: number, y: number, gap: number): RectArea[] {
  return sizes.map(size => {
    const box = {
      x,
      y,
      ...size
    };
    x += size.width + gap;
    return box;
  });
}
export function diagramColumn(sizes: {
  width: number;
  height: number;
}[], x: number, y: number, gap: number): RectArea[] {
  return sizes.map(size => {
    const box = {
      x,
      y,
      ...size
    };
    y += size.height + gap;
    return box;
  });
}
