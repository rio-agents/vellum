import type { FigureTheme } from "./types.ts";

export const defaultTheme: FigureTheme = {
  color: {
    ink: "#1c1b18",
    muted: "#68665e",
    faint: "#9a978d",
    accent: "#9a5436",
    accentSubtle: "#f4ece6",
    surface: "#ffffff",
    background: "#fafaf7",
    border: "#deded6",
    series: [
      "#2f6fb0",
      "#c0602f",
      "#00897b",
      "#b88a1a",
      "#9a4f9c",
      "#3f7a26",
    ],
  },
  font: {
    sans: 'system-ui, -apple-system, "Inter", sans-serif',
    serif: '"Source Serif 4", Georgia, serif',
  },
  text: {
    eyebrow: 12,
    title: 15,
    label: 13,
    tick: 11,
    caption: 12,
    math: 13.5,
  },
  stroke: {
    hairline: 1,
    regular: 1.5,
    bold: 2.5,
  },
  space: {
    labelOffset: 8,
    tickLength: 4,
  },
  opacity: {
    cloud: 0.45,
    fill: 0.1,
    faded: 0.25,
  },
};
