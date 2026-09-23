import React from "react";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { useFigureScope } from "../scene/Figure.tsx";

export const STANDARD_TONES: Tone[] = [
  "ink",
  "muted",
  "faint",
  "accent",
  "accentSubtle",
  "series1",
  "series2",
  "series3",
  "series4",
  "series5",
  "series6",
];

/** Arrowhead marker IDs are scoped to one SVG so a hidden sibling SVG never supplies them. */
export function arrowMarkerId(figureId: string, tone: Tone): string {
  return `${figureId}-arrow-${tone}`;
}

export function MarkerDefs() {
  const theme = useTheme();
  const { id: figureId } = useFigureScope();

  return (
    <>
      {STANDARD_TONES.map((tone) => (
        <marker
          key={tone}
          id={arrowMarkerId(figureId, tone)}
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 0 1.5 L 12 6 L 0 10.5 z" fill={resolveTone(tone, theme)} />
        </marker>
      ))}
    </>
  );
}
