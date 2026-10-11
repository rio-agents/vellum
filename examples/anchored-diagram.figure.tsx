import React from "react";
import { defineFigure, Figure, DiagramBox, Connector, boxAnchor, diagramRow } from "../src/index.ts";
const boxes = diagramRow([{ width: 120, height: 70 }, { width: 120, height: 70 }], 20, 30, 80);
export default defineFigure({
  id: "anchored-diagram",
  description: "Two operations joined at explicit box anchors.",
  layouts: { main: { width: 360, height: 140 } },
  render: () => <Figure>
  <DiagramBox {...boxes[0]} label="input" tex="x" tone="series1"/>
  <DiagramBox {...boxes[1]} label="output" tex="T(x)" tone="series3"/>
  <Connector from={boxAnchor(boxes[0], "right")} to={boxAnchor(boxes[1], "left")}/>
 </Figure>,
});
