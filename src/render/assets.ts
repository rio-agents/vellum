import type { FigureDefinition, FigureLayout } from "../define.ts";
import type { AnyParamConfig } from "../params/types.ts";
import { sanitizeParamValue } from "../params/state.ts";

/** Figure IDs and variant names: lowercase words joined by single hyphens, so `--` is free as a separator. */
export const FIGURE_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** One published asset of a definition: the bare figure, or one of its variants. */
export interface FigureAssetPlan {
  /** File stem and embed name: `<id>` or `<id>--<variant>`. */
  asset: string;
  figure: string;
  variant?: string;
  /** Variant parameter overrides; absent for the bare figure. */
  params?: Record<string, unknown>;
  layouts: FigureLayout[];
}

export function declaredLayouts(definition: FigureDefinition<any, any>): FigureLayout[] {
  return definition.layouts.compact ? ["wide", "compact"] : ["wide"];
}

/** The SVG ID prefix for one layout of one asset. */
export function figureSvgId(asset: string, layout: FigureLayout): string {
  return layout === "wide" ? asset : `${asset}--${layout}`;
}

/** The generated file name for one layout of one asset. */
export function figureAssetFile(asset: string, layout: FigureLayout): string {
  return layout === "wide" ? `${asset}.svg` : `${asset}.${layout}.svg`;
}

export function isInteractive(definition: FigureDefinition<any, any>): boolean {
  const params = (definition.params ?? {}) as Record<string, AnyParamConfig>;
  return Object.entries(params).some(([key, p]) => !p.hidden && !definition.controls?.hidden?.includes(key));
}

export function isAnimated(definition: FigureDefinition<any, any>): boolean {
  return Boolean(definition.player || (definition.params && "time" in definition.params));
}

/**
 * Lists a definition's assets and validates its name and variants. A variant may
 * set only declared parameters, and only to values the shared sanitizer keeps
 * unchanged; anything else is an authoring error rather than a silent correction.
 */
export function planFigureAssets(definition: FigureDefinition<any, any>): FigureAssetPlan[] {
  const { id } = definition;
  if (!FIGURE_NAME_PATTERN.test(id)) {
    throw new Error(`Figure id "${id}" must be lowercase words joined by single hyphens.`);
  }
  const layouts = declaredLayouts(definition);
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
