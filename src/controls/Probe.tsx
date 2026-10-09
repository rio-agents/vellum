import React, { useState, useContext, type ReactNode } from "react";
import { useFrame } from "../scene/frame-context.ts";
import { ParamBindingContext } from "../params/binding.ts";
import { pointerToFigurePx } from "./DragHandle.tsx";

export interface ProbeProps {
  /**
   * Draws what follows the pointer, given its position in data coordinates, or
   * null when the pointer is outside the panel and in a static render.
   */
  children?: (at: [number, number] | null) => ReactNode;
  /**
   * A `param.point` to set where the panel is pressed and while it is dragged,
   * so readers can place a point anywhere instead of finding its handle.
   */
  sets?: string;
}

/**
 * Pointer input over a whole panel. Place it before the marks that should stay
 * on top, such as a drag handle. Hover readouts appear only with a mouse; a
 * press sets the bound point with any pointer. A static render draws
 * `children(null)` and nothing else.
 */
export function Probe({ children, sets }: ProbeProps) {
  const frame = useFrame();
  const binding = useContext(ParamBindingContext);
  const [at, setAt] = useState<[number, number] | null>(null);
  const [pressed, setPressed] = useState(false);
  const live = Boolean(binding?.set);

  if (sets && binding && binding.schema[sets]?.type !== "point") {
    throw new Error(`Probe sets "${sets}", which is not a declared point parameter.`);
  }
  if (!live) return <>{children?.(null)}</>;

  const place = (e: React.PointerEvent<SVGRectElement>) => {
    const p = pointerToFigurePx(e);
    if (p && sets) binding!.set!(sets, frame.fromPx(p).map((v) => Number(v.toFixed(4))));
  };

  const { x, y, width, height } = frame.area;
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        className="vellum-probe"
        style={{ cursor: sets ? "crosshair" : undefined, touchAction: sets ? "none" : undefined }}
        onPointerDown={(e) => {
          if (!sets) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setPressed(true);
          setAt(null);
          place(e);
        }}
        onPointerMove={(e) => {
          if (pressed) return place(e);
          const p = e.pointerType === "mouse" ? pointerToFigurePx(e) : null;
          setAt(p ? frame.fromPx(p) : null);
        }}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onPointerLeave={() => setAt(null)}
      />
      <g pointerEvents="none">{children?.(pressed ? null : at)}</g>
    </>
  );
}
