import { figureAssetFile } from "../render/assets.ts";

/** One asset's entry in `manifest.json`. */
export interface ManifestRecord {
  figure: string;
  variant?: string;
  params?: Record<string, unknown>;
  /** Source file of the definition, relative to the project root. */
  source: string;
  /** Layout names in declaration order; the first is the primary layout. */
  layouts: string[];
  interactive: boolean;
  animated: boolean;
}

/** `manifest.json`: every generated asset, keyed by asset name and sorted. */
export type Manifest = Record<string, ManifestRecord>;

export const MANIFEST_FILE = "manifest.json";

/** The SVG files a manifest record owns, in layout order. */
export function recordFiles(asset: string, record: Pick<ManifestRecord, "layouts">): string[] {
  return record.layouts.map((layout, index) => figureAssetFile(asset, layout, index === 0));
}
