import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { importFixture } from "./bundle-fixture.ts";
import { defineFigure } from "../src/define.ts";
import { param } from "../src/params/schema.ts";
import { planFigureAssets, figureAssetFile, figureSvgId } from "../src/render/assets.ts";

type LayoutsFixture = {
  staged: Parameters<typeof planFigureAssets>[0];
  seen: { layout: string; width: number; stage: number }[];
  render: (options: Record<string, unknown>) => string;
};
let fixture: LayoutsFixture;

before(async () => {
  fixture = await importFixture<LayoutsFixture>("layouts");
});

const bare = (overrides: Record<string, unknown> = {}) =>
  defineFigure({
    id: "demo-figure",
    description: "demo",
    layouts: { wide: { width: 720, height: 300 } },
    params: { stage: param.number({ default: 1, min: 1, max: 3, step: 1, hidden: true }) },
    render: () => null,
    ...overrides,
  } as Parameters<typeof defineFigure>[0]);

describe("planFigureAssets", () => {
  it("plans one asset per definition, with its declared layouts", () => {
    assert.deepEqual(planFigureAssets(bare()), [{ asset: "demo-figure", figure: "demo-figure", layouts: ["wide"] }]);
    assert.deepEqual(planFigureAssets(fixture.staged).map((plan) => plan.layouts), [
      ["wide", "compact"],
      ["wide", "compact"],
    ]);
  });

  it("plans one asset per variant and no bare asset", () => {
    assert.deepEqual(
      planFigureAssets(fixture.staged).map(({ asset, variant, params }) => ({ asset, variant, params })),
      [
        { asset: "staged-demo--stage-1", variant: "stage-1", params: { stage: 1 } },
        { asset: "staged-demo--stage-3", variant: "stage-3", params: { stage: 3 } },
      ]
    );
  });

  it("rejects names that would make `--` ambiguous", () => {
    assert.throws(() => planFigureAssets(bare({ id: "demo--figure" })), /lowercase words joined by single hyphens/);
    assert.throws(() => planFigureAssets(bare({ variants: { "Stage 1": { stage: 1 } } })), /variant "Stage 1"/);
  });

  it("rejects variants that set undeclared parameters or values the sanitizer would change", () => {
    assert.throws(() => planFigureAssets(bare({ variants: { a: { phase: 1 } } })), /undeclared parameter "phase"/);
    assert.throws(() => planFigureAssets(bare({ variants: { a: { stage: 5 } } })), /would change to 3/);
    assert.throws(() => planFigureAssets(bare({ variants: { a: { stage: 1.5 } } })), /"stage" to 1.5/);
    assert.throws(() => planFigureAssets(bare({ variants: {} })), /empty `variants`/);
  });

  it("names files and SVG ID prefixes by asset and layout, with the primary layout unsuffixed", () => {
    assert.equal(figureAssetFile("a--b", "wide", true), "a--b.svg");
    assert.equal(figureAssetFile("a--b", "compact", false), "a--b.compact.svg");
    assert.equal(figureSvgId("a--b", "wide", true), "a--b");
    assert.equal(figureSvgId("a--b", "compact", false), "a--b--compact");
  });

  it("accepts any layout names, taking the first as primary", () => {
    const plans = planFigureAssets(bare({ layouts: { page: { width: 400, height: 300 }, slide: { width: 960, height: 540 } } }));
    assert.deepEqual(plans[0].layouts, ["page", "slide"]);
    assert.throws(() => planFigureAssets(bare({ layouts: {} })), /declares no layouts/);
    assert.throws(() => planFigureAssets(bare({ layouts: { "Wide Page": { width: 1, height: 1 } } })), /layout "Wide Page"/);
  });
});

describe("Layout rendering", () => {
  it("tells render which layout it draws and sizes the SVG to match", () => {
    fixture.seen.length = 0;
    const wide = fixture.render({ asset: "staged-demo--stage-3", params: { stage: 3 } });
    const compact = fixture.render({ asset: "staged-demo--stage-3", params: { stage: 3 }, layout: "compact" });
    assert.deepEqual(fixture.seen, [
      { layout: "wide", width: 720, stage: 3 },
      { layout: "compact", width: 340, stage: 3 },
    ]);
    assert.match(wide, /viewBox="0 0 720 300"[^>]*data-layout="wide"/);
    assert.match(compact, /viewBox="0 0 340 420"[^>]*data-layout="compact"/);
    assert.match(compact, /stage 3/);
  });

  it("scopes every SVG ID to the asset and layout", () => {
    const compact = fixture.render({ asset: "staged-demo--stage-1", params: { stage: 1 }, layout: "compact" });
    const ids = [...compact.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(ids.length > 0);
    for (const id of ids) assert.ok(id.startsWith("staged-demo--stage-1--compact-"), id);
    assert.match(compact, /marker-end="url\(#staged-demo--stage-1--compact-arrow-accent\)"/);
    const refs = [...compact.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
    for (const ref of refs) assert.ok(ids.includes(ref), `reference ${ref} resolves inside this SVG`);
  });
});
