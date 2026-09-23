import path from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import type { FigureDefinition } from "../define.ts";
import type { FigureAssetPlan } from "../render/assets.ts";
import type { VellumConfig } from "./config.ts";
import type { FigureSource } from "./sources.ts";
import type { ManifestRecord } from "./manifest.ts";

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Bundles are written under the library's own node_modules so that they resolve
// React from the library's dependencies wherever the library is installed.
const cacheDir = path.resolve(srcDir, "../node_modules/.cache/vellum-render");

/** One rendered definition: its manifest records and the text of each SVG file. */
export interface RenderedFigure {
  id: string;
  source: string;
  definition: FigureDefinition<any, any, any>;
  records: Record<string, ManifestRecord>;
  files: Map<string, string>;
}

interface BundledFigure {
  definition: FigureDefinition<any, any, any>;
  plans: () => FigureAssetPlan[];
  fileName: (asset: string, layout: string, primary: boolean) => string;
  interactive: () => boolean;
  animated: () => boolean;
  render: (plan: FigureAssetPlan, layout: string) => string;
}

/** The module esbuild bundles for one definition: the definition plus everything needed to render it. */
function entryModule(root: string, source: string, config: VellumConfig): string {
  const theme = config.theme
    ? `import { ${config.theme.export} as theme } from ${JSON.stringify(path.resolve(root, config.theme.module))};`
    : `import { defaultTheme as theme } from ${JSON.stringify(path.join(srcDir, "theme/default-theme.ts"))};`;
  return [
    `import figure from ${JSON.stringify(path.resolve(root, source))};`,
    `import { renderToSvgString } from ${JSON.stringify(path.join(srcDir, "render/server.ts"))};`,
    `import { planFigureAssets, figureAssetFile, isInteractive, isAnimated } from ${JSON.stringify(path.join(srcDir, "render/assets.ts"))};`,
    theme,
    `export const definition = figure;`,
    `export const plans = () => planFigureAssets(figure);`,
    `export const fileName = figureAssetFile;`,
    `export const interactive = () => isInteractive(figure);`,
    `export const animated = () => isAnimated(figure);`,
    `export const render = (plan, layout) =>`,
    `  renderToSvgString(figure, {`,
    `    theme,`,
    `    params: plan.params,`,
    `    layout,`,
    `    asset: plan.asset,`,
    `    embedControlMath: ${Boolean(config.embedControlMath)} && layout === plan.layouts[0],`,
    `  });`,
  ].join("\n");
}

/**
 * Bundles the given definitions in one esbuild pass and renders every asset and
 * layout they plan. Each definition's id must equal its file's stem.
 */
export async function renderFigureSources(
  root: string,
  sources: FigureSource[],
  config: VellumConfig
): Promise<RenderedFigure[]> {
  const workDir = path.join(cacheDir, `${process.pid}-${Date.now()}`);
  const entryDir = path.join(workDir, "entries");
  await mkdir(entryDir, { recursive: true });

  try {
    const entryPoints: string[] = [];
    for (const { source, stem } of sources) {
      const entry = path.join(entryDir, `${stem}.ts`);
      await writeFile(entry, entryModule(root, source, config));
      entryPoints.push(entry);
    }

    await esbuild.build({
      entryPoints,
      absWorkingDir: root,
      bundle: true,
      splitting: true,
      platform: "node",
      format: "esm",
      outdir: path.join(workDir, "out"),
      external: ["react", "react-dom", "react-dom/*", "react/jsx-runtime", "react/jsx-dev-runtime"],
      logLevel: "silent",
    });

    const results: RenderedFigure[] = [];
    for (const { source, stem } of sources) {
      const mod = (await import(pathToFileURL(path.join(workDir, "out", `${stem}.js`)).href)) as BundledFigure;
      const { definition } = mod;
      if (!definition?.id) throw new Error(`${source} must default-export defineFigure({ id, ... }).`);
      if (definition.id !== stem) {
        throw new Error(`Figure id "${definition.id}" must match the file name stem "${stem}" in ${source}.`);
      }

      const records: Record<string, ManifestRecord> = {};
      const files = new Map<string, string>();
      for (const plan of mod.plans()) {
        records[plan.asset] = {
          figure: plan.figure,
          ...(plan.variant ? { variant: plan.variant, params: plan.params } : {}),
          source,
          layouts: plan.layouts,
          interactive: mod.interactive(),
          animated: mod.animated(),
        };
        for (const layout of plan.layouts) {
          files.set(mod.fileName(plan.asset, layout, layout === plan.layouts[0]), mod.render(plan, layout) + "\n");
        }
      }
      results.push({ id: definition.id, source, definition, records, files });
    }
    return results;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
