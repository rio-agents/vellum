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
import { timeParameter, figureTime } from "../animate/time.ts";
import { usePlayback } from "../animate/usePlayback.ts";
import { Player } from "../controls/Player.tsx";

export interface MountFigureOptions {
  theme?: FigureTheme;
  /** Asset name used to scope SVG IDs; defaults to the definition id. */
  asset?: string;
  initialParams?: Record<string, unknown>;
  /** Preserve the embedding page's accessible name through live redraws. */
  accessibleName?: string;
}

export interface MountedFigureInstance {
  unmount: () => void;
}

interface InteractiveFigureProps {
  definition: FigureDefinition<any, any, any>;
  asset: string;
  theme: FigureTheme;
  initialParams?: Record<string, unknown>;
  element: HTMLElement;
  accessibleName?: string;
}

/**
 * Every declared layout is rendered from one parameter store, followed by one set
 * of controls. The page's CSS keeps choosing which SVG is visible, exactly as it
 * does for the static result.
 */
function InteractiveFigure({ definition, asset, theme, initialParams, element, accessibleName }: InteractiveFigureProps) {
  const { params, derived, set } = useFigureParams(definition, initialParams);
  const timeline = timeParameter(definition.params);
  const visibleTimeline = timeline && !timeline.config.hidden && !definition.controls?.hidden?.includes(timeline.name)
    ? timeline : undefined;
  const playback = usePlayback(visibleTimeline, figureTime(definition.params, params),
    (time) => { if (timeline) set(timeline.name, time); }, element);

  return (
    <>
      {declaredLayouts(definition).map((layout) =>
        renderFigureLayout(definition, { asset, layout, params, derived, theme, accessibleName })
      )}
      <ThemeProvider theme={theme}>
        <Controls definition={definition} params={params} set={set} />
        {visibleTimeline && <Player timeline={visibleTimeline} {...playback} />}
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
      asset={instancePrefix}
      theme={theme}
      initialParams={options.initialParams}
      element={element}
      accessibleName={options.accessibleName}
    />
  );

  return {
    unmount: () => root.unmount(),
  };
}
