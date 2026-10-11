import React, { type ReactNode } from "react";
import { renderToSvgString } from "../../src/render/server.ts";
import { defineFigure } from "../../src/define.ts";
import { Figure } from "../../src/scene/Figure.tsx";
import { Panel } from "../../src/scene/Panel.tsx";
import { Axes } from "../../src/marks/Axes.tsx";
import { Label } from "../../src/text/Label.tsx";
import { MathLabel } from "../../src/text/MathLabel.tsx";
import { Point } from "../../src/marks/Point.tsx";
import { Line } from "../../src/marks/Line.tsx";
import { Arrow } from "../../src/marks/Arrow.tsx";
import { Rect } from "../../src/marks/Rect.tsx";

/** Renders children directly in a 600 x 300 figure, outside any panel. */
function inFigure(children: ReactNode): string {
  return renderToSvgString(
    defineFigure({
      id: "fixture",
      description: "fixture",
      layouts: { wide: { width: 600, height: 300 } },
      render: () => <Figure>{children}</Figure>,
    })
  );
}

/** Renders children inside a 400 x 200 panel at (100, 50) with domain [0, 10] x [0, 5]. */
function inPanel(children: ReactNode): string {
  return inFigure(
    <Panel area={{ x: 100, y: 50, width: 400, height: 200 }} x={[0, 10]} y={[0, 5]}>
      {children}
    </Panel>
  );
}

export const tickLabels = () =>
  inPanel(<Axes ticksX={[5]} ticksY={[4]} showTickLabels tickFormatX={String} tickFormatY={String} />);

export const axisTitles = () =>
  inPanel(<Axes xLabel="time" yLabel="height" xLabelKind="text" yLabelKind="text" />);

export const haloText = () => inPanel(<Label text="halo" at={[1, 1]} halo />);

export const haloMath = () => inPanel(<MathLabel tex="x" at={[1, 1]} halo />);

export const plainMath = () => inPanel(<MathLabel tex="x" at={[1, 1]} />);

// Coordinate rule: scalar x/y are figure pixels everywhere; tuples are data and need a Panel.
export const labelPixelsInPanel = () => inPanel(<Label text="px" x={40} y={20} />);
export const labelDataInPanel = () => inPanel(<Label text="data" at={[5, 4]} offset={[3, -2]} />);
export const labelPixelsInFigure = () => inFigure(<Label text="px" x={40} y={20} />);
export const labelDataInFigure = () => inFigure(<Label text="data" at={[5, 4]} />);
export const mathDataInFigure = () => inFigure(<MathLabel tex="x" at={[5, 4]} />);
export const labelBothForms = () =>
  inPanel(<Label text="both" {...({ at: [5, 4], x: 1, y: 2 } as unknown as { x: number; y: number })} />);
export const pointPixelsInPanel = () => inPanel(<Point x={40} y={20} />);
export const pointDataInFigure = () => inFigure(<Point at={[1, 1]} />);
export const linePixelsInPanel = () => inPanel(<Line x1={10} y1={20} x2={30} y2={40} />);
export const lineDataInFigure = () => inFigure(<Line from={[0, 0]} to={[1, 1]} />);
export const arrowPixelsInFigure = () => inFigure(<Arrow x1={10} y1={20} x2={30} y2={40} />);
export const arrowDataInFigure = () => inFigure(<Arrow from={[0, 0]} to={[1, 1]} />);
export const rectCornersInPanel = () => inPanel(<Rect from={[2, 1]} to={[4, 3]} />);
export const rectPixelsInFigure = () => inFigure(<Rect x={10} y={20} width={30} height={40} />);
export const rectOutline = () => inPanel(<Rect from={[2, 1]} to={[4, 3]} fillOpacity={0} strokeTone="ink" />);

export const twoClippedPanels = () =>
  inFigure(
    <>
      <Panel area={{ x: 0, y: 0, width: 300, height: 300 }} x={[0, 1]} y={[0, 1]} clip>
        <Label text="left" at={[0.5, 0.5]} />
      </Panel>
      <Panel area={{ x: 300, y: 0, width: 300, height: 300 }} x={[0, 1]} y={[0, 1]} clip>
        <Label text="right" at={[0.5, 0.5]} />
      </Panel>
    </>
  );

import { PlotAxes, tickText, niceTicks } from "../../src/marks/PlotAxes.tsx";
import { DiagramBox, DiagramGroup, Connector, boxAnchor, diagramRow, diagramColumn } from "../../src/marks/Diagram.tsx";
export const symbolicAxes = () => inPanel(<PlotAxes xName="t" yName="y" xTicks={[0, 5, 10]} yTicks={[0, 4]} xMarks={[{ at: 5, tex: "b" }]} />);
export const edgeAxes = () => inFigure(<Panel area={{ x: 100, y: 50, width: 400, height: 200 }} x={[2, 12]} y={[1, 6]}><PlotAxes xName="t" yName="y" /></Panel>);
export const diagramConnector = () => inPanel(<Connector from={{ x: 10, y: 20 }} to={{ x: 90, y: 50 }} via={[{ x: 90, y: 20 }]} />);
export const diagramCurve = () => inFigure(<Connector from={{ x: 10, y: 20 }} to={{ x: 90, y: 50 }} controls={[{ x: 30, y: 20 }, { x: 90, y: 30 }]} />);
export const invalidConnector = () => inFigure(<Connector from={{ x: 10, y: 20 }} to={{ x: 90, y: 50 }} via={[{ x: 90, y: 20 }]} controls={[{ x: 30, y: 20 }, { x: 90, y: 30 }]} />);
export const boxCoordinates = () => inPanel(<DiagramBox x={20} y={30} width={100} height={60} label="operation" tex="T" />);
export const placements = () => JSON.stringify({ anchor: boxAnchor({ x: 20, y: 30, width: 100, height: 60 }, "right", 0.25), row: diagramRow([{ width: 20, height: 10 }, { width: 40, height: 15 }], 10, 20, 5), column: diagramColumn([{ width: 20, height: 10 }, { width: 40, height: 15 }], 10, 20, 5) });

export const horizontalOnlyAxes = () => inPanel(<PlotAxes xName="t" yName="y" yAxis={false} xTicks={[0, 5]} yTicks={[1, 2]} />);
export const axesFormatters = () => JSON.stringify([tickText([0.5])(0.5), tickText([0, 0.25, 0.5])(0.25), tickText([-2, 0, 2])(-2), niceTicks(1, 1, 4)]);
export const invalidTickBounds = () => JSON.stringify(niceTicks(NaN, 1, 4));
export const invalidAnchor = () => JSON.stringify(boxAnchor({ x: 0, y: 0, width: 100, height: 50 }, "top", 1.1));

export const diagramGroup = () => inFigure(<DiagramGroup x={20} y={30} width={200} height={100} label="two operations"><DiagramBox x={40} y={50} width={120} height={60} tex="T" /></DiagramGroup>);
