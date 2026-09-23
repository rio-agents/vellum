import type { ReactNode } from "react";
import type { FigureTheme } from "./theme/types.ts";
import type { FigureParamsSchema, InferParamsValues, AnyParamConfig } from "./params/types.ts";

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

export interface RenderContext<
  Params = Record<string, unknown>,
  Derived = Record<string, unknown>
> {
  params: Params;
  derived: Derived;
  theme: FigureTheme;
  time: number;
}

export interface FigureDefinition<
  P extends FigureParamsSchema = FigureParamsSchema,
  D extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  description: string;
  size: { width: number; height: number };
  params?: P;
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
