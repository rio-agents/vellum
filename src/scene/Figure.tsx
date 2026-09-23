import React, { type ReactNode, type CSSProperties, createContext, useContext } from "react";
import { MarkerDefs } from "../marks/markers.tsx";
import { useTheme } from "../theme/index.ts";
import type { FigureSize } from "../define.ts";

/** What a renderer tells `Figure` about the SVG it is drawing. */
export interface FigureScope {
  /** Prefix for every SVG ID in this drawing; unique per asset and layout. */
  id: string;
  layout: string;
  size: FigureSize;
  description: string;
}

export const FigureScopeContext = createContext<FigureScope | null>(null);

export function useFigureScope(): FigureScope {
  const scope = useContext(FigureScopeContext);
  if (!scope) {
    throw new Error("Figure content must be rendered through renderToSvgString or mountFigure.");
  }
  return scope;
}

export interface FigureProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Figure({ children, className, style }: FigureProps) {
  const { layout, size, description } = useFigureScope();
  const theme = useTheme();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size.width} ${size.height}`}
      role="img"
      aria-label={description}
      data-layout={layout}
      className={`vellum-figure-svg ${className ?? ""}`.trim()}
      // Sizing and visibility belong to the page's CSS, which chooses between layouts.
      style={{ fontFamily: theme.font.sans, ...style }}
    >
      <title>{description}</title>
      <defs>
        <MarkerDefs />
      </defs>
      {children}
    </svg>
  );
}
