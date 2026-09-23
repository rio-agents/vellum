import React, { type CSSProperties, useState, useEffect } from "react";
import { resolveTex, loadClientTex } from "./tex-resolver.ts";
import type { TexSvgResult } from "./tex.ts";
import { useTheme } from "../theme/index.ts";

export interface InlineTexProps {
  tex: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export function InlineTex({ tex, size = 15, style, className }: InlineTexProps) {
  const theme = useTheme();
  const [clientMath, setClientMath] = useState<TexSvgResult | null>(null);

  const initialMath = resolveTex(tex, { display: false });
  const math = initialMath ?? clientMath;

  useEffect(() => {
    if (!initialMath) {
      loadClientTex(tex, { display: false })
        .then((res) => setClientMath(res))
        .catch((err) => console.error(`Failed to load inline TeX "${tex}":`, err));
    }
  }, [tex, initialMath]);

  if (!math) {
    return <span className={`vellum-inline-tex ${className ?? ""}`.trim()} style={style}>{tex}</span>;
  }

  const widthPx = Number((math.widthEm * size).toFixed(2));
  const heightPx = Number((math.heightEm * size).toFixed(2));

  return (
    <span
      className={`vellum-inline-tex ${className ?? ""}`.trim()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "-0.15em",
        ...style,
      }}
    >
      <svg
        width={widthPx}
        height={heightPx}
        viewBox={math.viewBox}
        overflow="visible"
        style={{ display: "block" }}
        fill="currentColor"
        dangerouslySetInnerHTML={{ __html: math.inner }}
      />
    </span>
  );
}
