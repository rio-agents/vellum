import React from "react";
import { renderToSvgString } from "../../src/render/server.ts";
import { defineFigure } from "../../src/define.ts";
import { param } from "../../src/params/schema.ts";
import { Figure } from "../../src/scene/Figure.tsx";
import { Panel } from "../../src/scene/Panel.tsx";
import { Arrow } from "../../src/marks/Arrow.tsx";
import { Label } from "../../src/text/Label.tsx";

export const seen: { layout: string; width: number; stage: number }[] = [];

/** A two-layout, three-stage definition that records what `render` is told. */
export const staged = defineFigure({
  id: "staged-demo",
  description: "A staged demo figure.",
  layouts: { wide: { width: 720, height: 300 }, compact: { width: 340, height: 420 } },
  params: { stage: param.number({ default: 1, min: 1, max: 3, step: 1, hidden: true }) },
  variants: { "stage-1": { stage: 1 }, "stage-3": { stage: 3 } },
  render: ({ layout, size, params }) => {
    seen.push({ layout, width: size.width, stage: params.stage });
    return (
      <Figure>
        <Panel area={{ x: 10, y: 10, width: size.width - 20, height: 100 }} x={[0, 1]} y={[0, 1]} clip>
          <Arrow from={[0, 0]} to={[1, 1]} tone="accent" />
        </Panel>
        <Label text={`stage ${params.stage}`} x={20} y={size.height - 20} />
      </Figure>
    );
  },
});

export const render = (options: Parameters<typeof renderToSvgString>[1]) => renderToSvgString(staged, options);
