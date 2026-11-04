# Changelog

Vellum follows semantic versioning. Before 1.0, a breaking change bumps the minor version.

## 0.2.0 (unreleased)

- `description` may be a function of the parameters, so each variant (or parameter setting) gets its own accessible name and `<title>`. `figureDescription(definition, params)` resolves it.

- Point parameters are interactive. `DragHandle` binds to a declared `param.point` by name and moves it by pointer and keyboard within its bounds; `Probe` sets a point by pressing anywhere in a panel and reports the hovered position for readouts; `useParam` gives custom marks the same access. Static renders stay free of client behavior.
- Marks for first-order equations and level sets: `SolutionCurve` (fourth-order Runge–Kutta), `Contour` (marching squares, joined into polylines), and `LevelRegion` (a seamless fill of `fn > level` or `fn < level`), with `scalarSolution`, `contourLines`, and `levelRegionPolygons` in `math`.
- A technical default look: `Axes` gains `frame` (a closed box with inward ticks); tick labels use the theme's math font with true minus signs; `Grid` lines are solid by default; `SlopeField` marks are lighter so solution curves stand out; ticks are 5 px.
- In-figure controls: `ChipGroup` (a row of typeset chips for a `param.choice`, operated as a radio group) and `ChipToggle` (an on/off chip for a `param.boolean`), with `measureChips` for layout. `controls.inFigure` lists parameters operated inside the figure: they get no control below it and still make it interactive.
- `MathLabel` and `InlineTex` keep their glyph nodes across redraws instead of rewriting them on every render, which also stops a press on a math label from losing its click.
- `Label` takes `font` (`"sans"`, `"serif"`, or `"math"`).
- `Grid` lines and the rules of `Axes` (axis lines, ticks, frame) use `shape-rendering: crispEdges`, so they land on whole pixels on 1x screens. A haloed `MathLabel`'s plate is opaque.
- **Breaking:** themes need `font.math`, a font stack that matches the TeX font.
- **Breaking:** `DragHandle` takes `param` (the name of a point parameter) instead of `point` and `onChange`, and reads its step from the parameter. A figure with a visible point parameter now counts as interactive.
- **Breaking:** a haloed `MathLabel` sits on a surface-colored plate instead of an outlined copy of its glyphs. `Axes` defaults to the `faint` tone, and `Grid` to solid lines at opacity 0.6.
- Animation through a single declared `param.time`: play/pause, seek, speed, looping, elapsed-time playback, suspension off screen or in hidden tabs, and cleanup on unmount. Figures start paused and respect changes to reduced-motion preferences.
- Number, point, and matrix interpolation, easing, and bounded stage progress.
- Explicit 2D point, vector, and sampled-geometry transforms, including singular maps.
- A flattening-grid reference figure with responsive layouts and exact-collapse states.
- The default theme has an earthy palette on cream paper: warm ink, a sage accent, and slate, brick, olive, ochre, umber, and sea-sage series. Figures rendered without a configured theme change color; the fonts and sizes are unchanged.
- Embedding pages can preserve their accessible figure names through hydration; mounted instances have independent SVG IDs.
- **Breaking:** time parameters require a positive finite `duration`. Removed the unused `player` configuration and server `time` override. Set the declared time parameter through `params`; render context `time` is that same sanitized value.
- **Breaking:** `affine2(points, matrix)` applies the supplied matrix literally. Covariance inputs must use `{ cov: matrix }`; no matrix-shape guessing remains. Point-only figures are not marked interactive until point controls are implemented.

## 0.1.0 (unreleased)

The first version as a standalone library, extracted from the webnotes figure package.

- Figure definitions with open, named layouts; the first declared layout is primary.
- Variants: one definition rendered at several fixed parameter settings, one asset each.
- Panels with data coordinates, and one coordinate rule for every mark.
- Marks: `Area`, `Arrow`, `Axes`, `Bars`, `Callout`, `Curve`, `Ellipse`, `Grid`, `Legend`, `Line`, `Point`, `Polygon`, `Rect`, `Region`, `Scatter`, `SlopeField`, `Table`, `Vector`.
- Text and math: `Label`, `MathLabel` (TeX to SVG paths), `InlineTex`.
- Themes with semantic tones and text roles.
- Parameters, derived values, and controls, with client hydration through `mountFigure`.
- `vellum render`, configured per project by `vellum.config.mjs`, with a manifest and integrity checks.

### Figure vocabulary

Added `PlotAxes` with arrow tips and symbolic ticks, `PanelTitle`, axis guides,
and tick formatting helpers. Added explicit diagram boxes, anchors, connectors,
groups, and row/column placement, developed against Web Notes' figure ports.
