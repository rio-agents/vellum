import type { Mat2, Vec2 } from "../math/linalg.ts";

export type Easing = (progress: number) => number;
const unit = (value: number) => Math.max(0, Math.min(1, value));

export const easing = {
  linear: (progress: number) => unit(progress),
  easeInOut: (progress: number) => {
    const t = unit(progress);
    return t * t * (3 - 2 * t);
  },
} satisfies Record<string, Easing>;

export function lerp(from: number, to: number, progress: number): number {
  if (progress === 0) return from;
  if (progress === 1) return to;
  return from + (to - from) * progress;
}

export function lerpPoint2(from: Vec2, to: Vec2, progress: number): Vec2 {
  return [lerp(from[0], to[0], progress), lerp(from[1], to[1], progress)];
}

/** Entrywise interpolation; invertibility is not guaranteed between endpoints. */
export function lerpMatrix2(from: Mat2, to: Mat2, progress: number): Mat2 {
  return [lerpPoint2(from[0], to[0], progress), lerpPoint2(from[1], to[1], progress)];
}

/** Local progress for a stage on a timeline, before/after which it stays at 0/1. */
export function stageProgress(time: number, start: number, end: number, ease: Easing = easing.linear): number {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("A stage needs finite bounds with end greater than start.");
  }
  return ease(unit((time - start) / (end - start)));
}
