import React, { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "../../src/render/server.ts";
import { Figure } from "../../src/scene/Figure.tsx";
import { Panel } from "../../src/scene/Panel.tsx";
import { Axes } from "../../src/marks/Axes.tsx";
import { Label } from "../../src/text/Label.tsx";
import { MathLabel } from "../../src/text/MathLabel.tsx";

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
