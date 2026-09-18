import React from "react";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";

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

export function getArrowMarkerId(tone: Tone | string = "ink"): string {
  const safeTone = tone.replace(/[^a-zA-Z0-9_-]/g, "");
  return `fig-arrow-${safeTone}`;
}

export function getArrowMarkerUrl(tone: Tone | string = "ink"): string {
  return `url(#${getArrowMarkerId(tone)})`;
}

export function MarkerDefs() {
  const theme = useTheme();

  return (
    <>
      {STANDARD_TONES.map((tone) => (
        <marker
          key={tone}
          id={getArrowMarkerId(tone)}
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
