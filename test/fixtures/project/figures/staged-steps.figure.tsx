import React from "react";
import { defineFigure, Figure, Label, param } from "../../../../src/index.ts";

/** A staged family: one definition, one asset per variant. */
export default defineFigure({
  id: "staged-steps",
  description: "A step counter.",
  layouts: { main: { width: 200, height: 100 } },
  params: { step: param.number({ default: 1, min: 1, max: 3, step: 1, hidden: true }) },
  variants: { "step-1": { step: 1 }, "step-3": { step: 3 } },
  render: ({ params }) => (
    <Figure>
      <Label text={`step ${params.step}`} x={100} y={50} />
    </Figure>
  ),
});
