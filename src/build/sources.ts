import path from "node:path";
import { readdir } from "node:fs/promises";

/** A figure definition file and its stem, which must equal the definition's id. */
export interface FigureSource {
  /** Path relative to the project root. */
  source: string;
  stem: string;
}

export const SOURCE_SUFFIX = ".figure.tsx";

/** Lists every `<id>.figure.tsx` under the sources folder, sorted by path. */
export async function findFigureSources(root: string, sourcesDir: string): Promise<FigureSource[]> {
  const entries = await readdir(path.resolve(root, sourcesDir), { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(SOURCE_SUFFIX))
    .map((entry) => ({
      source: path.relative(root, path.join(entry.parentPath, entry.name)),
      stem: entry.name.slice(0, -SOURCE_SUFFIX.length),
    }))
    .sort((a, b) => a.source.localeCompare(b.source));
}

/** Fails on duplicate stems, which would make figure ids collide. */
export function assertUniqueStems(sources: FigureSource[]): void {
  const seen = new Map<string, string>();
  for (const { source, stem } of sources) {
    const earlier = seen.get(stem);
    if (earlier) throw new Error(`Duplicate figure id "${stem}": ${earlier} and ${source}.`);
    seen.set(stem, source);
  }
}
