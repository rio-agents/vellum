# Changelog

Vellum follows semantic versioning. Before 1.0, a breaking change bumps the minor version.

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
