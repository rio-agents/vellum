import test from "node:test";
import assert from "node:assert/strict";
import { MATH_CORE_VERSION } from "../src/math/index.ts";

test("packages/figures placeholder test", () => {
  assert.equal(MATH_CORE_VERSION, "0.0.1");
});
