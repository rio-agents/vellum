import React, { createContext, useContext, type ReactNode } from "react";
import type { FigureTheme, TextRole, Tone } from "./types.ts";
import { defaultTheme } from "./default-theme.ts";

const ThemeContext = createContext<FigureTheme>(defaultTheme);

export interface ThemeProviderProps {
  theme?: FigureTheme;
  children?: ReactNode;
}

export function ThemeProvider({ theme = defaultTheme, children }: ThemeProviderProps) {
  return React.createElement(ThemeContext.Provider, { value: theme }, children);
}

export function useTheme(): FigureTheme {
  return useContext(ThemeContext);
}

export function resolveTone(tone: Tone, theme: FigureTheme): string {
  switch (tone) {
    case "ink":
      return theme.color.ink;
    case "muted":
      return theme.color.muted;
    case "faint":
      return theme.color.faint;
    case "accent":
      return theme.color.accent;
    case "accentSubtle":
      return theme.color.accentSubtle;
    case "surface":
      return theme.color.surface;
    case "background":
      return theme.color.background;
    case "border":
      return theme.color.border;
    case "series1":
      return theme.color.series[0] ?? theme.color.ink;
    case "series2":
      return theme.color.series[1] ?? theme.color.ink;
    case "series3":
      return theme.color.series[2] ?? theme.color.ink;
    case "series4":
      return theme.color.series[3] ?? theme.color.ink;
    case "series5":
      return theme.color.series[4] ?? theme.color.ink;
    case "series6":
      return theme.color.series[5] ?? theme.color.ink;
  }
}

export function resolveFontSize(size: TextRole | undefined, defaultRole: TextRole, theme: FigureTheme): number {
  return theme.text[size ?? defaultRole];
}
