import type { TexSvgResult } from "./tex.ts";
import { getClientTexToSvg } from "./tex-client.ts";

export type TexResolverFn = (tex: string, options?: { display?: boolean }) => TexSvgResult;

let syncTexResolver: TexResolverFn | null = null;

export const texCache = new Map<string, TexSvgResult>();

export function registerSyncTexResolver(fn: TexResolverFn): void {
  syncTexResolver = fn;
}

export function getSyncTexResolver(): TexResolverFn | null {
  return syncTexResolver;
}

export function makeCacheKey(tex: string, display = false): string {
  return `${display ? "D" : "I"}:${tex}`;
}

export function resolveTex(tex: string, options: { display?: boolean } = {}): TexSvgResult | null {
  const display = options.display ?? false;
  const key = makeCacheKey(tex, display);
  const cached = texCache.get(key);
  if (cached) return cached;

  if (syncTexResolver) {
    const res = syncTexResolver(tex, { display });
    texCache.set(key, res);
    return res;
  }

  return null;
}

export async function loadClientTex(
  tex: string,
  options: { display?: boolean } = {}
): Promise<TexSvgResult> {
  const display = options.display ?? false;
  const key = makeCacheKey(tex, display);
  const cached = texCache.get(key);
  if (cached) return cached;

  const clientTexToSvg = await getClientTexToSvg();
  const res = clientTexToSvg(tex, { display });
  texCache.set(key, res);
  return res;
}

export function harvestMathFromSvg(container: ParentNode): void {
  const labelGroups = container.querySelectorAll(".webnotes-math-label");
  for (const g of labelGroups) {
    const tex = g.getAttribute("data-label-text");
    if (!tex) continue;
    const display = g.getAttribute("data-display") === "true";
    const key = makeCacheKey(tex, display);
    if (texCache.has(key)) continue;

    const svg = g.querySelector("svg");
    if (!svg) continue;

    const viewBox = svg.getAttribute("viewBox") ?? "0 0 0 0";
    const vbParts = viewBox.split(/\s+/).map(Number);
    const vbWidth = vbParts[2] || 0;
    const vbHeight = vbParts[3] || 0;
    const widthEm = vbWidth > 0 ? vbWidth / 1000 : 1;
    const heightEm = vbHeight > 0 ? vbHeight / 1000 : 1;

    texCache.set(key, {
      svg: svg.outerHTML,
      inner: svg.innerHTML,
      viewBox,
      widthEm,
      heightEm,
      depthEm: 0,
      widthEx: 0,
      heightEx: 0,
      depthEx: 0,
    });
  }
}
