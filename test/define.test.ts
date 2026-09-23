import test from "node:test";
import assert from "node:assert/strict";
import { defineFigure } from "../src/define.ts";

test("defineFigure returns definition unchanged and accepts typed schema", () => {
  const def = defineFigure({
    id: "test-figure",
    description: "test description",
    layouts: { wide: { width: 100, height: 100 } },
    params: {
      a: { type: "number", default: 42 },
    },
    derive: (params) => ({
      doubleA: params.a * 2,
    }),
    render: ({ params, derived, theme, time }) => {
      assert.equal(params.a, 42);
      assert.equal(derived.doubleA, 84);
      return null;
    },
  });

  assert.equal(def.id, "test-figure");
  assert.equal(def.params?.a.default, 42);
  const derived = def.derive?.({ a: 42 });
  assert.deepEqual(derived, { doubleA: 84 });
});
