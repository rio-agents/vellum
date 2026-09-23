import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Bundles are written under the package's own node_modules so that the bundled
// code resolves React from the package's dependencies.
const cacheDir = path.join(packageDir, "node_modules/.cache/figure-tests");

/** Bundles a TSX fixture from test/fixtures with esbuild and imports it. */
export async function importFixture<T>(name: string): Promise<T> {
  await mkdir(cacheDir, { recursive: true });
  const outfile = path.join(cacheDir, `${name}-${process.pid}-${Date.now()}.mjs`);
  try {
    await esbuild.build({
      entryPoints: [path.join(packageDir, `test/fixtures/${name}.fixture.tsx`)],
      bundle: true,
      platform: "node",
      format: "esm",
      outfile,
      logLevel: "silent",
      external: ["react", "react-dom", "react-dom/*", "react/jsx-runtime", "react/jsx-dev-runtime"],
    });
    return (await import(pathToFileURL(outfile).href)) as T;
  } finally {
    await rm(outfile, { force: true });
  }
}
