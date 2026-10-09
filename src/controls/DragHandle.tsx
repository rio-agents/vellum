import React, { useState, useCallback } from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { useParam } from "../params/binding.ts";
import type { PointParamConfig } from "../params/types.ts";

export interface DragHandleProps {
  /** Name of the `param.point` this handle shows and moves. */
  param: string;
  /** Accessible name; defaults to the parameter's text label. */
  label?: string;
  /** Snap or restrict a proposed point, in data coordinates, before it is set. */
  constrain?: (point: [number, number]) => [number, number];
  tone?: Tone;
  radius?: number;
  className?: string;
}

/** Converts a pointer event to figure pixels through the owning SVG's transform. */
export function pointerToFigurePx(event: React.PointerEvent<SVGElement>): [number, number] | null {
  const svg = event.currentTarget.ownerSVGElement ?? (event.currentTarget as SVGSVGElement);
  const ctm = svg.getScreenCTM?.();
  if (!ctm) return null;
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const p = pt.matrixTransform(ctm.inverse());
  return [p.x, p.y];
}

const fmt = (v: number) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

/**
 * A draggable point bound to a declared `param.point`. In a live figure it moves
 * with the pointer and with the arrow keys (Shift for larger steps), and the
 * parameter's bounds limit it. In a static render it is drawn as a plain point.
 */
export function DragHandle({ param: name, label, constrain, tone = "accent", radius = 5.5, className }: DragHandleProps) {
  const frame = useFrame();
  const theme = useTheme();
  const { value, config, set } = useParam<[number, number]>(name);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);

  if (config.type !== "point") throw new Error(`DragHandle needs a point parameter; "${name}" is a ${config.type}.`);
  const pointConfig = config as PointParamConfig;
  const step = pointConfig.step ?? Math.abs(frame.xDomain[1] - frame.xDomain[0]) / 100;
  const name_ = label ?? (pointConfig.labelKind === "text" && pointConfig.label ? pointConfig.label : "Point");

  const toneColor = resolveTone(tone, theme);
  const surface = resolveTone("surface", theme);
  const [px, py] = frame.toPx(value);

  const propose = useCallback(
    (point: [number, number]) => {
      if (!set) return;
      const next = constrain ? constrain(point) : point;
      set([Number(next[0].toFixed(4)), Number(next[1].toFixed(4))]);
    },
    [set, constrain]
  );

  const dot = (
    <>
      <circle r={radius + 4} fill={toneColor} fillOpacity={dragging || focused ? 0.22 : 0.14} />
      <circle r={radius} fill={toneColor} stroke={surface} strokeWidth={1.5} />
    </>
  );

  if (!set) {
    return (
      <g className={`vellum-drag-handle ${className ?? ""}`.trim()} transform={`translate(${px}, ${py})`}>
        {dot}
      </g>
    );
  }

  return (
    <g
      tabIndex={0}
      role="slider"
      aria-roledescription="draggable point"
      aria-label={name_}
      aria-valuetext={`x ${fmt(value[0])}, y ${fmt(value[1])}`}
      className={`vellum-drag-handle ${className ?? ""}`.trim()}
      transform={`translate(${px}, ${py})`}
      style={{ cursor: dragging ? "grabbing" : "grab", outline: "none", touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        (e.currentTarget as SVGGElement).focus();
        setDragging(true);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        const p = pointerToFigurePx(e);
        if (p) propose(frame.fromPx(p));
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={(e) => {
        const move = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
        if (!move) return;
        e.preventDefault();
        const s = e.shiftKey ? step * 5 : step;
        propose([value[0] + move[0] * s, value[1] + move[1] * s]);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {/* A large transparent target for touch. */}
      <circle r={18} fill="transparent" />
      {focused && <circle r={radius + 7} fill="none" stroke={toneColor} strokeWidth={1.5} />}
      {dot}
    </g>
  );
}
