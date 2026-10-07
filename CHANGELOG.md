# Changelog

Vellum follows semantic versioning. Before 1.0, a breaking change bumps the minor version.

## 0.2.0 (unreleased)

- Animation through a single declared `param.time`: play/pause, seek, speed, looping, elapsed-time playback, suspension off screen or in hidden tabs, and cleanup on unmount. Figures start paused and respect changes to reduced-motion preferences.
- Number, point, and matrix interpolation, easing, and bounded stage progress.
- Explicit 2D point, vector, and sampled-geometry transforms, including singular maps.
- A flattening-grid reference figure with responsive layouts and exact-collapse states.
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
