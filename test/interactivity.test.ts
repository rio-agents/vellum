import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import {
  param,
  snapToStep,
  clampNumber,
  sanitizeParamValue,
  resolveDefaultParams,
} from "../src/params/index.ts";
import { defaultFormatNumber } from "../src/controls/format.ts";
import { defineFigure } from "../src/define.ts";
import {
  texCache,
  makeCacheKey,
  resolveTex,
  harvestMathFromSvg,
} from "../src/text/tex-resolver.ts";
import { cov2, eig2, cholesky2 } from "../src/math/index.ts";

test("interactivity: manifest correctly flags interactive and static figures", () => {
  const root = process.cwd().endsWith("packages/figures")
    ? path.resolve(process.cwd(), "../..")
    : process.cwd();
  const manifestPath = path.join(root, "notebook/assets/figures/manifest.json");
  assert.ok(fs.existsSync(manifestPath), "manifest.json exists");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // The proof figure must be interactive
  assert.equal(manifest["covariance-ellipse-explorer"]?.interactive, true);

  // All other figures without exposed parameters must be static
  assert.equal(manifest["gaussian-ellipse-axes"]?.interactive, false);
  assert.equal(manifest["gaussian-score"]?.interactive, false);
  assert.equal(manifest["covariance-dependence-patterns"]?.interactive, false);
});

test("interactivity: exposed parameters detection logic", () => {
  function checkInteractive(def: any): boolean {
    return Boolean(
      def.params &&
        Object.entries(def.params).some(
          ([key, p]: [string, any]) => !p?.hidden && !def.controls?.hidden?.includes(key)
        )
    );
  }

  const staticDef = defineFigure({
    id: "fig-static",
    description: "static",
    size: { width: 100, height: 100 },
    render: () => null,
  });
  assert.equal(checkInteractive(staticDef), false);

  const hiddenParamDef = defineFigure({
    id: "fig-hidden",
    description: "hidden",
    size: { width: 100, height: 100 },
    params: {
      seed: param.number({ default: 42, hidden: true }),
    },
    render: () => null,
  });
  assert.equal(checkInteractive(hiddenParamDef), false);

  const controlsHiddenDef = defineFigure({
    id: "fig-ctl-hidden",
    description: "ctl hidden",
    size: { width: 100, height: 100 },
    params: {
      alpha: param.number({ default: 1 }),
    },
    controls: {
      hidden: ["alpha"],
    },
    render: () => null,
  });
  assert.equal(checkInteractive(controlsHiddenDef), false);

  const interactiveDef = defineFigure({
    id: "fig-interactive",
    description: "interactive",
    size: { width: 100, height: 100 },
    params: {
      alpha: param.number({ default: 1 }),
      beta: param.number({ default: 2, hidden: true }),
    },
    render: () => null,
  });
  assert.equal(checkInteractive(interactiveDef), true);
});

test("interactivity: number formatting and rounding helper", () => {
  assert.equal(defaultFormatNumber(1.234, 0.01), "1.23");
  assert.equal(defaultFormatNumber(1.2, 0.01), "1.20");
  assert.equal(defaultFormatNumber(42, 1), "42");
  assert.equal(defaultFormatNumber(0.473, 0.001), "0.473");
  assert.equal(defaultFormatNumber(5), "5");
});

test("interactivity: proof figure covariance-ellipse-explorer reproduces note's example", async () => {
  const root = process.cwd().endsWith("packages/figures")
    ? path.resolve(process.cwd(), "../..")
    : process.cwd();
  const figPath = path.join(
    root,
    "src/figures/probability/covariance-ellipse-explorer.figure.tsx"
  );
  assert.ok(fs.existsSync(figPath), "figure file exists");

  const tempDir = path.join(root, ".astro/figures-interactive-test");
  await fs.promises.mkdir(tempDir, { recursive: true });
  const tempBundle = path.join(tempDir, "covariance-ellipse-explorer.bundle.mjs");

  try {
    await esbuild.build({
      entryPoints: [figPath],
      bundle: true,
      platform: "node",
      format: "esm",
      outfile: tempBundle,
      external: [
        "react",
        "react-dom",
        "react-dom/*",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    });

    const mod = await import(`${pathToFileURL(tempBundle).href}?t=${Date.now()}`);
    const def = mod.default ?? mod;

    assert.equal(def.id, "covariance-ellipse-explorer");
    assert.ok(def.params, "defines params");
    assert.equal(def.params.s1.default, 0.837);
    assert.equal(def.params.s2.default, 0.632);
    assert.equal(def.params.rho.default, 0.473);

    // Derive initial values
    const derived = def.derive({ s1: 0.837, s2: 0.632, rho: 0.473 });
    assert.ok(derived, "derive runs without error");

    // Check reproduced Sigma values: [[0.70, 0.25], [0.25, 0.40]]
    assert.equal(derived.sigma[0][0].toFixed(2), "0.70");
    assert.equal(derived.sigma[0][1].toFixed(2), "0.25");
    assert.equal(derived.sigma[1][0].toFixed(2), "0.25");
    assert.equal(derived.sigma[1][1].toFixed(2), "0.40");

    // Check eigenvalues approx 0.842 and 0.258
    assert.equal(derived.lam1.toFixed(3), "0.842");
    assert.equal(derived.lam2.toFixed(3), "0.258");
    assert.equal(derived.sqrt1.toFixed(2), "0.92");
    assert.equal(derived.sqrt2.toFixed(2), "0.51");

    // Check tilt angle approx 29.5 degrees
    assert.ok(
      Math.abs(derived.angleDeg - 29.5) < 0.5,
      `tilt angle expected ~29.5, got ${derived.angleDeg}`
    );
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
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
  assert.ok(cached, "texCache contains harvested entry");
  assert.equal(cached.viewBox, "0 -683 950 700");
  assert.equal(cached.widthEm, 0.95);
  assert.equal(cached.heightEm, 0.7);
});
