import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import * as esbuild from "esbuild";
import { renderToSvgString } from "@webnotes/figures/render/server";
import { siteTheme } from "../../../src/lib/figures/site-theme.ts";

const root = process.cwd();
const figuresDir = path.join(root, "src/figures");
const assetsDir = path.join(root, "notebook/assets/figures");

async function findFigureFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".figure.tsx")) {
      const fullPath = path.join(entry.parentPath ?? (entry as any).path, entry.name);
      files.push(fullPath);
    }
  }
  return files.sort();
}

test("Figures determinism check: in-memory render matches committed SVG", async () => {
  const files = await findFigureFiles(figuresDir);
  if (files.length === 0) return;

  const tempDir = path.join(root, ".astro/figures-determinism-test");
  await mkdir(tempDir, { recursive: true });

  const stale: string[] = [];

  try {
    for (const filePath of files) {
      const fileId = path.basename(filePath).replace(/\.figure\.tsx$/, "");
      const tempBundle = path.join(tempDir, `${fileId}.bundle.mjs`);
      await esbuild.build({
        entryPoints: [filePath],
        bundle: true,
        platform: "node",
        format: "esm",
        outfile: tempBundle,
        external: [
          "react",
          "react-dom",
          "react-dom/*",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "@webnotes/figures",
          "@webnotes/figures/*",
        ],
      });

      const mod = await import(`${pathToFileURL(tempBundle).href}?t=${Date.now()}`);
      const def = mod.default;
      const rendered = renderToSvgString(def, { theme: siteTheme }) + "\n";
      const committedPath = path.join(assetsDir, `${def.id}.svg`);

      let committed: string | null = null;
      try {
        committed = await readFile(committedPath, "utf8");
      } catch {
        committed = null;
      }

      if (!committed || committed !== rendered) {
        stale.push(def.id);
      }

      await rm(tempBundle, { force: true });
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  assert.equal(
    stale.length,
    0,
    `Stale figure SVG(s): ${stale.join(", ")}. Run 'pnpm figures:render' to update committed SVGs.`
  );
});

test("Figures theme test: no un-themed literal colors in committed SVGs", async () => {
  const entries = await readdir(assetsDir);
  const svgFiles = entries.filter((f) => f.endsWith(".svg")).sort();

  assert.ok(svgFiles.length > 0, "No SVG figures found in assets/figures");

  const errors: string[] = [];

  for (const svgFile of svgFiles) {
    const content = await readFile(path.join(assetsDir, svgFile), "utf8");

    // Match attribute colors: fill="...", stroke="...", stop-color="..."
    const attrRegex = /\b(fill|stroke|stop-color)="([^"]+)"/g;
    let match: RegExpExecArray | null;

    while ((match = attrRegex.exec(content)) !== null) {
      const [, attr, val] = match;
      const trimmed = val.trim();
      if (
        trimmed === "none" ||
        trimmed === "transparent" ||
        trimmed === "currentColor" ||
        trimmed.startsWith("url(") ||
        trimmed.startsWith("var(")
      ) {
        continue;
      }
      errors.push(`${svgFile}: attribute ${attr}="${trimmed}" has literal color without var()`);
    }

    // Match style colors: style="...color: ...; fill: ...; stroke: ..."
    const styleAttrRegex = /style="([^"]+)"/g;
    while ((match = styleAttrRegex.exec(content)) !== null) {
      const styleContent = match[1];
      const propRegex = /(?:^|;)\s*(color|fill|stroke)\s*:\s*([^;]+)/g;
      let propMatch: RegExpExecArray | null;
      while ((propMatch = propRegex.exec(styleContent)) !== null) {
        const [, prop, val] = propMatch;
        const trimmed = val.trim();
        if (
          trimmed === "none" ||
          trimmed === "transparent" ||
          trimmed === "currentColor" ||
          trimmed.startsWith("url(") ||
          trimmed.startsWith("var(")
        ) {
          continue;
        }
        errors.push(`${svgFile}: style property ${prop}: ${trimmed} has literal color without var()`);
      }
    }
  }

  assert.equal(
    errors.length,
    0,
    `Committed SVGs contain un-themed literal colors:\n${errors.join("\n")}`
  );
});
