import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const root = process.cwd().endsWith("packages/figures") ? path.resolve(process.cwd(), "../..") : process.cwd();

type Fixture = Record<"tickLabels" | "axisTitles" | "haloText" | "haloMath" | "plainMath", () => string>;
let fixture: Fixture;

before(async () => {
  const outDir = path.join(root, ".astro/figures-marks-test");
  await mkdir(outDir, { recursive: true });
  const outfile = path.join(outDir, `marks-${Date.now()}.mjs`);
  await esbuild.build({
    entryPoints: [path.join(root, "packages/figures/test/fixtures/marks.fixture.tsx")],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    external: ["react", "react-dom", "react-dom/*", "react/jsx-runtime", "react/jsx-dev-runtime"],
  });
  fixture = await import(pathToFileURL(outfile).href);
  await rm(outDir, { recursive: true, force: true });
});

const attribute = (markup: string, labelText: string, name: string) => {
  const element = markup.match(new RegExp(`<[^>]*data-label-text="${labelText}"[^>]*>`))?.[0];
  assert.ok(element, `label "${labelText}" is rendered`);
  return element.match(new RegExp(`${name}="([^"]*)"`))?.[1];
};

// The fixture panel spans pixels (100, 50) to (500, 250) for data [0, 10] x [0, 5].
describe("Axes labels inside a panel", () => {
  it("places tick labels beside their ticks in panel pixels", () => {
    const markup = fixture.tickLabels();
    // x = 5 is pixel 300 on the x-axis at pixel y 250, below a 4 px tick and a 2 px gap.
    assert.equal(attribute(markup, "5", "x"), "300");
    assert.equal(attribute(markup, "5", "y"), "256");
    // y = 4 is pixel 90 on the y-axis at pixel x 100, left of a 4 px tick and a 3 px gap.
    assert.equal(attribute(markup, "4", "x"), "93");
    assert.equal(attribute(markup, "4", "y"), "90");
  });

  it("places axis titles past the ends of the axes", () => {
    const markup = fixture.axisTitles();
    assert.equal(attribute(markup, "time", "x"), "510");
    assert.equal(attribute(markup, "time", "y"), "250");
    assert.equal(attribute(markup, "height", "x"), "100");
    assert.equal(attribute(markup, "height", "y"), "40");
  });
});

describe("Label halos", () => {
  it("outlines a text label in the surface color behind its fill", () => {
    assert.match(fixture.haloText(), /data-label-text="halo"[^>]*stroke="#ffffff"[^>]*stroke-width="6"[^>]*paint-order="stroke"/);
  });

  it("draws a widened surface-colored copy under a math label", () => {
    const markup = fixture.haloMath();
    assert.equal((markup.match(/<svg width/g) ?? []).length, 2, "halo copy plus the label itself");
    assert.match(markup, /stroke="#ffffff" fill="#ffffff" stroke-width="\d+(\.\d+)?" stroke-linejoin="round"/);
    assert.doesNotMatch(fixture.plainMath(), /stroke-linejoin="round"/);
  });
});
