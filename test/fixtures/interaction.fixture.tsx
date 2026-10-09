import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { defineFigure } from "../../src/define.ts";
import { param } from "../../src/params/schema.ts";
import { renderToSvgString } from "../../src/render/server.ts";
import { renderFigureLayout } from "../../src/render/scope.tsx";
import { defaultTheme } from "../../src/theme/default-theme.ts";
import { Figure } from "../../src/scene/Figure.tsx";
import { Panel } from "../../src/scene/Panel.tsx";
import { DragHandle } from "../../src/controls/DragHandle.tsx";
import { Probe } from "../../src/controls/Probe.tsx";
import { SolutionCurve } from "../../src/marks/SolutionCurve.tsx";
import { Contour, LevelRegion } from "../../src/marks/Contour.tsx";

const rate = (x: number, y: number) => x - y;

const explorer = defineFigure({
  id: "drag-explorer",
  description: "A field with a draggable initial point",
  layouts: { wide: { width: 200, height: 200 } },
  params: {
    start: param.point({ label: "Initial point", labelKind: "text", default: [-1, 1], bounds: { x: [-2, 2], y: [-2, 2] } }),
  },
  render: ({ params }) => (
    <Figure>
      <Panel area={{ x: 0, y: 0, width: 200, height: 200 }} x={[-2, 2]} y={[-2, 2]}>
        <LevelRegion fn={rate} />
        <Contour fn={rate} levels={[0, 1]} />
        <SolutionCurve rate={rate} through={params.start} />
        <Probe sets="start">{(at) => <text data-probe={at ? "hover" : "none"} />}</Probe>
        <DragHandle param="start" />
      </Panel>
    </Figure>
  ),
});

/** The figure as `vellum render` writes it: no setter, so nothing is operable. */
export function staticExplorer() {
  return renderToSvgString(explorer);
}

/** The figure as a mounted page draws it, with a parameter setter. */
export function liveExplorer() {
  return renderToStaticMarkup(
    renderFigureLayout(explorer, {
      asset: "drag-explorer",
      layout: "wide",
      params: { start: [0.5, -0.25] },
      derived: {},
      theme: defaultTheme,
      set: () => {},
    })
  );
}

/** A handle naming a parameter the figure does not declare. */
export function undeclaredHandle() {
  const figure = defineFigure({
    id: "undeclared-handle",
    description: "undeclared",
    layouts: { wide: { width: 100, height: 100 } },
    render: () => (
      <Figure>
        <Panel area={{ x: 0, y: 0, width: 100, height: 100 }} x={[0, 1]} y={[0, 1]}>
          <DragHandle param="missing" />
        </Panel>
      </Figure>
    ),
  });
  return renderToSvgString(figure);
}
