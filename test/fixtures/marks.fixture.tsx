import React, { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "../../src/render/server.ts";
import { Figure } from "../../src/scene/Figure.tsx";
import { Panel } from "../../src/scene/Panel.tsx";
import { Axes } from "../../src/marks/Axes.tsx";
import { Label } from "../../src/text/Label.tsx";
import { MathLabel } from "../../src/text/MathLabel.tsx";
import { Point } from "../../src/marks/Point.tsx";
import { Line } from "../../src/marks/Line.tsx";
import { Arrow } from "../../src/marks/Arrow.tsx";
import { Rect } from "../../src/marks/Rect.tsx";

/** Renders children directly in the figure, outside any panel. */
function inFigure(children: ReactNode): string {
  return renderToStaticMarkup(<Figure size={{ width: 600, height: 300 }}>{children}</Figure>);
}

/** Renders children inside a 400 x 200 panel at (100, 50) with domain [0, 10] x [0, 5]. */
function inPanel(children: ReactNode): string {
  return renderToStaticMarkup(
    <Figure size={{ width: 600, height: 300 }}>
      <Panel area={{ x: 100, y: 50, width: 400, height: 200 }} x={[0, 10]} y={[0, 5]}>
        {children}
      </Panel>
    </Figure>
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
