import { createContext, useContext } from "react";
import type { LinearScale } from "../math/scale.ts";

export interface FrameContextValue {
  area: { x: number; y: number; width: number; height: number };
  xDomain: [number, number];
  yDomain: [number, number];
  toPx: (point: [number, number]) => [number, number];
  fromPx: (pixel: [number, number]) => [number, number];
  sx: LinearScale;
  sy: LinearScale;
  pxPerUnit: { x: number; y: number };
  clipId?: string;
}

export const FrameContext = createContext<FrameContextValue | null>(null);

export function useFrame(): FrameContextValue {
  const ctx = useContext(FrameContext);
  if (!ctx) {
    throw new Error("useFrame must be used inside a <Panel>");
  }
  return ctx;
}

export function useFrameSafe(): FrameContextValue | null {
  return useContext(FrameContext);
}
