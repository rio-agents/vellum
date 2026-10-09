import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scalarSolution } from "../src/math/ode.ts";
import { contourLines, levelRegionPolygons } from "../src/math/level-sets.ts";

const signedArea = (polygon: [number, number][]) =>
  polygon.reduce((sum, [x1, y1], i) => {
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    return sum + (x1 * y2 - x2 * y1) / 2;
  }, 0);

describe("scalarSolution", () => {
  it("follows y' = y through (0, 1) to e at x = 1 and 1/e at x = -1, in increasing x", () => {
    const points = scalarSolution({ rate: (_x, y) => y, through: [0, 1], x: [-1, 1] });
    const xs = points.map(([x]) => x);
    assert.deepEqual(xs, [...xs].sort((a, b) => a - b));
    assert.ok(Math.abs(points[0][1] - Math.exp(-1)) < 1e-9);
    assert.ok(Math.abs(points[points.length - 1][1] - Math.E) < 1e-9);
  });

  it("stops one step after leaving the y interval, as for y' = y² blowing up at x = 1", () => {
    const points = scalarSolution({ rate: (_x, y) => y * y, through: [0, 1], x: [0, 2], y: [-1, 10], direction: "forward" });
    const last = points[points.length - 1];
    assert.ok(last[1] > 10 && last[0] < 1, `last point ${last}`);
    assert.ok(points.slice(0, -1).every(([, y]) => y <= 10));
  });

  it("draws only one side when asked", () => {
    const forward = scalarSolution({ rate: () => 1, through: [0, 0], x: [-1, 1], direction: "forward" });
    assert.deepEqual(forward[0], [0, 0]);
    assert.ok(forward.every(([x]) => x >= 0));
  });
});

describe("contourLines", () => {
  it("traces the unit circle as one closed loop", () => {
    const lines = contourLines({ fn: (x, y) => x * x + y * y, level: 1, x: [-2, 2], y: [-2, 2], columns: 60, rows: 60 });
    assert.equal(lines.length, 1);
    const [loop] = lines;
    assert.deepEqual(loop[0], loop[loop.length - 1]);
    for (const [x, y] of loop) assert.ok(Math.abs(Math.hypot(x, y) - 1) < 0.01);
  });

  it("traces a straight level line as one open polyline across the region", () => {
    const lines = contourLines({ fn: (x, y) => y - 0.5 * x, level: 0.1, x: [-1, 1], y: [-1, 1], columns: 20, rows: 20 });
    assert.equal(lines.length, 1);
    const [line] = lines;
    assert.notDeepEqual(line[0], line[line.length - 1]);
    for (const [x, y] of line) assert.ok(Math.abs(y - 0.5 * x - 0.1) < 1e-9);
  });
});

describe("levelRegionPolygons", () => {
  it("fills the unit disk with counterclockwise pieces of total area close to π", () => {
    const pieces = levelRegionPolygons({ fn: (x, y) => 1 - x * x - y * y, level: 0, x: [-2, 2], y: [-2, 2], columns: 80, rows: 80 });
    assert.ok(pieces.every((p) => signedArea(p) > 0));
    const area = pieces.reduce((sum, p) => sum + signedArea(p), 0);
    assert.ok(Math.abs(area - Math.PI) < 0.01, `area ${area}`);
  });

  it("fills the complementary side with side = below", () => {
    const above = levelRegionPolygons({ fn: (x) => x, level: 0, x: [-1, 1], y: [0, 1], columns: 10, rows: 4 });
    const below = levelRegionPolygons({ fn: (x) => x, level: 0, x: [-1, 1], y: [0, 1], columns: 10, rows: 4, side: "below" });
    const total = (ps: [number, number][][]) => ps.reduce((sum, p) => sum + signedArea(p), 0);
    assert.ok(Math.abs(total(above) - 1) < 1e-9);
    assert.ok(Math.abs(total(below) - 1) < 1e-9);
  });
});
