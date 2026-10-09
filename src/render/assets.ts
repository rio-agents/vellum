import type { FigureDefinition } from "../define.ts";
import type { AnyParamConfig } from "../params/types.ts";
import { sanitizeParamValue } from "../params/state.ts";
import { timeParameter } from "../animate/time.ts";

/**
 * Figure IDs, variant names, and layout names: lowercase words joined by single
 * hyphens, so `--` is free as a separator in asset names and SVG IDs.
 */
export const FIGURE_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** One published asset of a definition: the bare figure, or one of its variants. */
export interface FigureAssetPlan {
  /** File stem and embed name: `<id>` or `<id>--<variant>`. */
  asset: string;
  figure: string;
  variant?: string;
  /** Variant parameter overrides; absent for the bare figure. */
  params?: Record<string, unknown>;
  /** Declared layout names; the first is the primary layout. */
  layouts: string[];
}

/** The definition's layout names in declaration order; the first is the primary layout. */
export function declaredLayouts(definition: FigureDefinition<any, any, any>): string[] {
  return Object.keys(definition.layouts);
}

/** The SVG ID prefix for one layout of an asset: the asset itself for the primary layout, `<asset>--<layout>` otherwise. */
export function figureSvgId(asset: string, layout: string, primary: boolean): string {
  return primary ? asset : `${asset}--${layout}`;
}

/** The file for one layout of an asset: `<asset>.svg` for the primary layout, `<asset>.<layout>.svg` otherwise. */
export function figureAssetFile(asset: string, layout: string, primary: boolean): string {
  return primary ? `${asset}.svg` : `${asset}.${layout}.svg`;
}

export function isInteractive(definition: FigureDefinition<any, any, any>): boolean {
  const params = (definition.params ?? {}) as Record<string, AnyParamConfig>;
  return Object.entries(params).some(([key, p]) => !p.hidden && !definition.controls?.hidden?.includes(key));
}

export function isAnimated(definition: FigureDefinition<any, any, any>): boolean {
  const timeline = timeParameter(definition.params);
  return Boolean(timeline && !timeline.config.hidden && !definition.controls?.hidden?.includes(timeline.name));
}

/**
 * Lists a definition's assets and validates its name and variants. A variant may
 * set only declared parameters, and only to values the shared sanitizer keeps
 * unchanged; anything else is an authoring error rather than a silent correction.
 */
export function planFigureAssets(definition: FigureDefinition<any, any, any>): FigureAssetPlan[] {
  const { id } = definition;
  if (!FIGURE_NAME_PATTERN.test(id)) {
    throw new Error(`Figure id "${id}" must be lowercase words joined by single hyphens.`);
  }
  const layouts = declaredLayouts(definition);
  if (layouts.length === 0) throw new Error(`Figure "${id}" declares no layouts.`);
  for (const layout of layouts) {
    if (!FIGURE_NAME_PATTERN.test(layout)) {
      throw new Error(`Figure "${id}" layout "${layout}" must be lowercase words joined by single hyphens.`);
    }
  }
  if (!definition.variants) return [{ asset: id, figure: id, layouts }];

  const names = Object.keys(definition.variants);
  if (names.length === 0) throw new Error(`Figure "${id}" declares an empty \`variants\` object.`);

  const schema = (definition.params ?? {}) as Record<string, AnyParamConfig>;
  return names.map((variant) => {
    if (!FIGURE_NAME_PATTERN.test(variant)) {
      throw new Error(`Figure "${id}" variant "${variant}" must be lowercase words joined by single hyphens.`);
    }
    const params = definition.variants![variant] as Record<string, unknown>;
    for (const [key, value] of Object.entries(params)) {
      const config = schema[key];
      if (!config) throw new Error(`Figure "${id}" variant "${variant}" sets undeclared parameter "${key}".`);
      const kept = sanitizeParamValue(config, value);
      if (JSON.stringify(kept) !== JSON.stringify(value)) {
        throw new Error(
          `Figure "${id}" variant "${variant}" sets "${key}" to ${JSON.stringify(value)}, which the parameter's range or step would change to ${JSON.stringify(kept)}.`
        );
      }
    }
    return { asset: `${id}--${variant}`, figure: id, variant, params, layouts };
  });
}
