import type { TexSvgResult } from "./tex.ts";

let serverTexToSvg: ((tex: string, options?: { display?: boolean }) => TexSvgResult) | null = null;

export async function getClientTexToSvg(): Promise<(tex: string, options?: { display?: boolean }) => TexSvgResult> {
  if (serverTexToSvg) return serverTexToSvg;
  const mod = await import("./tex.ts");
  serverTexToSvg = mod.texToSvg;
  return serverTexToSvg;
}
