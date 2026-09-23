# Rendering

There are two ways to turn definitions into SVG: the `vellum render` command, which writes files for a whole project, and `renderToSvgString`, which renders one layout of one definition in code.

## `vellum render`

```
vellum render [--config <file>] [figure-or-asset ...]
```

The command reads `vellum.config.mjs` from the current directory:

```js
/** @type {import("@rio-agents/vellum/build").VellumConfig} */
export default {
  sources: "figures",                                         // searched recursively for <id>.figure.tsx
  output: "figures/svg",                                      // receives the SVG files and manifest.json
  theme: { module: "figures/theme.ts", export: "paperTheme" }, // optional; the library theme otherwise
  embedControlMath: false,                                    // optional; see below
};
```

With no arguments it renders every definition. Given figure ids or asset names, it renders only those figures; an asset name `<id>--<variant>` selects its whole figure.

For each definition, it:

1. checks that the default export is a definition whose `id` equals the file name's stem, and that no two files share a stem;
2. lists the definition's assets, one per variant or a single `<id>`, and validates the variants and layout names;
3. renders every asset in every layout: `<asset>.svg` for the primary layout, `<asset>.<layout>.svg` for the others;
4. writes `manifest.json`, one record per asset, sorted by asset name.

A full render also deletes SVG files and manifest records that no definition produces any more. A targeted render replaces only the named figures' files and records and leaves the rest alone.

`embedControlMath: true` hides a copy of each parameter's TeX label in the primary layout's SVG. A page that mounts interactive figures can then show control labels without loading MathJax ([interactivity](interactivity.md)).

### The manifest

```json
{
  "staged-descent--step-3": {
    "figure": "staged-descent",
    "variant": "step-3",
    "params": { "step": 3 },
    "source": "examples/staged-descent.figure.tsx",
    "layouts": ["wide", "narrow"],
    "interactive": false,
    "animated": false
  }
}
```

A project uses it to find an asset's files (`recordFiles(asset, record)` from `@rio-agents/vellum/manifest`), to decide which figures to mount, and to pass a variant's parameters to `mountFigure`.

### Checking a project's figures

`@rio-agents/vellum/build` exports the command's pieces, so a project's tests can check that its committed figures are current:

```js
import { loadConfig, findFigureSources, renderFigureSources, checkFigureIntegrity } from "@rio-agents/vellum/build";

const config = await loadConfig(root);
const sources = await findFigureSources(root, config.sources);
const rendered = await renderFigureSources(root, sources, config);
// compare rendered[i].files with the committed SVGs, and check
// checkFigureIntegrity({ sources, manifest, files, expected }) returns no problems
```

`checkFigureIntegrity` reports duplicate ids, manifest records without a source, sources without a record, missing or extra SVG files, and records that differ from a fresh render.

## `renderToSvgString`

```ts
import { renderToSvgString } from "@rio-agents/vellum/render/server";

const svg = renderToSvgString(definition, {
  layout: "wide",        // defaults to the primary layout
  theme,                 // defaults to the library theme
  params: { rho: 0.3 },  // sanitized like any other parameter values
  asset: "my-figure",    // the prefix of the SVG's IDs; defaults to the definition id
  embedControlMath: false,
});
```

It returns the SVG as text. Use it to render at a layout and theme of your choosing, then write, post-process, or convert the result however the project needs.

## Running the TypeScript

Vellum ships TypeScript source. The `vellum` command runs it through Node's type stripping, which Node 22 enables with `--experimental-strip-types`; the command sets that flag itself. Code that imports `@rio-agents/vellum/build` or `@rio-agents/vellum/manifest` directly must run with the flag on Node 22.
