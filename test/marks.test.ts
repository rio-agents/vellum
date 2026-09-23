import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { importFixture } from "./bundle-fixture.ts";

type Fixture = Record<string, () => string>;
let fixture: Fixture;

before(async () => {
  fixture = await importFixture<Fixture>("marks");
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

const tag = (markup: string, name: string) => {
  const element = markup.match(new RegExp(`<${name}\\b[^>]*>`))?.[0];
  assert.ok(element, `<${name}> is rendered`);
  return (attr: string) => element.match(new RegExp(` ${attr}="([^"]*)"`))?.[1];
};

describe("Coordinate rule", () => {
  it("reads scalar x/y as figure pixels, inside or outside a panel", () => {
    for (const markup of [fixture.labelPixelsInPanel(), fixture.labelPixelsInFigure()]) {
      assert.equal(attribute(markup, "px", "x"), "40");
      assert.equal(attribute(markup, "px", "y"), "20");
    }
    const point = tag(fixture.pointPixelsInPanel(), "circle");
    assert.equal(point("cx"), "40");
    assert.equal(point("cy"), "20");
    const line = tag(fixture.linePixelsInPanel(), "line");
    assert.deepEqual(["x1", "y1", "x2", "y2"].map(line), ["10", "20", "30", "40"]);
    const arrow = tag(fixture.arrowPixelsInFigure(), "line");
    assert.deepEqual(["x1", "y1", "x2", "y2"].map(arrow), ["10", "20", "30", "40"]);
  });

  it("reads tuples as panel data and adds offset in pixels", () => {
    // (5, 4) is pixel (300, 90); the offset moves it 3 px right and 2 px up.
    assert.equal(attribute(fixture.labelDataInPanel(), "data", "x"), "303");
    assert.equal(attribute(fixture.labelDataInPanel(), "data", "y"), "88");
  });

  it("rejects data coordinates outside a panel, naming the pixel alternative", () => {
    assert.throws(fixture.labelDataInFigure, /Label: .*need an enclosing <Panel>; use `x`\/`y`/);
    assert.throws(fixture.mathDataInFigure, /MathLabel: .*<Panel>/);
    assert.throws(fixture.pointDataInFigure, /Point: .*<Panel>/);
    assert.throws(fixture.lineDataInFigure, /Line: .*`x1`\/`y1`\/`x2`\/`y2`/);
    assert.throws(fixture.arrowDataInFigure, /Arrow: .*<Panel>/);
  });

  it("rejects a label given both forms", () => {
    assert.throws(fixture.labelBothForms, /either `at`.*or `x`\/`y`/);
  });

  it("draws Rect from data corners or a pixel box", () => {
    // Data (2, 1)-(4, 3) spans pixels x 180-260 and y 130-210.
    const corners = tag(fixture.rectCornersInPanel(), "rect");
    assert.deepEqual(["x", "y", "width", "height"].map(corners), ["180", "130", "80", "80"]);
    const pixels = tag(fixture.rectPixelsInFigure(), "rect");
    assert.deepEqual(["x", "y", "width", "height"].map(pixels), ["10", "20", "30", "40"]);
    const outline = tag(fixture.rectOutline(), "rect");
    assert.equal(outline("fill"), "none");
    assert.equal(outline("fill-opacity"), undefined);
  });
});

describe("Panel clipping", () => {
  it("gives every clipped panel its own clip path", () => {
    const markup = fixture.twoClippedPanels();
    const defined = [...markup.matchAll(/<clipPath id="([^"]+)"/g)].map((m) => m[1]);
    const used = [...markup.matchAll(/clip-path="url\(#([^)]+)\)"/g)].map((m) => m[1]);
    assert.equal(new Set(defined).size, 2);
    assert.deepEqual(used, defined);
  });
});
