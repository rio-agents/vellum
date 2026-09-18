export interface FigureTheme {
  color: {
    ink: string;
    muted: string;
    faint: string;
    accent: string;
    accentSubtle: string;
    surface: string;
    background: string;
    border: string;
    series: readonly string[];
  };
  font: {
    sans: string;
    serif: string;
  };
  text: {
    eyebrow: number;
    title: number;
    label: number;
    tick: number;
    caption: number;
    math: number;
  };
  stroke: {
    hairline: number;
    regular: number;
    bold: number;
  };
  space: {
    labelOffset: number;
    tickLength: number;
  };
  opacity: {
    cloud: number;
    fill: number;
    faded: number;
  };
}

export type Tone =
  | "ink"
  | "muted"
  | "faint"
  | "accent"
  | "accentSubtle"
  | "surface"
  | "background"
  | "border"
  | "series1"
  | "series2"
  | "series3"
  | "series4"
  | "series5"
  | "series6";
