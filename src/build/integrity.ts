import { recordFiles, type Manifest } from "./manifest.ts";
import type { FigureSource } from "./sources.ts";
import type { RenderedFigure } from "./render.ts";

/**
 * Compares a manifest and the generated files on disk with the source set.
 * `sources` lists every figure source ({ source, stem }); `expected`, when given,
 * is the freshly rendered manifest to compare records against.
 */
export function checkFigureIntegrity({
  sources,
  manifest,
  files,
  expected,
}: {
  sources: FigureSource[];
  manifest: Manifest;
  files: string[];
  expected?: Manifest;
}): string[] {
  const problems: string[] = [];
  const stems = new Set(sources.map((s) => s.stem));
  const seenStems = new Set<string>();
  for (const { source, stem } of sources) {
    if (seenStems.has(stem)) problems.push(`duplicate figure id "${stem}" (${source})`);
    seenStems.add(stem);
  }

  const owned = new Set<string>();
  for (const [asset, record] of Object.entries(manifest)) {
    if (!stems.has(record.figure)) problems.push(`manifest record "${asset}" has no source figure "${record.figure}"`);
    for (const file of recordFiles(asset, record)) {
      owned.add(file);
      if (!files.includes(file)) problems.push(`missing file ${file} for manifest record "${asset}"`);
    }
  }
  for (const file of files) {
    if (!owned.has(file)) problems.push(`extra file ${file} has no manifest record`);
  }
  for (const stem of stems) {
    if (!Object.values(manifest).some((record) => record.figure === stem)) {
      problems.push(`figure "${stem}" has no manifest record`);
    }
  }

  if (expected) {
    for (const [asset, record] of Object.entries(expected)) {
      if (!manifest[asset]) problems.push(`manifest is missing "${asset}"`);
      else if (JSON.stringify(manifest[asset]) !== JSON.stringify(record)) problems.push(`manifest record "${asset}" is stale`);
    }
    for (const asset of Object.keys(manifest)) {
      if (!expected[asset]) problems.push(`manifest record "${asset}" is stale`);
    }
  }
  return problems;
}

/**
 * Merges freshly rendered figures into the current manifest. A full render
 * replaces everything; a targeted render replaces only the rendered figures'
 * records and files and leaves every other figure untouched.
 */
export function planAssetUpdate({
  manifest,
  files,
  rendered,
  full,
}: {
  manifest: Manifest;
  files: string[];
  rendered: Pick<RenderedFigure, "id" | "records" | "files">[];
  full: boolean;
}): { manifest: Manifest; writes: Map<string, string>; deletes: string[] } {
  const renderedIds = new Set(rendered.map((figure) => figure.id));
  const next: Manifest = {};
  if (!full) {
    for (const [asset, record] of Object.entries(manifest)) {
      if (!renderedIds.has(record.figure)) next[asset] = record;
    }
  }
  const writes = new Map<string, string>();
  for (const figure of rendered) {
    Object.assign(next, figure.records);
    for (const [file, svg] of figure.files) writes.set(file, svg);
  }
  const sorted = Object.fromEntries(Object.keys(next).sort().map((asset) => [asset, next[asset]]));
  const kept = new Set(Object.entries(sorted).flatMap(([asset, record]) => recordFiles(asset, record)));
  const deletes = files.filter((file) => !kept.has(file));
  return { manifest: sorted, writes, deletes };
}
