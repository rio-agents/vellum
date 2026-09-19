import React, { type CSSProperties, useState, useEffect } from "react";
import { resolveTex, loadClientTex } from "./tex-resolver.ts";
import type { TexSvgResult } from "./tex.ts";
import { computeBoxOffset, type Anchor } from "./anchor.ts";
import { useFrameSafe } from "../scene/frame-context.ts";
import { useTheme, resolveTone, resolveFontSize, type Tone, type TextRole } from "../theme/index.ts";

export interface MathLabelProps {
  tex: string;
  at?: [number, number];
  x?: number;
  y?: number;
  anchor?: Anchor;
  offset?: [number, number];
  tone?: Tone | string;
  fontSize?: number | TextRole;
  size?: number | TextRole;
  display?: boolean;
  allowOverlap?: boolean;
  style?: CSSProperties;
  className?: string;
}

export function MathLabel({
  tex,
  at,
  x,
  y,
  anchor = "center",
  offset = [0, 0],
  tone = "ink",
  fontSize,
  size: propSize,
  display = false,
  allowOverlap = false,
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

  const size = resolveFontSize(propSize ?? fontSize, "math", theme);
  const toneColor = resolveTone(tone, theme);

  let targetX = x ?? 0;
  let targetY = y ?? 0;

  if (at) {
    if (frame) {
      const [px, py] = frame.toPx(at);
      targetX = px;
      targetY = py;
    } else {
      targetX = at[0];
      targetY = at[1];
    }
  } else if (frame && x !== undefined && y !== undefined) {
    const [px, py] = frame.toPx([x, y]);
    targetX = px;
    targetY = py;
  }

  targetX += offset[0];
  targetY += offset[1];

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

  return (
    <g
      className={`webnotes-math-label ${className ?? ""}`.trim()}
      data-label-text={tex}
      data-allow-overlap={allowOverlap ? "true" : undefined}
      transform={`translate(${finalX}, ${finalY})`}
      style={{ color: toneColor, fill: "currentColor", ...style }}
    >
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
