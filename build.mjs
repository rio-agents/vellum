import * as esbuild from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pkgDir = path.resolve(import.meta.dirname);
const distDir = path.join(pkgDir, "dist");

await mkdir(distDir, { recursive: true });

// Build the single unified bundle for the package
await esbuild.build({
  entryPoints: [path.join(pkgDir, "src/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  outfile: path.join(distDir, "index.js"),
  external: [
    "react",
    "react-dom",
    "react-dom/*",
    "react/jsx-runtime",
    "react/jsx-dev-runtime",
    "d3-scale",
    "d3-shape",
    "mathjax-full",
    "mathjax-full/*",
  ],
  sourcemap: "inline",
});

// Create subpath re-exports pointing to the unified bundle
const subpaths = [
  "math",
  "theme",
  "render/server",
  "render/client",
];

for (const sub of subpaths) {
  const targetDir = path.join(distDir, path.dirname(sub));
  await mkdir(targetDir, { recursive: true });
  const targetFile = path.join(distDir, `${sub}.js`);
  const relToIndex = path.relative(path.dirname(targetFile), path.join(distDir, "index.js"));
  const importPath = relToIndex.startsWith(".") ? relToIndex : `./${relToIndex}`;
  await writeFile(targetFile, `export * from "${importPath}";\n`, "utf8");
}

console.log("Built @webnotes/figures successfully to packages/figures/dist");
