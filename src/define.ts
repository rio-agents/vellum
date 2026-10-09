import type { ReactNode } from "react";
import type { FigureTheme } from "./theme/types.ts";
import type { FigureParamsSchema, InferParamsValues } from "./params/types.ts";
import { timeParameter } from "./animate/time.ts";

export interface FigureControlsConfig {
  order?: string[];
  /** Parameters with no control at all; a figure whose visible parameters are all hidden is not interactive. */
  hidden?: string[];
  /**
   * Parameters operated by marks inside the figure, such as `ChipGroup` or
   * `ChipToggle`. They get no control below the figure but still make it
   * interactive. Point parameters are always operated inside the figure.
   */
  inFigure?: string[];
}

/** The size of one composition of a figure, in SVG units. */
export interface FigureSize {
  width: number;
  height: number;
}

export interface RenderContext<
  Params = Record<string, unknown>,
  Derived = Record<string, unknown>,
  Layout extends string = string
> {
  params: Params;
  derived: Derived;
  theme: FigureTheme;
  time: number;
  /** The name of the layout being drawn; `render` is called once per declared layout. */
  layout: Layout;
  /** The size of the layout being drawn. */
  size: FigureSize;
}

export interface FigureDefinition<
  P extends FigureParamsSchema = FigureParamsSchema,
  D extends Record<string, unknown> = Record<string, unknown>,
  L extends string = string
> {
  id: string;
  description: string;
  /**
   * Named compositions of the figure, each drawn by `render` at its own size, for
   * example `{ wide: {...}, compact: {...} }`. The first declared layout is the
   * primary one. Names are lowercase words joined by single hyphens.
   */
  layouts: Record<L, FigureSize>;
  params?: P;
  /**
   * Fixed parameter settings, each rendered as its own asset `<id>--<variant>`.
   * A definition with variants has no bare `<id>` asset.
   */
  variants?: Record<string, Partial<InferParamsValues<P>>>;
  derive?: (params: InferParamsValues<P>) => D;
  render: (ctx: RenderContext<InferParamsValues<P>, D, L>) => ReactNode;
  controls?: FigureControlsConfig;
}

export function defineFigure<
  P extends FigureParamsSchema = Record<string, never>,
  D extends Record<string, unknown> = Record<string, never>,
  L extends string = string
>(def: FigureDefinition<P, D, L>): FigureDefinition<P, D, L> {
  timeParameter(def.params);
  return def;
}
