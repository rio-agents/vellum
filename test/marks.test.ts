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
    // x = 5 is pixel 300 on the x-axis at pixel y 250, below a 5 px tick and a 3 px gap.
    assert.equal(attribute(markup, "5", "x"), "300");
    assert.equal(attribute(markup, "5", "y"), "258");
    // y = 4 is pixel 90 on the y-axis at pixel x 100, left of a 5 px tick and a 5 px gap.
    assert.equal(attribute(markup, "4", "x"), "90");
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
    assert.match(fixture.haloText(), /data-label-text="halo"[^>]*stroke="#fffdf8"[^>]*stroke-width="6"[^>]*paint-order="stroke"/);
  });

  it("draws a surface-colored plate under a math label", () => {
    const markup = fixture.haloMath();
    assert.equal((markup.match(/<svg width/g) ?? []).length, 1, "the label itself, once");
    assert.match(markup, /<rect class="vellum-math-halo"[^>]*fill="#fffdf8"/);
    assert.doesNotMatch(fixture.plainMath(), /vellum-math-halo/);
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

describe("Plot axes", () => {
  it("keeps fractional ticks accurate, including a single tick", () => {
    assert.deepEqual(JSON.parse(fixture.axesFormatters()), ["0.5", "0.25", "−2", [1]]);
    assert.throws(fixture.invalidTickBounds, /finite bounds/);
  });
  it("omits the vertical arrow, ticks, and name for a one-dimensional domain", () => {
    const markup = fixture.horizontalOnlyAxes();
    assert.equal((markup.match(/class="vellum-arrow"/g) ?? []).length, 1);
    assert.match(markup, /data-label-text="t"/);
    assert.doesNotMatch(markup, /data-label-text="(?:y|1|2)"/);
  });
  it("suppresses a numeric label near a symbolic tick and keeps arrow tips", () => {
    const markup = fixture.symbolicAxes();
    assert.match(markup, /data-label-text="b"/);
    assert.doesNotMatch(markup, /data-label-text="5"/);
    assert.equal((markup.match(/class="vellum-arrow"/g) ?? []).length, 2);
  });
  it("uses lower and left edges when zero lies outside the domains", () => {
    const markup = fixture.edgeAxes();
    assert.match(markup, /x1="100" y1="250" x2="500" y2="250"/);
    assert.match(markup, /x1="100" y1="250" x2="100" y2="50"/);
  });
});

describe("Diagram composition", () => {
  it("names a dashed group and retains its child marks", () => {
    const markup = fixture.diagramGroup();
    assert.match(markup, /class="vellum-diagram-group"/);
    assert.match(markup, /data-label-text="two operations"/);
    assert.match(markup, /stroke-dasharray=/);
    assert.match(markup, /class="vellum-diagram-box"/);
    assert.match(markup, /data-label-text="T"/);
  });
  it("keeps diagram coordinates in figure pixels inside a Panel", () => {
    assert.match(fixture.diagramConnector(), /d="M 10 20 L 90 20 L 90 50"/);
    assert.match(fixture.boxCoordinates(), /x="20" y="30" width="100" height="60"/);
  });
  it("draws cubic connectors and rejects ambiguous routes", () => {
    assert.match(fixture.diagramCurve(), /d="M 10 20 C 30 20, 90 30, 90 50"/);
    assert.throws(fixture.invalidConnector, /choose waypoints or curve controls/);
  });
  it("places anchors and rows/columns from explicit geometry", () => {
    assert.throws(fixture.invalidAnchor, /fraction must be between/);
    assert.deepEqual(JSON.parse(fixture.placements()), {
      anchor: { x: 120, y: 45 },
      row: [{ x: 10, y: 20, width: 20, height: 10 }, { x: 35, y: 20, width: 40, height: 15 }],
      column: [{ x: 10, y: 20, width: 20, height: 10 }, { x: 10, y: 35, width: 40, height: 15 }],
    });
  });
});
