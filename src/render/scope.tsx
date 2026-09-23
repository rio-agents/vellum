import React, { type ReactElement } from "react";
import { ThemeProvider } from "../theme/index.ts";
import type { FigureTheme } from "../theme/types.ts";
import type { FigureDefinition, FigureSize } from "../define.ts";
import { FigureScopeContext } from "../scene/Figure.tsx";
import { declaredLayouts, figureSvgId } from "./assets.ts";

export interface FigureLayoutRenderInput {
  asset: string;
  layout: string;
  params: Record<string, unknown>;
  derived: Record<string, unknown>;
  theme: FigureTheme;
  time: number;
}

/** Draws one layout of a definition with the scope that `Figure` and the marks read. */
export function renderFigureLayout(
  definition: FigureDefinition<any, any, any>,
  { asset, layout, params, derived, theme, time }: FigureLayoutRenderInput
): ReactElement {
  const size = (definition.layouts as Record<string, FigureSize>)[layout];
  if (!size) throw new Error(`Figure "${definition.id}" does not declare a ${layout} layout.`);
  return (
    <FigureScopeContext.Provider
      key={layout}
      value={{
        id: figureSvgId(asset, layout, declaredLayouts(definition)[0] === layout),
        layout,
        size,
        description: definition.description,
      }}
    >
      <ThemeProvider theme={theme}>
        {definition.render({ params, derived, theme, time, layout, size })}
      </ThemeProvider>
    </FigureScopeContext.Provider>
  );
}
