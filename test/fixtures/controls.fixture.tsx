import { renderToStaticMarkup } from "react-dom/server";
import { defineFigure } from "../../src/define.ts";
import { param } from "../../src/params/schema.ts";
import { Controls } from "../../src/controls/Controls.tsx";
import { renderToSvgString } from "../../src/render/server.ts";

/** Two mounted control sets whose figures declare the same parameter names. */
export function uniqueControls() {
  const def1 = defineFigure({
    id: "fig-copy-1",
    description: "copy 1",
    layouts: { wide: { width: 100, height: 100 } },
    params: {
      s1: param.number({ default: 1, label: "Scale" }),
      active: param.boolean({ default: true, label: "Active" }),
      mode: param.choice({
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
        default: "a",
        label: "Mode",
      }),
    },
    render: () => null,
  });

  const def2 = defineFigure({
    id: "fig-copy-2",
    description: "copy 2",
    layouts: { wide: { width: 100, height: 100 } },
    params: {
      s1: param.number({ default: 2, label: "Scale" }),
      active: param.boolean({ default: false, label: "Active" }),
      mode: param.choice({
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
        default: "b",
        label: "Mode",
      }),
    },
    render: () => null,
  });

  const fullHtml = renderToStaticMarkup(
    <div>
      <div data-instance="1">
        <Controls definition={def1} params={{ s1: 1, active: true, mode: "a" }} set={() => {}} />
      </div>
      <div data-instance="2">
        <Controls definition={def2} params={{ s1: 2, active: false, mode: "b" }} set={() => {}} />
      </div>
    </div>
  );

  const idx1 = fullHtml.indexOf('data-instance="1">');
  const idx2 = fullHtml.indexOf('data-instance="2">');
  const html1 = fullHtml.slice(idx1, idx2);
  const html2 = fullHtml.slice(idx2);

  return { html1, html2 };
}
  

/** The parameters a server render passes to `render` after sanitizing out-of-range input. */
export function serverParams() {
  let serverParamsSeen: Record<string, unknown> | null = null;
  const def = defineFigure({
    id: "server-sanitizer-test",
    description: "test",
    layouts: { wide: { width: 100, height: 100 } },
    params: {
      num: param.number({ min: 1, max: 5, step: 0.5, default: 2 }),
      flag: param.boolean({ default: false }),
      choice: param.choice({
        options: [{ value: "a", label: "A" }, { value: "b", label: "B" }],
        default: "a",
      }),
      pt: param.point({ default: [0, 0], bounds: { x: [-2, 2], y: [-3, 3] } }),
      t: param.time({ default: 0, duration: 10 }),
    },
    render: ({ params }) => {
      serverParamsSeen = { ...params };
      return null;
    },
  });

  renderToSvgString(def, {
    params: {
      num: 8.2, // out of range & unsnapped -> clamps to 5
      flag: 1, // truthy -> true
      choice: "invalid", // invalid -> defaults to "a"
      pt: [10, -10], // out of range -> clamps to [2, -3]
      t: 20, // out of range -> clamps to 10
    },
  });

  return serverParamsSeen;
}
  
