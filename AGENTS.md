# Vellum for agents

This file is for coding agents that draw figures with Vellum or change Vellum itself. Read the [README](README.md) first for the shape of a figure. The [docs](docs/) hold the details, and the [examples](examples/) hold working definitions to start from.

## Drawing a figure

1. **Find the project's conventions first.** Vellum does not decide where a figure lives, what sizes it is drawn at, what its layouts are called, which theme it uses, or how it is embedded. The project using Vellum decides these, usually in its own agent guide and its `vellum.config.mjs`. Follow those.
2. **Start from the closest example or existing figure.** Copy its structure, then change the drawing.
3. **Render and look.** Run `vellum render <id>` and inspect the SVG, as an image if you can. Check that labels do not collide with marks or with each other, that nothing is cut off at the edges, and that text is large enough at the size the figure will be shown.
4. **Iterate on the definition, never on the SVG.** The generated files are rebuilt from the definitions and any hand edit is lost.

## Rules the library relies on

- **A definition is a pure function of its parameters and the layout being drawn.** Put derived numbers in `derive` or in plain functions beside the definition. Use `seededRandom` or `seededNormals` for anything random, so a render is the same every time.
- **One coordinate rule for every mark.**
  - Scalar SVG-style coordinates (`x`, `y`, `x1`, `y1`, `x2`, `y2`, `width`, `height`) are figure pixels, even inside a `Panel`.
  - Point tuples and spans (`at`, `from`, `to`, `points`, `center`, and the `x`/`y` domains of `Panel` and `Region`) are data coordinates of the enclosing `Panel`. Using them outside a `Panel` throws an error that names the pixel alternative.
  - `offset` is always a pixel nudge added after placement.
- **Colors are tones and text sizes are roles.** Marks accept `tone="accent"`, `strokeTone="ink"`, and `size="caption"`, never literal colors or font sizes. The theme maps tones and roles to values, so one figure can be drawn under different themes.
- **Mathematics goes through `MathLabel`.** It renders TeX to SVG paths with MathJax. Do not use `foreignObject`.
- **Layout names are lowercase words joined by single hyphens**, and so are figure ids and variant names. The first declared layout is the primary one.

## Going beyond the built-in marks

Vellum is a base, not a closed set. When the marks do not cover what you need, use one of these; they are part of the library's contract ([docs/extending.md](docs/extending.md)):

- **Write your own mark** as a React component that calls `useFrame()` for the Panel's data-to-pixel conversion, `useTheme()` and `resolveTone()` for colors, and `useFigureScope()` for the figure's SVG ID prefix. [examples/custom-mark.figure.tsx](examples/custom-mark.figure.tsx) shows one.
- **Draw raw SVG** (`<path>`, `<g>`, `<defs>`) anywhere inside `Figure` or `Panel`. Resolve colors through the theme so the figure still follows it.
- **Pass your own theme** to `vellum render` (the `theme` setting) or to `renderToSvgString`.
- **Post-process the SVG text** returned by `renderToSvgString` or written by `vellum render`, for example to convert it to PDF or PNG with other tools. Vellum does not do conversions itself.

A mark written for one figure should stay beside that figure. Move it into the library only when it is general enough for other projects, and then document and test it.

## Changing Vellum itself

- Keep the core general. Nothing in `src/` may assume a site, a venue, a page size, a layout name, or an output format.
- Check every change with `pnpm test` and `pnpm typecheck`. If a change affects drawing, run `pnpm examples` and review the SVGs it rewrites in `examples/rendered/`. The tests fail when the committed examples differ from a fresh render.
- Add focused tests for a new mark, helper, or option, and document it in the matching file under `docs/`.
- Do not keep old forms of an API alongside new ones: no aliases, shims, or deprecated props. Change the API, update the examples and docs in the same change, and record the break in [CHANGELOG.md](CHANGELOG.md). Before 1.0, a breaking change bumps the minor version.
- The command-line code under `src/build/` runs through Node's type stripping, so it must import only `.ts` files, never `.tsx`.
- Planned work is in [plans/roadmap.md](plans/roadmap.md). Start an item only when asked, and remove it once it is done.
