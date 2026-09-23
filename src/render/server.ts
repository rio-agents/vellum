import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { defaultTheme } from "../theme/default-theme.ts";
import type { FigureTheme } from "../theme/types.ts";
import type { FigureDefinition, FigureLayout } from "../define.ts";
import type { AnyParamConfig } from "../params/types.ts";
import { resolveDefaultParams } from "../params/index.ts";
import { renderFigureLayout } from "./scope.tsx";
import { texToSvg } from "../text/tex.ts";
import { registerSyncTexResolver, makeCacheKey } from "../text/tex-resolver.ts";

registerSyncTexResolver(texToSvg);

export interface RenderServerOptions {
  theme?: FigureTheme;
  params?: Record<string, unknown>;
  time?: number;
  layout?: FigureLayout;
  /** Asset name used to scope SVG IDs; defaults to the definition id. */
  asset?: string;
}

export function renderToSvgString(
  definition: FigureDefinition<any, any>,
  options: RenderServerOptions = {}
): string {
  const theme = options.theme ?? defaultTheme;

  const resolvedParams = resolveDefaultParams(
    definition.params,
    options.params as any
  );

  const derived = definition.derive ? definition.derive(resolvedParams as any) : {};

  const time =
    options.time ??
    (definition.player?.defaultTime ??
      (definition.params as Record<string, AnyParamConfig> | undefined)?.time?.default ??
      0);

  const layout = options.layout ?? "wide";
  const element = renderFigureLayout(definition, {
    asset: options.asset ?? definition.id,
    layout,
    params: resolvedParams as Record<string, unknown>,
    derived: derived as Record<string, unknown>,
    theme,
    time: typeof time === "number" ? time : 0,
  });

  // Pre-render parameter TeX labels into hidden defs so the client can harvest them
  // without loading MathJax. The wide SVG carries them for the whole figure element.
  const paramDefs: React.ReactNode[] = [];
  if (definition.params && layout === "wide") {
    for (const [key, p] of Object.entries(definition.params as Record<string, AnyParamConfig>)) {
      if (p.label && p.labelKind !== "text") {
        try {
          const math = texToSvg(p.label);
          paramDefs.push(
            React.createElement(
              "g",
              {
                key: `param-math-${key}`,
                className: "vellum-math-label",
                "data-label-text": p.label,
                "data-width-em": math.widthEm,
                "data-height-em": math.heightEm,
                style: { display: "none" },
              },
              React.createElement("svg", {
                viewBox: math.viewBox,
                width: math.widthEm * 14,
                height: math.heightEm * 14,
                dangerouslySetInnerHTML: { __html: math.inner },
              })
            )
          );
        } catch {
          // Ignore invalid TeX during defs generation
        }
      }
    }
  }

  let svg = renderToStaticMarkup(element);

  if (paramDefs.length > 0) {
    const defsString = renderToStaticMarkup(
      React.createElement("defs", { className: "vellum-figure-param-defs" }, ...paramDefs)
    );
    svg = svg.replace("</svg>", `${defsString}</svg>`);
  }

  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return svg;
}
