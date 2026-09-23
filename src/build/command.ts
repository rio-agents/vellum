import path from "node:path";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { loadConfig } from "./config.ts";
import { findFigureSources, assertUniqueStems } from "./sources.ts";
import { renderFigureSources } from "./render.ts";
import { planAssetUpdate } from "./integrity.ts";
import { MANIFEST_FILE, type Manifest } from "./manifest.ts";

/**
 * `vellum render [figure-or-asset ...]`: renders every asset and layout of the named
 * figures (all figures when none are named) into the configured output folder and
 * updates its manifest. A full render also deletes generated files and records
 * that no source produces any more; a targeted render leaves other figures alone.
 */
export async function renderCommand(root: string, targets: string[], configFile?: string): Promise<void> {
  const config = await loadConfig(root, configFile);
  const outputDir = path.resolve(root, config.output);
  const manifestPath = path.join(outputDir, MANIFEST_FILE);
  await mkdir(outputDir, { recursive: true });

  const sources = await findFigureSources(root, config.sources);
  assertUniqueStems(sources);

  // An asset name `<id>--<variant>` selects its whole figure.
  const full = targets.length === 0;
  const ids = new Set(targets.map((target) => target.split("--")[0]));
  for (const id of ids) {
    if (!sources.some(({ stem }) => stem === id)) throw new Error(`No figure source named "${id}".`);
  }
  const selected = full ? sources : sources.filter(({ stem }) => ids.has(stem));

  let manifest: Manifest = {};
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    manifest = {};
  }
  const files = (await readdir(outputDir)).filter((file) => file.endsWith(".svg"));

  console.log(`Rendering ${selected.length} figure(s)...`);
  const rendered = await renderFigureSources(root, selected, config);
  const update = planAssetUpdate({ manifest, files, rendered, full });

  for (const [file, svg] of update.writes) await writeFile(path.join(outputDir, file), svg, "utf8");
  for (const file of update.deletes) {
    await rm(path.join(outputDir, file));
    console.log(`Deleted stale ${file}`);
  }
  await writeFile(manifestPath, JSON.stringify(update.manifest, null, 2) + "\n", "utf8");
  console.log(`Wrote ${update.writes.size} SVG file(s) for ${rendered.length} figure(s) to ${config.output}.`);
}

const USAGE = `Usage: vellum render [--config <file>] [figure-or-asset ...]

Renders figure definitions (<id>.figure.tsx) to SVG, as configured in
vellum.config.mjs in the current directory.`;

/** Entry point of the `vellum` executable. */
export async function main(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);
  if (!parsed) {
    console.log(USAGE);
    process.exitCode = argv.length === 0 || argv[0] === "--help" ? 0 : 1;
    return;
  }
  await renderCommand(process.cwd(), parsed.targets, parsed.configFile);
}

/** Parses `render [--config <file>] [target ...]`; returns null for anything else. */
export function parseArgs(argv: string[]): { targets: string[]; configFile?: string } | null {
  const [command, ...rest] = argv;
  if (command !== "render") return null;
  const targets: string[] = [];
  let configFile: string | undefined;
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === "--config") configFile = rest[++index];
    else if (!rest[index].startsWith("-")) targets.push(rest[index]);
  }
  return { targets, configFile };
}
