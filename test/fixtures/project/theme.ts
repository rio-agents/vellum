import { defaultTheme } from "../../../src/theme/default-theme.ts";
import type { FigureTheme } from "../../../src/theme/types.ts";

/** A theme a project might supply: the default one with pure black ink. */
export const printTheme: FigureTheme = { ...defaultTheme, color: { ...defaultTheme.color, ink: "#000000" } };
