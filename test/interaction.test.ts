import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { importFixture } from "./bundle-fixture.ts";

type Fixture = Record<string, () => string>;
let fixture: Fixture;

before(async () => {
  fixture = await importFixture<Fixture>("interaction");
});

describe("Point parameters bound to marks", () => {
  it("draws a static handle as a plain point, with no probe surface", () => {
    const svg = fixture.staticExplorer();
    assert.match(svg, /class="vellum-drag-handle"/);
    assert.doesNotMatch(svg, /tabindex|role="slider"/);
    assert.doesNotMatch(svg, /vellum-probe/);
    assert.match(svg, /data-probe="none"/);
  });

  it("makes a live handle operable and names its point", () => {
    const svg = fixture.liveExplorer();
    assert.match(svg, /role="slider"[^>]*aria-roledescription="draggable point"[^>]*aria-label="Initial point"/);
    assert.match(svg, /aria-valuetext="x 0.50, y −0.25"/);
    assert.match(svg, /tabindex="0"/);
    assert.match(svg, /class="vellum-probe"/);
  });

  it("refuses a handle for an undeclared parameter", () => {
    assert.throws(() => fixture.undeclaredHandle(), /No parameter named "missing"/);
  });
});

describe("ODE and level-set marks", () => {
  it("draws a solution curve, contours, and a filled level region", () => {
    const svg = fixture.staticExplorer();
    assert.match(svg, /class="vellum-solution-curve"[^>]*|<path d="M[^"]+"[^>]*class="vellum-solution-curve"/);
    assert.match(svg, /class="vellum-contour"/);
    assert.match(svg, /class="vellum-level-region"/);
  });
});

describe("Chips bound to choice and boolean parameters", () => {
  it("draws static chips as a legend, with nothing focusable", () => {
    const svg = fixture.staticChips();
    assert.match(svg, /class="vellum-chip-group"/);
    assert.match(svg, /class="vellum-chip-toggle"/);
    assert.doesNotMatch(svg, /tabindex|role="radio"|role="switch"/);
  });

  it("makes live chips a radio group and a switch with their states", () => {
    const svg = fixture.liveChips();
    assert.match(svg, /role="radiogroup" aria-label="Mode"/);
    assert.match(svg, /data-value="b" role="radio" aria-checked="true" aria-label="B" tabindex="0"/);
    assert.match(svg, /data-value="a" role="radio" aria-checked="false" aria-label="A" tabindex="-1"/);
    assert.match(svg, /role="switch" aria-checked="true" aria-label="Grid"/);
  });

  it("keeps in-figure parameters interactive without controls below the figure", () => {
    const { interactive, controls } = JSON.parse(fixture.chippedControls());
    assert.equal(interactive, true);
    assert.equal(controls, "");
  });
});
