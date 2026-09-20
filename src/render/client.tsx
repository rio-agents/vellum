import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider } from "../theme/index.ts";
import { defaultTheme } from "../theme/default-theme.ts";
import type { FigureTheme } from "../theme/types.ts";
import type { FigureDefinition } from "../define.ts";
import { FigureDefinitionContext } from "../scene/Figure.tsx";
import { useFigureParams } from "../params/state.ts";
import { Controls } from "../controls/Controls.tsx";
import { harvestMathFromSvg } from "../text/tex-resolver.ts";

export interface MountFigureOptions {
  theme?: FigureTheme;
  initialParams?: Record<string, unknown>;
}

export interface MountedFigureInstance {
  unmount: () => void;
}

interface InteractiveFigureProps {
  definition: FigureDefinition<any, any>;
  theme: FigureTheme;
  initialParams?: Record<string, unknown>;
}

function InteractiveFigure({ definition, theme, initialParams }: InteractiveFigureProps) {
  const { params, derived, set } = useFigureParams(definition, initialParams);

  const svgElement = definition.render({
    params,
    derived,
    theme,
    time: 0,
  });

  return (
    <FigureDefinitionContext.Provider value={definition}>
      <ThemeProvider theme={theme}>
        {svgElement}
        <Controls definition={definition} params={params} set={set} />
      </ThemeProvider>
    </FigureDefinitionContext.Provider>
  );
}

let instanceCounter = 0;

export function mountFigure(
  element: HTMLElement,
  definition: FigureDefinition<any, any>,
  options: MountFigureOptions = {}
): MountedFigureInstance {
  // Harvest any math paths rendered into the static SVG before replacing
  harvestMathFromSvg(element);

  const theme = options.theme ?? defaultTheme;
  const instancePrefix = `${definition.id}-${++instanceCounter}`;
  const root: Root = createRoot(element, { identifierPrefix: instancePrefix });

  root.render(
    <InteractiveFigure
      definition={definition}
      theme={theme}
      initialParams={options.initialParams}
    />
  );

  return {
    unmount: () => root.unmount(),
  };
}
