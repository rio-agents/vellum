import React from "react";
import { defineFigure, Figure, Rect, Arrow, Label, MathLabel } from "@rio-agents/vellum";

// A diagram in figure pixels, with no Panel: scalar x/y/width/height are pixels,
// so boxes, arrows, and labels are placed directly.
const box = { width: 120, height: 56, y: 52 };
const stages = [
  { x: 20, name: "encoder", tex: String.raw`q_\phi(z\mid x)`, tone: "series1" as const },
  { x: 200, name: "latent", tex: "z", tone: "accent" as const },
  { x: 380, name: "decoder", tex: String.raw`p_\theta(x\mid z)`, tone: "series3" as const },
];

export default defineFigure({
  id: "block-diagram",
  description: "An encoder maps x to a latent z, and a decoder maps z back to a reconstruction of x.",
  layouts: { main: { width: 520, height: 150 } },
  render: () => (
    <Figure>
      {stages.map((stage) => (
        <g key={stage.name}>
          <Rect x={stage.x} y={box.y} width={box.width} height={box.height} tone={stage.tone} fillOpacity={0.12} strokeTone={stage.tone} weight="regular" />
          <MathLabel tex={stage.tex} x={stage.x + box.width / 2} y={box.y + box.height / 2} anchor="center" tone={stage.tone} />
          <Label text={stage.name} x={stage.x + box.width / 2} y={box.y - 14} anchor="center" size="caption" tone="muted" />
        </g>
      ))}
      {[0, 1].map((i) => {
        const from = stages[i].x + box.width;
        const to = stages[i + 1].x;
        return <Arrow key={i} x1={from + 6} y1={box.y + box.height / 2} x2={to - 6} y2={box.y + box.height / 2} tone="ink" />;
      })}
      <MathLabel tex="x" x={80} y={132} anchor="center" tone="muted" />
      <MathLabel tex={String.raw`\hat x`} x={440} y={132} anchor="center" tone="muted" />
    </Figure>
  ),
});
