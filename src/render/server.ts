import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "../theme/index.ts";
import { defaultTheme } from "../theme/default-theme.ts";
import type { FigureTheme } from "../theme/types.ts";
import type { FigureDefinition } from "../define.ts";
import type { AnyParamConfig } from "../params/types.ts";
import { FigureDefinitionContext } from "../scene/Figure.tsx";

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

  const resolvedParams: Record<string, unknown> = {};
  if (definition.params) {
    for (const [key, p] of Object.entries(definition.params as Record<string, AnyParamConfig>)) {
      resolvedParams[key] = options.params?.[key] ?? p.default;
    }
  }

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

  const wrapped = React.createElement(
    FigureDefinitionContext.Provider,
    { value: definition },
    React.createElement(ThemeProvider, { theme }, element)
  );

  let svg = renderToStaticMarkup(wrapped);

  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return svg;
}
