import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "../theme/index.ts";
import { defaultTheme } from "../theme/default-theme.ts";
import type { FigureTheme } from "../theme/types.ts";
import type { FigureDefinition } from "../define.ts";

export interface RenderServerOptions {
  theme?: FigureTheme;
  params?: Record<string, any>;
  time?: number;
}

export function renderToSvgString(
  definition: FigureDefinition,
  options: RenderServerOptions = {}
): string {
  const theme = options.theme ?? defaultTheme;

  const resolvedParams: Record<string, any> = {};
  if (definition.params) {
    for (const [key, p] of Object.entries(definition.params as Record<string, any>)) {
      resolvedParams[key] = options.params?.[key] ?? p.default;
    }
  }

  const derived = definition.derive ? definition.derive(resolvedParams) : {};

  const time =
    options.time ??
    (definition.player?.defaultTime ?? (definition.params as any)?.time?.default ?? 0);

  const element = definition.render({
    params: resolvedParams,
    derived,
    theme,
    time,
  });

  const wrapped = React.createElement(ThemeProvider, { theme }, element);

  let svg = renderToStaticMarkup(wrapped);

  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return svg;
}
