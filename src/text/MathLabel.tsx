import React, { type CSSProperties, useState, useEffect } from "react";
import { resolveTex, loadClientTex } from "./tex-resolver.ts";
import type { TexSvgResult } from "./tex.ts";
import { computeBoxOffset, type Anchor } from "./anchor.ts";
import { useFrameSafe } from "../scene/frame-context.ts";
import { placementToPx, type Placement } from "../scene/position.ts";
import { useTheme, resolveTone, resolveFontSize, type Tone, type TextRole } from "../theme/index.ts";
import { HALO_PX } from "./Label.tsx";

export type MathLabelProps = Placement & {
  tex: string;
  anchor?: Anchor;
  /** Pixel nudge applied after placement. */
  offset?: [number, number];
  tone?: Tone;
  size?: TextRole;
  display?: boolean;
  allowOverlap?: boolean;
  /** Outline the text in the figure surface color so it stays legible over marks. */
  halo?: boolean;
  style?: CSSProperties;
  className?: string;
};

export function MathLabel({
  tex,
  at,
  x,
  y,
  anchor = "center",
  offset = [0, 0],
  tone = "ink",
  size: sizeRole,
  display = false,
  allowOverlap = false,
  halo = false,
  style,
  className,
}: MathLabelProps) {
  const theme = useTheme();
  const frame = useFrameSafe();

  const [clientMath, setClientMath] = useState<TexSvgResult | null>(null);

  const initialMath = resolveTex(tex, { display });
  const math = initialMath ?? clientMath;

  useEffect(() => {
    if (!initialMath) {
      loadClientTex(tex, { display })
        .then((res) => setClientMath(res))
        .catch((err) => console.error(`Failed to load MathJax for tex: "${tex}"`, err));
    }
  }, [tex, display, initialMath]);

  const size = resolveFontSize(sizeRole, "math", theme);
  const toneColor = resolveTone(tone, theme);

  const [px, py] = placementToPx("MathLabel", { at, x, y }, frame);
  const targetX = px + offset[0];
  const targetY = py + offset[1];

  if (!math) {
    return (
      <g
        className={`webnotes-math-label ${className ?? ""}`.trim()}
        data-label-text={tex}
        data-display={display ? "true" : undefined}
        data-allow-overlap={allowOverlap ? "true" : undefined}
        transform={`translate(${targetX.toFixed(2)}, ${targetY.toFixed(2)})`}
        style={{ color: toneColor, fill: "currentColor", ...style }}
      />
    );
  }

  const widthPx = math.widthEm * size;
  const heightPx = math.heightEm * size;

  const [boxOffX, boxOffY] = computeBoxOffset(anchor, widthPx, heightPx);

  const finalX = Number((targetX + boxOffX).toFixed(2));
  const finalY = Number((targetY + boxOffY).toFixed(2));
  const roundedW = Number(widthPx.toFixed(2));
  const roundedH = Number(heightPx.toFixed(2));

  // A surface-colored copy of the glyphs, widened by a stroke, sits under
  // the label. MathJax sets its own stroke attributes, so they are rewritten
  // on the copy; the outline width is converted from pixels to glyph units.
  const haloWidth = (2 * HALO_PX * Number(math.viewBox.split(/\s+/)[2])) / roundedW;
  const haloInner = halo
    ? math.inner
        .replaceAll('stroke="currentColor"', `stroke="${theme.color.surface}"`)
        .replaceAll('fill="currentColor"', `fill="${theme.color.surface}"`)
        .replaceAll('stroke-width="0"', `stroke-width="${Number(haloWidth.toFixed(2))}" stroke-linejoin="round"`)
    : undefined;

  return (
    <g
      className={`webnotes-math-label ${className ?? ""}`.trim()}
      data-label-text={tex}
      data-allow-overlap={allowOverlap ? "true" : undefined}
      transform={`translate(${finalX}, ${finalY})`}
      style={{ color: toneColor, fill: "currentColor", ...style }}
    >
      {haloInner && (
        <svg
          width={roundedW}
          height={roundedH}
          viewBox={math.viewBox}
          overflow="visible"
          style={{ display: "block" }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: haloInner }}
        />
      )}
      <svg
        width={roundedW}
        height={roundedH}
        viewBox={math.viewBox}
        overflow="visible"
        style={{ display: "block" }}
        dangerouslySetInnerHTML={{ __html: math.inner }}
      />
    </g>
  );
}
