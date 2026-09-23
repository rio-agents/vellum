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
import { isInteractive } from "../src/render/assets.ts";
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
  assert(cached, "texCache contains harvested entry");
  assert.equal(cached.viewBox, "0 -683 950 700");
  assert.equal(cached.widthEm, 0.95);
  assert.equal(cached.heightEm, 0.7);
});

test("interactivity: unique mounted control IDs across multiple instances with identical parameter names", async () => {
  const root = process.cwd().endsWith("packages/figures")
    ? path.resolve(process.cwd(), "../..")
    : process.cwd();
  const tempDir = path.join(root, ".astro/figures-interactive-test");
  await fs.promises.mkdir(tempDir, { recursive: true });
  const tempBundle = path.join(tempDir, "unique-controls-test.bundle.mjs");

  const entryContent = `
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { Controls, defineFigure, param } from "@webnotes/figures";

    export function runTest() {
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
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { "data-instance": "1" },
            React.createElement(Controls, {
              definition: def1,
              params: { s1: 1, active: true, mode: "a" },
              set: () => {},
            })
          ),
          React.createElement(
            "div",
            { "data-instance": "2" },
            React.createElement(Controls, {
              definition: def2,
              params: { s1: 2, active: false, mode: "b" },
              set: () => {},
            })
          )
        )
      );

      const idx1 = fullHtml.indexOf('data-instance="1">');
      const idx2 = fullHtml.indexOf('data-instance="2">');
      const html1 = fullHtml.slice(idx1, idx2);
      const html2 = fullHtml.slice(idx2);

      return { html1, html2 };
    }
  `;

  try {
    await esbuild.build({
      stdin: {
        contents: entryContent,
        resolveDir: root,
        loader: "tsx",
        sourcefile: "virtual-unique-controls.tsx",
      },
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
    const { html1, html2 } = mod.runTest();

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
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test("interactivity: server render uses shared parameter sanitizer identical to client", async () => {
  const root = process.cwd().endsWith("packages/figures")
    ? path.resolve(process.cwd(), "../..")
    : process.cwd();
  const tempDir = path.join(root, ".astro/figures-interactive-test");
  await fs.promises.mkdir(tempDir, { recursive: true });
  const tempBundle = path.join(tempDir, "server-params-test.bundle.mjs");

  const entryContent = `
    import { renderToSvgString } from "@webnotes/figures/render/server";
    import { defineFigure, param } from "@webnotes/figures";

    export function runTest() {
      let serverParamsSeen = null;
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
  `;

  try {
    await esbuild.build({
      stdin: {
        contents: entryContent,
        resolveDir: root,
        loader: "ts",
        sourcefile: "virtual-server-params.ts",
      },
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
    const serverParams = mod.runTest();

    assert.equal(serverParams.num, 5);
    assert.equal(serverParams.flag, true);
    assert.equal(serverParams.choice, "a");
    assert.deepEqual(serverParams.pt, [2, -3]);
    assert.equal(serverParams.t, 10);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});
