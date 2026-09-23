import path from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

/**
 * What `vellum render` reads from a project's `vellum.config.mjs`. Paths are
 * relative to the project root, the folder that holds the config file.
 */
export interface VellumConfig {
  /** Folder searched recursively for `<id>.figure.tsx` definitions. */
  sources: string;
  /** Folder that receives the generated SVG files and `manifest.json`. */
  output: string;
  /** The theme to render with: a module and the name it exports. Defaults to the library's theme. */
  theme?: { module: string; export: string };
  /**
   * Embed each asset's control-label TeX, hidden, in its primary layout, for pages
   * that hydrate controls and want to reuse the rendered math.
   */
  embedControlMath?: boolean;
}

export const CONFIG_FILE = "vellum.config.mjs";

/** Loads `vellum.config.mjs` from the project root, or from an explicit path. */
export async function loadConfig(root: string, file = CONFIG_FILE): Promise<VellumConfig> {
  const configPath = path.resolve(root, file);
  if (!existsSync(configPath)) {
    throw new Error(`No ${CONFIG_FILE} in ${root}. Create one that default-exports { sources, output }.`);
  }
  const config = (await import(pathToFileURL(configPath).href)).default as VellumConfig;
  if (!config?.sources || !config?.output) {
    throw new Error(`${configPath} must default-export an object with \`sources\` and \`output\` folders.`);
  }
  return config;
}
