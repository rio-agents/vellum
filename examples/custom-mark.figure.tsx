import React from "react";
import { defineFigure, Figure, Panel, Axes, useFrame, useTheme, resolveTone, type Tone } from "@rio-agents/vellum";

/**
 * A mark the library does not ship: a stem plot. It reads the enclosing Panel's
 * frame to convert data to pixels and the theme to resolve its tone, exactly as
 * the built-in marks do, then draws plain SVG.
 */
function Stems({ values, tone = "accent" }: { values: [number, number][]; tone?: Tone }) {
  const { toPx } = useFrame();
  const theme = useTheme();
  const color = resolveTone(tone, theme);
  return (
    <g className="stems">
      {values.map(([x, y]) => {
        const [px, py] = toPx([x, y]);
        const [, baseline] = toPx([x, 0]);
        return (
          <g key={x}>
            <line x1={px} y1={baseline} x2={px} y2={py} stroke={color} strokeWidth={theme.stroke.regular} />
            <circle cx={px} cy={py} r={4} fill={color} />
          </g>
        );
      })}
    </g>
  );
}

const pmf: [number, number][] = [0, 1, 2, 3, 4].map((k) => {
  const choose = [1, 4, 6, 4, 1][k];
  return [k, choose / 16];
});

export default defineFigure({
  id: "custom-mark",
  description: "The binomial distribution with four trials and success probability one half, drawn as a stem plot.",
  layouts: { main: { width: 400, height: 240 } },
  render: () => (
    <Figure>
      <Panel area={{ x: 40, y: 20, width: 330, height: 180 }} x={[-0.5, 4.5]} y={[0, 0.42]}>
        <Axes
          origin={[-0.5, 0]}
          ticksX={[0, 1, 2, 3, 4]}
          ticksY={[1 / 16, 4 / 16, 6 / 16]}
          showTickLabels
          tickFormatY={(p) => `${Math.round(p * 16)}/16`}
          xLabel="k"
        />
        <Stems values={pmf} />
      </Panel>
    </Figure>
  ),
});
