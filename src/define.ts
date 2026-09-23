import type { ReactNode } from "react";
import type { FigureTheme } from "./theme/types.ts";
import type { FigureParamsSchema, InferParamsValues } from "./params/types.ts";

export interface FigureControlsConfig {
  order?: string[];
  hidden?: string[];
}

export interface FigurePlayerConfig {
  defaultTime?: number;
  duration?: number;
  loop?: boolean;
  fps?: number;
}

/**
 * A fixed composition size. `wide` is drawn at prose width; `compact` is the phone
 * composition, shown when the figure's container is narrower than the wide layout
 * can keep legible.
 */
export type FigureLayout = "wide" | "compact";

export interface FigureSize {
  width: number;
  height: number;
}

export interface FigureLayouts {
  wide: FigureSize;
  compact?: FigureSize;
}

export interface RenderContext<
  Params = Record<string, unknown>,
  Derived = Record<string, unknown>
> {
  params: Params;
  derived: Derived;
  theme: FigureTheme;
  time: number;
  /** The layout being drawn; the definition's `render` is called once per declared layout. */
  layout: FigureLayout;
  /** The size of the layout being drawn. */
  size: FigureSize;
}

export interface FigureDefinition<
  P extends FigureParamsSchema = FigureParamsSchema,
  D extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  description: string;
  layouts: FigureLayouts;
  params?: P;
  /**
   * Fixed parameter settings, each rendered as its own asset `<id>--<variant>`.
   * A definition with variants has no bare `<id>` asset.
   */
  variants?: Record<string, Partial<InferParamsValues<P>>>;
  derive?: (params: InferParamsValues<P>) => D;
  render: (ctx: RenderContext<InferParamsValues<P>, D>) => ReactNode;
  controls?: FigureControlsConfig;
  player?: FigurePlayerConfig;
}

export function defineFigure<
  P extends FigureParamsSchema = Record<string, never>,
  D extends Record<string, unknown> = Record<string, never>
>(def: FigureDefinition<P, D>): FigureDefinition<P, D> {
  return def;
}
