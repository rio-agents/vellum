import type { FigureTheme } from "./types.ts";

export const defaultTheme: FigureTheme = {
  // An earthy palette on cream paper. Series, in order: slate, brick, olive,
  // ochre, umber, sea sage.
  color: {
    ink: "#211a12",
    muted: "#6f6457",
    faint: "#958979",
    accent: "#687b57",
    accentSubtle: "#eef0e8",
    surface: "#fffdf8",
    background: "#f6f0e6",
    border: "#ded5c5",
    series: [
      "#3d6a8a",
      "#a84a32",
      "#6b7a2c",
      "#b07f1f",
      "#7a5a3a",
      "#49755f",
    ],
  },
  font: {
    sans: 'system-ui, -apple-system, "Inter", sans-serif',
    serif: '"Source Serif 4", Georgia, serif',
    math: '"Latin Modern Roman", "Computer Modern Serif", "CMU Serif", "STIX Two Text", Georgia, serif',
  },
  text: {
    title: 15,
    label: 13,
    tick: 11,
    caption: 12,
    math: 13.5,
    symbol: 30,
  },
  stroke: {
    hairline: 1,
    regular: 1.5,
    bold: 2.5,
  },
  space: {
    labelOffset: 8,
    tickLength: 5,
  },
  opacity: {
    cloud: 0.45,
    fill: 0.1,
    faded: 0.25,
  },
};
