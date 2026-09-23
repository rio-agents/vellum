import test from "node:test";
import assert from "node:assert/strict";
import { param } from "../src/params/index.ts";
import { defaultFormatNumber } from "../src/controls/format.ts";
import { defineFigure } from "../src/define.ts";
import { isInteractive } from "../src/render/assets.ts";
import { texCache, makeCacheKey, harvestMathFromSvg } from "../src/text/tex-resolver.ts";
import { importFixture } from "./bundle-fixture.ts";

test("interactivity: exposed parameters detection logic", () => {
  const staticDef = defineFigure({
    id: "fig-static",
    description: "static",
    layouts: { wide: { width: 100, height: 100 } },
    render: () => null,
  });
  assert.equal(isInteractive(staticDef), false);

  const hiddenParamDef = defineFigure({
    id: "fig-hidden",
    description: "hidden",
    layouts: { wide: { width: 100, height: 100 } },
    params: {
      seed: param.number({ default: 42, hidden: true }),
    },
    render: () => null,
  });
  assert.equal(isInteractive(hiddenParamDef), false);

  const controlsHiddenDef = defineFigure({
    id: "fig-ctl-hidden",
    description: "ctl hidden",
    layouts: { wide: { width: 100, height: 100 } },
    params: {
      alpha: param.number({ default: 1 }),
    },
    controls: {
      hidden: ["alpha"],
    },
    render: () => null,
  });
  assert.equal(isInteractive(controlsHiddenDef), false);

  const interactiveDef = defineFigure({
    id: "fig-interactive",
    description: "interactive",
    layouts: { wide: { width: 100, height: 100 } },
    params: {
      alpha: param.number({ default: 1 }),
      beta: param.number({ default: 2, hidden: true }),
    },
    render: () => null,
  });
  assert.equal(isInteractive(interactiveDef), true);
});

test("interactivity: number formatting and rounding helper", () => {
  assert.equal(defaultFormatNumber(1.234, 0.01), "1.23");
  assert.equal(defaultFormatNumber(1.2, 0.01), "1.20");
  assert.equal(defaultFormatNumber(42, 1), "42");
  assert.equal(defaultFormatNumber(0.473, 0.001), "0.473");
  assert.equal(defaultFormatNumber(5), "5");
});

test("interactivity: harvestMathFromSvg parses pre-rendered SVG math into texCache", () => {
  const fakeElement = {
    querySelectorAll: (selector: string) => [
      {
        getAttribute: (attr: string) => {
          if (attr === "data-label-text") return "\\sigma_1";
          return null;
        },
        querySelector: (sel: string) => ({
          getAttribute: (attr: string) => {
            if (attr === "viewBox") return "0 -683 950 700";
            return null;
          },
          outerHTML: '<svg viewBox="0 -683 950 700"><g></g></svg>',
          innerHTML: "<g></g>",
        }),
      },
    ],
  } as unknown as ParentNode;

  harvestMathFromSvg(fakeElement);

  const key = makeCacheKey("\\sigma_1", false);
  const cached = texCache.get(key);
  assert(cached, "texCache contains harvested entry");
  assert.equal(cached.viewBox, "0 -683 950 700");
  assert.equal(cached.widthEm, 0.95);
  assert.equal(cached.heightEm, 0.7);
});

test("interactivity: unique mounted control IDs across multiple instances with identical parameter names", async () => {
  const { uniqueControls } = await importFixture<{ uniqueControls: () => { html1: string; html2: string } }>("controls");
  const { html1, html2 } = uniqueControls();

  // Extract all IDs from both rendered instances
  const idRegex = /\bid="([^"]+)"/g;
  const ids1 = [...html1.matchAll(idRegex)].map((m) => m[1]);
  const ids2 = [...html2.matchAll(idRegex)].map((m) => m[1]);

  assert.equal(ids1.length, 3, "Instance 1 has 3 control IDs (slider, toggle, select)");
  assert.equal(ids2.length, 3, "Instance 2 has 3 control IDs (slider, toggle, select)");

  // Assert every ID is unique across both instances
  const allIds = [...ids1, ...ids2];
  const uniqueIds = new Set(allIds);
  assert.equal(uniqueIds.size, allIds.length, "All control IDs across both mounted instances are strictly unique");

  // Assert form name attributes are preserved as the declared parameter keys
  assert.match(html1, /name="s1"/);
  assert.match(html1, /name="active"/);
  assert.match(html1, /name="mode"/);
  assert.match(html2, /name="s1"/);
  assert.match(html2, /name="active"/);
  assert.match(html2, /name="mode"/);

  // Assert correct label-to-control and output-to-control associations
  for (const id of ids1) {
    assert.match(html1, new RegExp(`for="${id}"`), `Instance 1 has label/output associated with id ${id}`);
    assert.doesNotMatch(html2, new RegExp(`for="${id}"`), `Instance 2 does not reference instance 1 id ${id}`);
  }
  for (const id of ids2) {
    assert.match(html2, new RegExp(`for="${id}"`), `Instance 2 has label/output associated with id ${id}`);
    assert.doesNotMatch(html1, new RegExp(`for="${id}"`), `Instance 1 does not reference instance 2 id ${id}`);
  }
});

test("interactivity: server render uses shared parameter sanitizer identical to client", async () => {
  const { serverParams } = await importFixture<{ serverParams: () => Record<string, unknown> }>("controls");
  const seen = serverParams();
  assert.equal(seen.num, 5);
  assert.equal(seen.flag, true);
  assert.equal(seen.choice, "a");
  assert.deepEqual(seen.pt, [2, -3]);
  assert.equal(seen.t, 10);
});
