import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  MANIFEST_FILE,
  checkFigureIntegrity,
  findFigureSources,
  loadConfig,
  renderFigureSources,
  type FigureSource,
  type Manifest,
  type RenderedFigure,
  type VellumConfig,
} from "../src/build/index.ts";

// The examples are the library's reference figures. Their rendered SVGs are
// committed (`pnpm examples`) so the docs can show them.
const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("Examples", () => {
  let config: VellumConfig;
  let sources: FigureSource[];
  let rendered: RenderedFigure[];

  before(async () => {
    config = await loadConfig(packageDir);
    sources = await findFigureSources(packageDir, config.sources);
    rendered = await renderFigureSources(packageDir, sources, config);
  });

  it("match their committed renders", async () => {
    const outputDir = path.join(packageDir, config.output);
    const manifest: Manifest = JSON.parse(await readFile(path.join(outputDir, MANIFEST_FILE), "utf8"));
    const files = (await readdir(outputDir)).filter((file) => file.endsWith(".svg"));
    const expected: Manifest = Object.assign({}, ...rendered.map((figure) => figure.records));
    assert.deepEqual(checkFigureIntegrity({ sources, manifest, files, expected }), [], 'run "pnpm examples"');
    for (const figure of rendered) {
      for (const [file, svg] of figure.files) {
        assert.equal(await readFile(path.join(outputDir, file), "utf8"), svg, `${file} is stale; run "pnpm examples"`);
      }
    }
  });
});
