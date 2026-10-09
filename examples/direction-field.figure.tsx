import React from "react";
import {
  defineFigure,
  Figure,
  Panel,
  Axes,
  Grid,
  SlopeField,
  SolutionCurve,
  Contour,
  LevelRegion,
  DragHandle,
  Probe,
  Line,
  MathLabel,
  param,
} from "@rio-agents/vellum";

// A direction field in a framed panel, with a draggable initial point. The
// zero isocline (where the slope is 0) is drawn, and the region where
// solutions rise is shaded. Hovering shows the field's slope at the cursor.
const rate = (x: number, y: number) => x - y;
const area = { x: 44, y: 24, width: 412, height: 236 };
const ticks = [-3, -2, -1, 0, 1, 2, 3];

export default defineFigure({
  id: "direction-field",
  description: "The direction field of y' = x - y with the solution through a draggable initial point, the zero isocline y = x, and the region below it, where solutions rise, shaded.",
  layouts: { main: { width: 480, height: 290 } },
  params: {
    start: param.point({ label: "Initial point", labelKind: "text", default: [-2, 2], bounds: { x: [-3, 3], y: [-3, 3] }, step: 0.05 }),
  },
  render: ({ params }) => (
    <Figure>
      <Panel area={area} x={[-3, 3]} y={[-3, 3]} clip>
        <LevelRegion fn={rate} tone="series1" fillOpacity={0.08} />
        <Grid ticksX={ticks} ticksY={ticks} />
        <Contour fn={rate} levels={0} tone="series1" />
        <SlopeField slope={rate} columns={19} rows={11} />
        <SolutionCurve rate={rate} through={params.start} />
      </Panel>
      <Panel area={area} x={[-3, 3]} y={[-3, 3]}>
        <Axes frame ticksX={ticks} ticksY={ticks} showTickLabels tickFormatX={String} tickFormatY={String} xLabel="x" yLabel="y" />
        <Probe sets="start">
          {(at) => at && <Line point={at} direction={[1, rate(at[0], at[1])]} tone="ink" weight="hairline" />}
        </Probe>
        <DragHandle param="start" />
        <MathLabel tex={String.raw`y' = x - y`} x={area.x + 8} y={area.y + 8} anchor="nw" size="label" halo />
      </Panel>
    </Figure>
  ),
});
