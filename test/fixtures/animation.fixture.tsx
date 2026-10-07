import React from "react";
import { defineFigure } from "../../src/define.ts";
import { param } from "../../src/params/schema.ts";
import { renderToSvgString } from "../../src/render/server.ts";
import { Figure } from "../../src/scene/Figure.tsx";

export function seenFrames() {
  const seen: { time: number; derived: number; value: number }[] = [];
  const definition = defineFigure({
    id: "animation-fixture", description: "animation",
    layouts: { wide: { width: 100, height: 100 }, compact: { width: 80, height: 120 } },
    params: { elapsed: param.time({ default: 2, duration: 5 }) },
    derive: ({ elapsed }) => ({ doubled: elapsed * 2 }),
    render: ({ time, params, derived }) => {
      seen.push({ time, derived: derived.doubled, value: params.elapsed });
      return <Figure>{null}</Figure>;
    },
  });
  renderToSvgString(definition);
  renderToSvgString(definition, { layout: "compact", params: { elapsed: 3 } });
  renderToSvgString(definition, { params: { elapsed: 9 } });
  return seen;
}
