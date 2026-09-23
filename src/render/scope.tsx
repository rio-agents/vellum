import React, { type ReactElement } from "react";
import { ThemeProvider } from "../theme/index.ts";
import type { FigureTheme } from "../theme/types.ts";
import type { FigureDefinition, FigureLayout } from "../define.ts";
import { FigureScopeContext } from "../scene/Figure.tsx";
import { figureSvgId } from "./assets.ts";

export interface FigureLayoutRenderInput {
  asset: string;
  layout: FigureLayout;
  params: Record<string, unknown>;
  derived: Record<string, unknown>;
  theme: FigureTheme;
  time: number;
}

/** Draws one layout of a definition with the scope that `Figure` and the marks read. */
export function renderFigureLayout(
  definition: FigureDefinition<any, any>,
  { asset, layout, params, derived, theme, time }: FigureLayoutRenderInput
): ReactElement {
  const size = definition.layouts[layout];
  if (!size) throw new Error(`Figure "${definition.id}" does not declare a ${layout} layout.`);
  return (
    <FigureScopeContext.Provider
      key={layout}
      value={{ id: figureSvgId(asset, layout), layout, size, description: definition.description }}
    >
      <ThemeProvider theme={theme}>
        {definition.render({ params, derived, theme, time, layout, size })}
      </ThemeProvider>
    </FigureScopeContext.Provider>
  );
}
