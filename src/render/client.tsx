import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider } from "../theme/index.ts";
import { defaultTheme } from "../theme/default-theme.ts";
import type { FigureTheme } from "../theme/types.ts";
import type { FigureDefinition } from "../define.ts";
import { useFigureParams } from "../params/state.ts";
import { Controls } from "../controls/Controls.tsx";
import { harvestMathFromSvg } from "../text/tex-resolver.ts";
import { declaredLayouts } from "./assets.ts";
import { renderFigureLayout } from "./scope.tsx";

export interface MountFigureOptions {
  theme?: FigureTheme;
  /** Asset name used to scope SVG IDs; defaults to the definition id. */
  asset?: string;
  initialParams?: Record<string, unknown>;
}

export interface MountedFigureInstance {
  unmount: () => void;
}

interface InteractiveFigureProps {
  definition: FigureDefinition<any, any, any>;
  asset: string;
  theme: FigureTheme;
  initialParams?: Record<string, unknown>;
}

/**
 * Every declared layout is rendered from one parameter store, followed by one set
 * of controls. The page's CSS keeps choosing which SVG is visible, exactly as it
 * does for the static result.
 */
function InteractiveFigure({ definition, asset, theme, initialParams }: InteractiveFigureProps) {
  const { params, derived, set } = useFigureParams(definition, initialParams);

  return (
    <>
      {declaredLayouts(definition).map((layout) =>
        renderFigureLayout(definition, { asset, layout, params, derived, theme, time: 0 })
      )}
      <ThemeProvider theme={theme}>
        <Controls definition={definition} params={params} set={set} />
      </ThemeProvider>
    </>
  );
}

let instanceCounter = 0;

export function mountFigure(
  element: HTMLElement,
  definition: FigureDefinition<any, any, any>,
  options: MountFigureOptions = {}
): MountedFigureInstance {
  // Harvest any math paths rendered into the static SVGs before replacing them
  harvestMathFromSvg(element);

  const theme = options.theme ?? defaultTheme;
  const asset = options.asset ?? definition.id;
  const instancePrefix = `${asset}-${++instanceCounter}`;
  const root: Root = createRoot(element, { identifierPrefix: instancePrefix });

  root.render(
    <InteractiveFigure
      definition={definition}
      asset={asset}
      theme={theme}
      initialParams={options.initialParams}
    />
  );

  return {
    unmount: () => root.unmount(),
  };
}
