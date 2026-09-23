import React from "react";
import { defineFigure, Figure, Panel, Rect, Label } from "../../../../src/index.ts";

/** A bare figure with two freely named layouts; `page` is primary because it comes first. */
export default defineFigure({
  id: "demo-bars",
  description: "Two bars.",
  layouts: { page: { width: 400, height: 200 }, slide: { width: 960, height: 540 } },
  render: ({ size, layout }) => (
    <Figure>
      <Panel area={{ x: 20, y: 20, width: size.width - 40, height: size.height - 40 }} x={[0, 2]} y={[0, 1]}>
        <Rect from={[0.2, 0]} to={[0.8, 0.6]} tone="ink" fillOpacity={1} />
        <Rect from={[1.2, 0]} to={[1.8, 0.9]} tone="accent" />
      </Panel>
      <Label text={layout} x={size.width / 2} y={12} />
    </Figure>
  ),
});
