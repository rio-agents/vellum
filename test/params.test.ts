import test from "node:test";
import assert from "node:assert/strict";
import {
  param,
  snapToStep,
  clampNumber,
  sanitizeParamValue,
  resolveDefaultParams,
} from "../src/params/index.ts";
import { defineFigure } from "../src/define.ts";

test("param builder generates correct types and defaults labelKind to tex", () => {
  const pNum = param.number({ label: "\\sigma_1", min: 0.1, max: 2, step: 0.05, default: 1 });
  assert.equal(pNum.type, "number");
  assert.equal(pNum.labelKind, "tex");
  assert.equal(pNum.default, 1);
  assert.equal(pNum.step, 0.05);

  const pBool = param.boolean({ label: "Show grid", default: true, labelKind: "text" });
  assert.equal(pBool.type, "boolean");
  assert.equal(pBool.labelKind, "text");
  assert.equal(pBool.default, true);

  const pChoice = param.choice({
    label: "Mode",
    options: [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Beta" },
    ],
    default: "a",
  });
  assert.equal(pChoice.type, "choice");
  assert.equal(pChoice.labelKind, "tex");
  assert.equal(pChoice.default, "a");

  const pPoint = param.point({
    label: "\\mathbf{u}",
    default: [1, 0],
    bounds: { x: [-1, 1], y: [-1, 1] },
  });
  assert.equal(pPoint.type, "point");
  assert.equal(pPoint.labelKind, "tex");
  assert.deepEqual(pPoint.default, [1, 0]);

  const pTime = param.time({ duration: 5, default: 0 });
  assert.equal(pTime.type, "time");
  assert.equal(pTime.default, 0);
  assert.equal(pTime.duration, 5);
});

test("snapToStep snaps to grid and handles floating point precision", () => {
  assert.equal(snapToStep(0.24, 0.05, 0), 0.25);
  assert.equal(snapToStep(0.22, 0.05, 0), 0.2);
  assert.equal(snapToStep(0.30000000000000004, 0.1, 0), 0.3);
  assert.equal(snapToStep(1.473, 0.01, 0), 1.47);
});

test("clampNumber clamps between min and max", () => {
  assert.equal(clampNumber(0.5, 1, 2), 1);
  assert.equal(clampNumber(2.5, 1, 2), 2);
  assert.equal(clampNumber(1.5, 1, 2), 1.5);
});

test("sanitizeParamValue clamps and snaps according to config", () => {
  const numConfig = param.number({ min: 0, max: 10, step: 0.5, default: 5 });
  assert.equal(sanitizeParamValue(numConfig, 4.3), 4.5);
  assert.equal(sanitizeParamValue(numConfig, 12), 10);
  assert.equal(sanitizeParamValue(numConfig, -2), 0);
  assert.equal(sanitizeParamValue(numConfig, "invalid"), 5);

  const ptConfig = param.point({
    default: [0, 0],
    bounds: { x: [-2, 2], y: [-1, 1] },
  });
  assert.deepEqual(sanitizeParamValue(ptConfig, [3, -5]), [2, -1]);

  const choiceConfig = param.choice({
    options: [
      { value: "opt1", label: "1" },
      { value: "opt2", label: "2" },
    ],
    default: "opt1",
  });
  assert.equal(sanitizeParamValue(choiceConfig, "opt2"), "opt2");
  assert.equal(sanitizeParamValue(choiceConfig, "invalid"), "opt1");
});

test("resolveDefaultParams extracts and sanitizes initial schema values", () => {
  const schema = {
    x: param.number({ min: 0, max: 10, step: 1, default: 3 }),
    active: param.boolean({ default: false }),
  };
  const defaults = resolveDefaultParams(schema);
  assert.deepEqual(defaults, { x: 3, active: false });

  const overridden = resolveDefaultParams(schema, { x: 8 });
  assert.deepEqual(overridden, { x: 8, active: false });
});

test("defineFigure parameter types flow into derive and render", () => {
  const def = defineFigure({
    id: "typed-test",
    description: "test",
    size: { width: 500, height: 300 },
    params: {
      s1: param.number({ default: 0.837, min: 0.1, max: 2 }),
      tag: param.choice({
        options: [{ value: "first", label: "1" }, { value: "second", label: "2" }],
        default: "first",
      }),
      pos: param.point({ default: [0.5, 0.5] }),
    },
    derive: (p) => {
      // p.s1 is typed as number, p.tag is typed as "first" | "second", p.pos as [number, number]
      const s1Sq: number = p.s1 * p.s1;
      const tagUpper: string = p.tag.toUpperCase();
      const dist: number = Math.hypot(p.pos[0], p.pos[1]);
      return { s1Sq, tagUpper, dist };
    },
    render: ({ params, derived }) => {
      assert.equal(typeof params.s1, "number");
      assert.equal(typeof derived.s1Sq, "number");
      return null;
    },
  });

  assert.equal(def.id, "typed-test");
  const d = def.derive?.({ s1: 2, tag: "second", pos: [3, 4] });
  assert.deepEqual(d, { s1Sq: 4, tagUpper: "SECOND", dist: 5 });
});
