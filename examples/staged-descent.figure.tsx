import React from "react";
import { defineFigure, Figure, Panel, Curve, Point, Line, MathLabel, param } from "@rio-agents/vellum";

// One definition, several fixed settings: each variant renders as its own asset
// (staged-descent--step-1, ...), and each asset in two layouts.
const loss = (w: number) => 0.5 * (w - 1) * (w - 1) + 0.2;
const iterates = [3, 2.2, 1.56, 1.25]; // w_{k+1} = w_k - 0.4 * loss'(w_k)

export default defineFigure({
  id: "staged-descent",
  description: "Gradient descent on a parabola, showing the iterates up to the chosen step.",
  layouts: { wide: { width: 560, height: 240 }, narrow: { width: 320, height: 240 } },
  params: { step: param.number({ default: 1, min: 1, max: 3, step: 1, hidden: true }) },
  variants: { "step-1": { step: 1 }, "step-3": { step: 3 } },
  render: ({ params, size }) => (
    <Figure>
      <Panel area={{ x: 20, y: 20, width: size.width - 40, height: size.height - 50 }} x={[-0.5, 3.4]} y={[0, 3.4]}>
        <Line from={[-0.5, 0]} to={[3.4, 0]} tone="border" />
        <Curve fn={loss} tone="ink" weight="bold" />
        {iterates.slice(0, params.step + 1).map((w, k) => (
          <Point key={k} at={[w, loss(w)]} radius={4.5} tone={k === params.step ? "accent" : "muted"} />
        ))}
        <MathLabel tex={`w_{${params.step}}`} at={[iterates[params.step], loss(iterates[params.step])]} anchor="s" offset={[0, -10]} tone="accent" />
      </Panel>
      <MathLabel tex={`k=${params.step}`} x={size.width / 2} y={size.height - 14} anchor="center" tone="muted" />
    </Figure>
  ),
});
