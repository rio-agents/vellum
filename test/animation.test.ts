import test from "node:test";
import assert from "node:assert/strict";
import { PlaybackClock, type FrameScheduler, type PlaybackState } from "../src/animate/clock.ts";
import { easing, stageProgress, lerpMatrix2 } from "../src/animate/interpolate.ts";
import { transformPoint2, transformVector2, transformPoints2 } from "../src/math/transform.ts";
import { affine2 } from "../src/math/linalg.ts";
import { defineFigure } from "../src/define.ts";
import { param, resolveDefaultParams } from "../src/params/index.ts";
import { isAnimated, isInteractive } from "../src/render/assets.ts";
import { importFixture } from "./bundle-fixture.ts";

function harness(options: { time?: number; duration?: number; loop?: boolean } = {}) {
  let now = 0;
  let id = 0;
  const pending = new Map<number, (timestamp: number) => void>();
  const states: PlaybackState[] = [];
  const scheduler: FrameScheduler = {
    now: () => now,
    request: (callback) => { pending.set(++id, callback); return id; },
    cancel: (key) => { pending.delete(key); },
  };
  const clock = new PlaybackClock({ time: options.time ?? 0, duration: options.duration ?? 4,
    loop: options.loop, scheduler, onChange: (state) => states.push(state) });
  return { clock, states, pending,
    tick(milliseconds: number) {
      now += milliseconds;
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) callback(now);
    },
  };
}

test("playback uses elapsed time across irregular frames and preserves exact endpoints", () => {
  const h = harness();
  h.clock.play();
  h.tick(250);
  h.tick(1250);
  assert.equal(h.clock.snapshot.time, 1.5);
  h.tick(3000);
  assert.equal(h.clock.snapshot.time, 4);
  assert.equal(h.clock.snapshot.playing, false);
  assert.equal(h.pending.size, 0);
  h.clock.play();
  assert.equal(h.clock.snapshot.time, 0);
});

test("pause, seek, and speed changes preserve continuity without cumulative frame error", () => {
  const h = harness();
  h.clock.play(); h.tick(1000);
  h.clock.setSpeed(2); h.tick(500);
  assert.equal(h.clock.snapshot.time, 2);
  h.clock.pause(); h.tick(9000);
  assert.equal(h.clock.snapshot.time, 2);
  h.clock.seek(0.5); h.clock.play(); h.tick(500);
  assert.equal(h.clock.snapshot.time, 1.5);
});

test("suspension cancels frames and resumes without advancing through hidden time", () => {
  const h = harness();
  h.clock.play(); h.tick(1000);
  h.clock.setActive(false);
  assert.equal(h.pending.size, 0);
  h.tick(60000);
  assert.equal(h.clock.snapshot.time, 1);
  assert.equal(h.clock.snapshot.playing, true);
  h.clock.setActive(true); h.tick(500);
  assert.equal(h.clock.snapshot.time, 1.5);
});

test("looping retains overshoot, and disposal cancels all future work", () => {
  const h = harness({ loop: true });
  h.clock.play(); h.tick(9250);
  assert.equal(h.clock.snapshot.time, 1.25);
  h.clock.setLoop(false); h.tick(5000);
  assert.equal(h.clock.snapshot.time, 4);
  h.clock.play();
  h.clock.dispose();
  const delivered = h.states.length;
  h.tick(10000); h.clock.play(); h.clock.seek(2);
  assert.equal(h.states.length, delivered);
  assert.equal(h.pending.size, 0);
  assert.throws(() => new PlaybackClock({ duration: Infinity, time: 0,
    scheduler: { now: () => 0, request: () => 0, cancel: () => {} }, onChange: () => {} }), /duration/);
});

test("transformations apply symmetric and singular matrices literally, without mutating inputs", () => {
  const matrix: [[number, number], [number, number]] = [[1, 1], [1, 1]];
  assert.deepEqual(transformVector2(matrix, [2, -2]), [0, 0]);
  assert.deepEqual(affine2([[1, 0], [0, 1]], matrix), [[1, 1], [1, 1]]);
  const points: [number, number][] = [[1, 2], [-1, 3]];
  assert.deepEqual(transformPoints2([[1, 0], [0, 0]], points), [[1, 0], [-1, 0]]);
  assert.deepEqual(points, [[1, 2], [-1, 3]]);
  assert.deepEqual(transformPoint2(matrix, [1, 0], [3, 4]), [4, 5]);
  assert.deepEqual(transformVector2(matrix, [1, 0]), [1, 1]);
});

test("stages and matrix interpolation reach exact collapse and can have singular intermediate frames", () => {
  const identity: [[number, number], [number, number]] = [[1, 0], [0, 1]];
  const collapse: [[number, number], [number, number]] = [[1, 0], [0, 0]];
  assert.equal(stageProgress(-1, 0, 6), 0);
  assert.equal(stageProgress(8, 0, 6, easing.easeInOut), 1);
  assert.deepEqual(lerpMatrix2(identity, collapse, stageProgress(6, 0, 6)), collapse);
  assert.deepEqual(lerpMatrix2(identity, [[-1, 0], [0, -1]], 0.5), [[0, 0], [0, 0]]);
  assert.throws(() => stageProgress(0, 1, 1), /bounds/);
});

test("time validation rejects competing clocks and sanitizes defaults as well as overrides", () => {
  const base = { id: "clock-test", description: "clock", layouts: { wide: { width: 100, height: 100 } }, render: () => null };
  assert.throws(() => defineFigure({ ...base, params: { a: param.time({ duration: 2, default: 0 }), b: param.time({ duration: 2, default: 0 }) } }), /only one/);
  assert.throws(() => defineFigure({ ...base, params: { t: param.time({ duration: 0, default: 0 }) } }), /positive duration/);
  const schema = { elapsed: param.time({ duration: 5, default: 10 }) };
  assert.deepEqual(resolveDefaultParams(schema), { elapsed: 5 });
  assert.deepEqual(resolveDefaultParams(schema, { elapsed: Infinity }), { elapsed: 5 });
  const definition = defineFigure({ ...base, params: schema });
  assert.equal(isAnimated(definition), true);
  assert.equal(isInteractive(definition), true);
  assert.equal(isAnimated({ ...definition, controls: { hidden: ["elapsed"] } }), false);
  assert.equal(isInteractive({ ...base, params: { point: param.point({ default: [0, 0] }) } }), true);
});

test("static rendering shares the named, sanitized time with derived state and every layout", async () => {
  const { seenFrames } = await importFixture<{ seenFrames: () => { time: number; derived: number; value: number }[] }>("animation");
  assert.deepEqual(seenFrames(), [
    { time: 2, derived: 4, value: 2 },
    { time: 3, derived: 6, value: 3 },
    { time: 5, derived: 10, value: 5 },
  ]);
});
