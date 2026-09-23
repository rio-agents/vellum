import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

export const repoRoot = process.cwd().endsWith("packages/figures") ? path.resolve(process.cwd(), "../..") : process.cwd();

/** Bundles a TSX fixture under test/fixtures with esbuild and imports it. */
export async function importFixture<T>(name: string): Promise<T> {
  const outDir = path.join(repoRoot, `.astro/figures-fixture-${name}`);
  await mkdir(outDir, { recursive: true });
  const outfile = path.join(outDir, `${name}-${Date.now()}.mjs`);
  await esbuild.build({
    entryPoints: [path.join(repoRoot, `packages/figures/test/fixtures/${name}.fixture.tsx`)],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    external: ["react", "react-dom", "react-dom/*", "react/jsx-runtime", "react/jsx-dev-runtime"],
  });
  const mod = await import(pathToFileURL(outfile).href);
  await rm(outDir, { recursive: true, force: true });
  return mod as T;
}
