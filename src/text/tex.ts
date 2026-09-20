import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG as SvgOutput } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";
import { LiteElement } from "mathjax-full/js/adaptors/lite/Element.js";

export interface TexSvgResult {
  svg: string;
  inner: string;
  viewBox: string;
  widthEm: number;
  heightEm: number;
  depthEm: number;
  widthEx: number;
  heightEx: number;
  depthEx: number;
}

// Initialize MathJax liteAdaptor once
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const texInput = new TeX({ packages: AllPackages });
const svgOutput = new SvgOutput({ fontCache: "none" });
const mathDocument = mathjax.document("", {
  InputJax: texInput,
  OutputJax: svgOutput,
});

const cache = new Map<string, TexSvgResult>();

const EX_TO_EM = 0.442;

export function texToSvg(tex: string, options: { display?: boolean } = {}): TexSvgResult {
  const display = options.display ?? false;
  const cacheKey = `${display ? "D" : "I"}:${tex}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const node = mathDocument.convert(tex, { display });
  const svgNode = adaptor.firstChild(node);
  if (!svgNode || !(svgNode instanceof LiteElement)) {
    throw new Error(`MathJax failed to convert TeX: ${tex}`);
  }

  const viewBox = (adaptor.getAttribute(svgNode, "viewBox") as string) || "0 0 0 0";
  const widthAttr = (adaptor.getAttribute(svgNode, "width") as string) || "0ex";
  const heightAttr = (adaptor.getAttribute(svgNode, "height") as string) || "0ex";
  const styleAttr = (adaptor.getAttribute(svgNode, "style") as string) || "";

  const widthEx = parseFloat(widthAttr.replace("ex", "")) || 0;
  const heightEx = parseFloat(heightAttr.replace("ex", "")) || 0;

  // Extract vertical-align depth
  let depthEx = 0;
  const vMatch = styleAttr.match(/vertical-align:\s*(-?[\d.]+)ex/);
  if (vMatch) {
    depthEx = Math.abs(parseFloat(vMatch[1]));
  }

  // Parse viewBox [minX, minY, width, height]
  const vbParts = viewBox.split(/\s+/).map(Number);
  const vbWidth = vbParts[2] || 0;
  const vbHeight = vbParts[3] || 0;

  // In MathJax, 1000 units = 1 em
  const widthEm = vbWidth > 0 ? vbWidth / 1000 : widthEx * EX_TO_EM;
  const heightEm = vbHeight > 0 ? vbHeight / 1000 : heightEx * EX_TO_EM;
  const depthEm = depthEx * EX_TO_EM;

  const inner = adaptor.innerHTML(svgNode);
  const svg = adaptor.outerHTML(svgNode);

  const result: TexSvgResult = {
    svg,
    inner,
    viewBox,
    widthEm,
    heightEm,
    depthEm,
    widthEx,
    heightEx,
    depthEx,
  };

  cache.set(cacheKey, result);
  return result;
}
