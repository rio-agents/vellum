import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "../theme/index.ts";
import { defaultTheme } from "../theme/default-theme.ts";
import type { FigureTheme } from "../theme/types.ts";
import type { FigureDefinition } from "../define.ts";
import type { AnyParamConfig } from "../params/types.ts";
import { resolveDefaultParams } from "../params/index.ts";
import { FigureDefinitionContext } from "../scene/Figure.tsx";
import { texToSvg } from "../text/tex.ts";
import { registerSyncTexResolver, makeCacheKey } from "../text/tex-resolver.ts";

registerSyncTexResolver(texToSvg);

export interface RenderServerOptions {
  theme?: FigureTheme;
  params?: Record<string, unknown>;
  time?: number;
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

  const element = definition.render({
    params: resolvedParams as any,
    derived: derived as any,
    theme,
    time: typeof time === "number" ? time : 0,
  });

  // Pre-render parameter TeX labels into hidden defs so client can harvest without loading MathJax
  const paramDefs: React.ReactNode[] = [];
  if (definition.params) {
    for (const [key, p] of Object.entries(definition.params as Record<string, AnyParamConfig>)) {
      if (p.label && p.labelKind !== "text") {
        try {
          const math = texToSvg(p.label);
          paramDefs.push(
            React.createElement(
              "g",
              {
                key: `param-math-${key}`,
                className: "webnotes-math-label",
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

  const wrapped = React.createElement(
    FigureDefinitionContext.Provider,
    { value: definition },
    React.createElement(ThemeProvider, { theme }, element)
  );

  let svg = renderToStaticMarkup(wrapped);

  if (paramDefs.length > 0) {
    const defsString = renderToStaticMarkup(
      React.createElement("defs", { className: "webnotes-figure-param-defs" }, ...paramDefs)
    );
    svg = svg.replace("</svg>", `${defsString}</svg>`);
  }

  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return svg;
}
