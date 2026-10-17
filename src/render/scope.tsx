import React, { type ReactElement } from "react";
import { ThemeProvider } from "../theme/index.ts";
import type { FigureTheme } from "../theme/types.ts";
import { figureDescription, type FigureDefinition, type FigureSize } from "../define.ts";
import { FigureScopeContext } from "../scene/Figure.tsx";
import { declaredLayouts, figureSvgId } from "./assets.ts";
import { figureTime } from "../animate/time.ts";
import { ParamBindingContext } from "../params/binding.ts";

export interface FigureLayoutRenderInput {
  asset: string;
  layout: string;
  params: Record<string, unknown>;
  derived: Record<string, unknown>;
  theme: FigureTheme;
  accessibleName?: string;
  /** Changes a parameter by name; given only when the figure is live. */
  set?: (name: string, value: unknown) => void;
}

/** Draws one layout of a definition with the scope that `Figure` and the marks read. */
export function renderFigureLayout(
  definition: FigureDefinition<any, any, any>,
  { asset, layout, params, derived, theme, accessibleName, set }: FigureLayoutRenderInput
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
        description: accessibleName ?? figureDescription(definition, params),
      }}
    >
      <ThemeProvider theme={theme}>
        <ParamBindingContext.Provider value={{ values: params, schema: definition.params ?? {}, set }}>
          {definition.render({ params, derived, theme, time: figureTime(definition.params, params), layout, size })}
        </ParamBindingContext.Provider>
      </ThemeProvider>
    </FigureScopeContext.Provider>
  );
}
