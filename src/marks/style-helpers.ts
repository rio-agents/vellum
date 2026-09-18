import type { FigureTheme, Tone } from "../theme/types.ts";
import { resolveTone } from "../theme/context.ts";

export type Weight = "hairline" | "regular" | "bold" | number;
export type Dash = "solid" | "dashed" | "dotted" | string;

export function resolveWeight(weight: Weight | undefined, theme: FigureTheme): number {
  if (typeof weight === "number") return weight;
  switch (weight) {
    case "hairline":
      return theme.stroke.hairline;
    case "bold":
      return theme.stroke.bold;
    case "regular":
    default:
      return theme.stroke.regular;
  }
}

export function resolveDash(dash: Dash | undefined): string | undefined {
  if (!dash || dash === "solid") return undefined;
  if (dash === "dashed") return "6 4";
  if (dash === "dotted") return "2 3";
  return dash;
}
