import React, { useState, useCallback, useRef } from "react";
import { useFrame } from "../scene/frame-context.ts";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { clampNumber } from "../params/state.ts";

export interface DragHandleProps {
  point: [number, number];
  onChange: (point: [number, number]) => void;
  bounds?: { x?: [number, number]; y?: [number, number] };
  step?: number;
  label?: string;
  tone?: Tone;
  radius?: number;
  constrain?: (pt: [number, number]) => [number, number];
  className?: string;
}

export function DragHandle({
  point,
  onChange,
  bounds,
  step = 0.05,
  label = "Control point",
  tone = "accent",
  radius = 7,
  constrain,
  className,
}: DragHandleProps) {
  const frame = useFrame();
  const theme = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const handleRef = useRef<SVGGElement>(null);

  const toneColor = resolveTone(tone, theme);
  const surfaceColor = resolveTone("surface", theme);

  const [px, py] = frame.toPx(point);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      handleRef.current?.focus();
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (!isDragging) return;
      e.preventDefault();
      const svg = e.currentTarget.ownerSVGElement;
      if (!svg) return;

      const ctm = svg.getScreenCTM();
      if (!ctm) return;

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPoint = pt.matrixTransform(ctm.inverse());

      let dataPoint = frame.fromPx([svgPoint.x, svgPoint.y]);

      if (constrain) {
        dataPoint = constrain(dataPoint);
      }

      let [x, y] = dataPoint;
      if (bounds?.x) x = clampNumber(x, bounds.x[0], bounds.x[1]);
      if (bounds?.y) y = clampNumber(y, bounds.y[0], bounds.y[1]);

      onChange([Number(x.toFixed(4)), Number(y.toFixed(4))]);
    },
    [isDragging, frame, constrain, bounds, onChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (isDragging) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // pointer might already be released
        }
        setIsDragging(false);
      }
    },
    [isDragging]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGGElement>) => {
      let dx = 0;
      let dy = 0;
      const effectiveStep = e.shiftKey ? step * 5 : step;

      switch (e.key) {
        case "ArrowLeft":
          dx = -effectiveStep;
          break;
        case "ArrowRight":
          dx = effectiveStep;
          break;
        case "ArrowDown":
          dy = -effectiveStep;
          break;
        case "ArrowUp":
          dy = effectiveStep;
          break;
        default:
          return;
      }

      e.preventDefault();
      let nextPoint: [number, number] = [point[0] + dx, point[1] + dy];

      if (constrain) {
        nextPoint = constrain(nextPoint);
      }

      let [x, y] = nextPoint;
      if (bounds?.x) x = clampNumber(x, bounds.x[0], bounds.x[1]);
      if (bounds?.y) y = clampNumber(y, bounds.y[0], bounds.y[1]);

      onChange([Number(x.toFixed(4)), Number(y.toFixed(4))]);
    },
    [point, step, constrain, bounds, onChange]
  );

  return (
    <g
      ref={handleRef}
      tabIndex={0}
      role="slider"
      aria-label={label}
      aria-valuenow={point[0]}
      aria-valuetext={`(${point[0].toFixed(2)}, ${point[1].toFixed(2)})`}
      className={`vellum-drag-handle ${className ?? ""}`.trim()}
      transform={`translate(${px.toFixed(2)}, ${py.toFixed(2)})`}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        outline: "none",
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Invisible large hit target for touch accessibility */}
      <circle r={20} fill="transparent" />

      {/* Visible focus ring */}
      {isFocused && (
        <circle
          r={radius + 5}
          fill="none"
          stroke={toneColor}
          strokeWidth={2}
          strokeOpacity={0.6}
          strokeDasharray="3 2"
        />
      )}

      {/* Outer border for high contrast against background */}
      <circle r={radius + 1.5} fill={surfaceColor} />

      {/* Main handle dot */}
      <circle
        r={radius}
        fill={toneColor}
        stroke={surfaceColor}
        strokeWidth={1.5}
      />
    </g>
  );
}
