import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slopeSegments } from "../src/math/fields.ts";

const base = {
  x: [0, 4] as [number, number],
  y: [0, 2] as [number, number],
  columns: 4,
  rows: 2,
  length: 10,
  pxPerUnit: { x: 50, y: 100 },
};

describe("slopeSegments", () => {
  it("centers one segment in each grid cell", () => {
    const segments = slopeSegments({ ...base, slope: () => 0 });
    assert.equal(segments.length, 8);
    assert.deepEqual(segments[0].center, [0.5, 0.5]);
    assert.deepEqual(segments.at(-1)!.center, [3.5, 1.5]);
  });

  it("keeps a fixed on-screen length and follows the slope in pixel space", () => {
    for (const m of [0, 0.5, -3, 40]) {
      const [segment] = slopeSegments({ ...base, columns: 1, rows: 1, slope: () => m });
      const dxPx = (segment.to[0] - segment.from[0]) * base.pxPerUnit.x;
      const dyPx = (segment.to[1] - segment.from[1]) * base.pxPerUnit.y;
      assert.ok(Math.abs(Math.hypot(dxPx, dyPx) - base.length) < 1e-9, `length for slope ${m}`);
      const dataSlope = (segment.to[1] - segment.from[1]) / (segment.to[0] - segment.from[0]);
      assert.ok(Math.abs(dataSlope - m) < 1e-9, `tangent for slope ${m}`);
    }
  });

  it("skips filtered points and points with a non-finite slope", () => {
    const filtered = slopeSegments({ ...base, slope: (x) => x, where: (x) => x > 2 });
    assert.deepEqual(filtered.map((s) => s.center[0]), [2.5, 2.5, 3.5, 3.5]);

    const vertical = slopeSegments({ ...base, slope: (x) => (x < 1 ? Infinity : 1) });
    assert.equal(vertical.length, 6);
  });
});
