import { describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  checkFigureIntegrity,
  findFigureSources,
  parseArgs,
  planAssetUpdate,
  renderCommand,
  renderFigureSources,
  type ManifestRecord,
  type VellumConfig,
} from "../src/build/index.ts";

const project = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/project");

const record = (figure: string, layouts = ["wide"], extra: Record<string, unknown> = {}): ManifestRecord => ({
  figure,
  ...extra,
  source: `src/figures/t/${figure}.figure.tsx`,
  layouts,
  interactive: false,
  animated: false,
});

describe("Figure asset integrity", () => {
  const sources = [
    { source: "src/figures/t/alpha.figure.tsx", stem: "alpha" },
    { source: "src/figures/t/beta.figure.tsx", stem: "beta" },
  ];
  const manifest = {
    alpha: record("alpha", ["wide", "compact"]),
    "beta--one": record("beta", ["wide"], { variant: "one", params: { stage: 1 } }),
  };
  const files = ["alpha.svg", "alpha.compact.svg", "beta--one.svg"];

  it("accepts a consistent set", () => {
    assert.deepEqual(checkFigureIntegrity({ sources, manifest, files, expected: manifest }), []);
  });

  it("reports a deleted source", () => {
    const problems = checkFigureIntegrity({ sources: sources.slice(0, 1), manifest, files });
    assert.ok(problems.includes('manifest record "beta--one" has no source figure "beta"'), problems.join("\n"));
  });

  it("reports missing and extra SVG files", () => {
    const problems = checkFigureIntegrity({ sources, manifest, files: ["alpha.svg", "beta--one.svg", "gamma.svg"] });
    assert.ok(problems.includes('missing file alpha.compact.svg for manifest record "alpha"'));
    assert.ok(problems.includes("extra file gamma.svg has no manifest record"));
  });

  it("reports stale and missing manifest records", () => {
    const expected = { alpha: record("alpha", ["wide"]), "beta--two": record("beta") };
    const problems = checkFigureIntegrity({ sources, manifest, files, expected });
    assert.ok(problems.includes('manifest record "alpha" is stale'));
    assert.ok(problems.includes('manifest is missing "beta--two"'));
    assert.ok(problems.includes('manifest record "beta--one" is stale'));
    const missingFigure = checkFigureIntegrity({ sources: [...sources, { source: "x", stem: "gamma" }], manifest, files });
    assert.ok(missingFigure.includes('figure "gamma" has no manifest record'));
  });

  it("reports duplicate figure ids", () => {
    const problems = checkFigureIntegrity({
      sources: [...sources, { source: "src/figures/u/alpha.figure.tsx", stem: "alpha" }],
      manifest,
      files,
    });
    assert.ok(problems.includes('duplicate figure id "alpha" (src/figures/u/alpha.figure.tsx)'));
  });

  it("replaces only the rendered figure's assets in a targeted render", () => {
    const rendered = [
      {
        id: "beta",
        records: { "beta--two": record("beta", ["wide"], { variant: "two", params: { stage: 2 } }) },
        files: new Map([["beta--two.svg", "<svg/>\n"]]),
      },
    ];
    const update = planAssetUpdate({ manifest, files, rendered, full: false });
    assert.deepEqual(Object.keys(update.manifest), ["alpha", "beta--two"]);
    assert.deepEqual([...update.writes.keys()], ["beta--two.svg"]);
    assert.deepEqual(update.deletes, ["beta--one.svg"]);
  });

  it("drops everything not rendered in a full render", () => {
    const rendered = [{ id: "alpha", records: { alpha: manifest.alpha }, files: new Map() }];
    const update = planAssetUpdate({ manifest, files: [...files, "orphan.svg"], rendered, full: true });
    assert.deepEqual(Object.keys(update.manifest), ["alpha"]);
    assert.deepEqual(update.deletes, ["beta--one.svg", "orphan.svg"]);
  });
});


describe("Rendering a project", () => {
  const config: VellumConfig = { sources: "figures", output: "out" };

  it("writes the primary layout as <asset>.svg and every other layout with its name", async () => {
    const sources = await findFigureSources(project, config.sources);
    assert.deepEqual(sources.map((s) => s.stem), ["demo-bars", "staged-steps"]);
    const [bars] = await renderFigureSources(project, sources.slice(0, 1), config);
    assert.deepEqual([...bars.files.keys()], ["demo-bars.svg", "demo-bars.slide.svg"]);
    assert.deepEqual(bars.records["demo-bars"].layouts, ["page", "slide"]);
    assert.match(bars.files.get("demo-bars.svg")!, /viewBox="0 0 400 200"[^>]*data-layout="page"/);
    assert.match(bars.files.get("demo-bars.slide.svg")!, /viewBox="0 0 960 540"[^>]*data-layout="slide"/);
    // Without a configured theme, colors come from the library's theme.
    assert.match(bars.files.get("demo-bars.svg")!, /fill="#1c1b18"/);
  });

  it("renders one asset per variant with the variant's parameters", async () => {
    const sources = (await findFigureSources(project, config.sources)).filter((s) => s.stem === "staged-steps");
    const [staged] = await renderFigureSources(project, sources, config);
    assert.deepEqual(Object.keys(staged.records), ["staged-steps--step-1", "staged-steps--step-3"]);
    assert.deepEqual(staged.records["staged-steps--step-3"].params, { step: 3 });
    assert.match(staged.files.get("staged-steps--step-3.svg")!, />step 3</);
  });

  it("uses the theme a project names", async () => {
    const sources = (await findFigureSources(project, config.sources)).filter((s) => s.stem === "demo-bars");
    const [bars] = await renderFigureSources(project, sources, { ...config, theme: { module: "theme.ts", export: "printTheme" } });
    assert.match(bars.files.get("demo-bars.svg")!, /fill="#000000"/);
  });

  it("runs `vellum render` end to end from a config file, then a targeted render", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "vellum-render-"));
    try {
      await writeFile(
        path.join(dir, "vellum.config.mjs"),
        `export default { sources: ${JSON.stringify(path.join(project, "figures"))}, output: "out" };\n`
      );
      // A file no source produces any more is deleted by a full render.
      await mkdir(path.join(dir, "out"));
      await writeFile(path.join(dir, "out/stale.svg"), "");
      await renderCommand(dir, []);
      const files = (await readdir(path.join(dir, "out"))).sort();
      assert.deepEqual(files, [
        "demo-bars.slide.svg",
        "demo-bars.svg",
        "manifest.json",
        "staged-steps--step-1.svg",
        "staged-steps--step-3.svg",
      ]);
      const manifest = JSON.parse(await readFile(path.join(dir, "out/manifest.json"), "utf8"));
      assert.deepEqual(Object.keys(manifest), ["demo-bars", "staged-steps--step-1", "staged-steps--step-3"]);

      await renderCommand(dir, ["staged-steps--step-1"]);
      const again = JSON.parse(await readFile(path.join(dir, "out/manifest.json"), "utf8"));
      assert.deepEqual(again, manifest, "a targeted render leaves the other figures' records alone");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("The vellum command line", () => {
  it("reads targets and an optional config file", () => {
    assert.deepEqual(parseArgs(["render"]), { targets: [], configFile: undefined });
    assert.deepEqual(parseArgs(["render", "a", "b--c"]), { targets: ["a", "b--c"], configFile: undefined });
    assert.deepEqual(parseArgs(["render", "--config", "x.mjs", "a"]), { targets: ["a"], configFile: "x.mjs" });
    assert.equal(parseArgs(["draw"]), null);
    assert.equal(parseArgs([]), null);
  });
});
