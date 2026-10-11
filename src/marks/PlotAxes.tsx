import React from "react";
import { Arrow } from "./Arrow.tsx";
import { Line } from "./Line.tsx";
import { Label } from "../text/Label.tsx";
import { MathLabel } from "../text/MathLabel.tsx";
import { useFrame } from "../scene/frame-context.ts";
import type { Tone } from "../theme/index.ts";
/** A number with a true minus sign, and no "−0.000". */
export function fmt(value: number, digits = 3): string {
  if (!Number.isFinite(value))
    return "—";
  const v = Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value;
  return v.toFixed(digits).replace("-", "−");
}
/** Evenly spaced round tick values covering [lo, hi], about `count` of them. */
export function niceTicks(lo: number, hi: number, count: number): number[] {
  if (![lo, hi, count].every(Number.isFinite) || hi < lo)
    throw new Error("niceTicks: finite bounds in increasing order and a finite count are required.");
  if (hi === lo)
    return [lo];
  const raw = (hi - lo) / Math.max(1, count);
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  const step = (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  const ticks: number[] = [];
  for (let k = Math.ceil(lo / step - 1e-9); k * step <= hi + 1e-9; k++)
    ticks.push(Number((k * step).toFixed(10)));
  return ticks;
}
export const tickText = (ticks: number[]) => {
  const step = ticks.length > 1 ? ticks[1] - ticks[0] : 1;
  const precision = (v: number) => {
    for (let n = 0; n < 8; n++)
      if (Math.abs(v - Number(v.toFixed(n))) < 1e-9)
        return n;
    return 8;
  };
  const digits = Math.max(precision(step), ...ticks.map(precision));
  return (v: number) => fmt(v, digits);
};
/** A symbol marked on an axis at a value the text talks about, such as a, b, x, or f(x). */
export interface AxisMark {
  at: number;
  tex: string;
  tone?: Tone;
}
/**
 * Axes drawn with arrow tips and symbolic ticks: two arrows crossing at the
 * origin (or along the lower and left edges when the origin is out of view),
 * named with the note's variables, with a few numbered ticks and the symbols
 * the text uses marked at their values. A numbered tick too close to a marked
 * symbol is left unlabeled so the symbol reads first. Draw it in an unclipped
 * panel over the plot.
 */
export function PlotAxes({ xName, yName, xAxis = true, yAxis = true, xTicks = [], yTicks = [], xMarks = [], yMarks = [], }: {
  xName: string;
  yName: string;
  xAxis?: boolean;
  yAxis?: boolean;
  xTicks?: number[];
  yTicks?: number[];
  xMarks?: AxisMark[];
  yMarks?: AxisMark[];
}) {
  const frame = useFrame();
  const [x0, x1] = frame.xDomain;
  const [y0, y1] = frame.yDomain;
  const ox = x0 <= 0 && 0 <= x1 ? 0 : x0;
  const oy = y0 <= 0 && 0 <= y1 ? 0 : y0;
  const pxPerX = frame.area.width / (x1 - x0);
  const pxPerY = frame.area.height / (y1 - y0);
  const clearX = (v: number) => xMarks.every((m) => Math.abs(m.at - v) * pxPerX > 18);
  const clearY = (v: number) => yMarks.every((m) => Math.abs(m.at - v) * pxPerY > 14);
  const formatX = tickText(xTicks);
  const formatY = tickText(yTicks);
  const tick = (at: [
    number,
    number
  ], dx: number, dy: number, tone: Tone = "muted") => {
    const [px, py] = frame.toPx(at);
    return <Line x1={px} y1={py} x2={px + dx} y2={py + dy} tone={tone} weight={1}/>;
  };
  return (<>
   {xAxis && <Arrow from={[x0, oy]} to={[x1, oy]} tone="muted" weight={1}/>}
   {yAxis && <Arrow from={[ox, y0]} to={[ox, y1]} tone="muted" weight={1}/>}
   {xAxis && xTicks
      .filter((v) => v >= x0 && v <= x1)
      .map((v) => (<React.Fragment key={`x${v}`}>
      {tick([v, oy], 0, 4)}
      {clearX(v) && <Label text={formatX(v)} at={[v, oy]} anchor="n" offset={[0, 6]} size="tick" font="math" tone="muted" halo/>}
     </React.Fragment>))}
   {yAxis && yTicks
      .filter((v) => v >= y0 && (y1 - v) * pxPerY > 12 && !(v === oy && oy === 0))
      .map((v) => (<React.Fragment key={`y${v}`}>
      {tick([ox, v], -4, 0)}
      {clearY(v) && <Label text={formatY(v)} at={[ox, v]} anchor="e" offset={[-6, 0]} size="tick" font="math" tone="muted" halo/>}
     </React.Fragment>))}
   {xAxis && xMarks.map((m) => (<React.Fragment key={`xm${m.tex}`}>
     {tick([m.at, oy], 0, 6, m.tone ?? "ink")}
     <MathLabel tex={m.tex} at={[m.at, oy]} anchor="n" offset={[0, 7]} tone={m.tone ?? "ink"} halo/>
    </React.Fragment>))}
   {yAxis && yMarks.map((m) => (<React.Fragment key={`ym${m.tex}`}>
     {tick([ox, m.at], -6, 0, m.tone ?? "ink")}
     <MathLabel tex={m.tex} at={[ox, m.at]} anchor="e" offset={[-8, 0]} tone={m.tone ?? "ink"} halo/>
    </React.Fragment>))}
   {xAxis && <MathLabel tex={xName} at={[x1, oy]} anchor="w" offset={[6, 0]}/>}
   {yAxis && <MathLabel tex={yName} at={[ox, y1]} anchor="w" offset={[6, 0]}/>}
  </>);
}
/** A dashed guide from a point on a graph straight down to the horizontal axis. */
export function DropLine({ at, tone = "faint" }: {
  at: [
    number,
    number
  ];
  tone?: Tone;
}) {
  const frame = useFrame();
  const [y0, y1] = frame.yDomain;
  const oy = y0 <= 0 && 0 <= y1 ? 0 : y0;
  return <Line from={[at[0], oy]} to={at} tone={tone} weight={1} dash="dashed"/>;
}
/** A dashed guide from a point on a graph across to the vertical axis. */
export function AcrossLine({ at, tone = "faint" }: {
  at: [
    number,
    number
  ];
  tone?: Tone;
}) {
  const frame = useFrame();
  const [x0, x1] = frame.xDomain;
  const ox = x0 <= 0 && 0 <= x1 ? 0 : x0;
  return <Line from={[ox, at[1]]} to={at} tone={tone} weight={1} dash="dashed"/>;
}
/** The title above a panel: what it plots, in the note's notation. */
export function PanelTitle({ tex, x, y }: {
  tex: string;
  x: number;
  y: number;
}) {
  return <MathLabel tex={tex} x={x} y={y} anchor="sw" size="label"/>;
}
