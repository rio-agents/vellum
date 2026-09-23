// Renders the examples: `pnpm examples`. The rendered SVGs are committed so the
// docs can show them, and the tests check they match a fresh render.
/** @type {import("./src/build/index.ts").VellumConfig} */
export default {
  sources: "examples",
  output: "examples/rendered",
};
