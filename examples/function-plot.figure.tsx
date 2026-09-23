import React from "react";
import { defineFigure, Figure, Panel, Axes, Curve, Area, Point, MathLabel } from "@rio-agents/vellum";

// A plot in data coordinates: a density, the area it assigns to [0, 1], and a marked point.
const density = (x: number) => Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI);

export default defineFigure({
  id: "function-plot",
  description: "The standard normal density, with the area over the interval from 0 to 1 shaded and the peak marked.",
  layouts: { main: { width: 480, height: 280 } },
  render: () => (
    <Figure>
      <Panel area={{ x: 40, y: 30, width: 400, height: 210 }} x={[-3.5, 3.5]} y={[0, 0.45]}>
        <Area fn={density} domain={[0, 1]} baseline={0} tone="accent" fillOpacity={0.2} />
        <Curve fn={density} tone="ink" weight="bold" />
        <Axes origin={[0, 0]} ticksX={[-3, -2, -1, 0, 1, 2, 3]} ticksY={[]} showTickLabels xLabel="x" />
        <Point at={[0, density(0)]} radius={4} tone="accent" />
        <MathLabel tex={String.raw`\varphi(x)=\tfrac{1}{\sqrt{2\pi}}e^{-x^2/2}`} at={[1.2, 0.33]} anchor="w" />
        <MathLabel tex={String.raw`P(0\le X\le 1)`} at={[0.5, 0.12]} anchor="center" tone="accent" size="label" halo />
      </Panel>
    </Figure>
  ),
});
