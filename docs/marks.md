# Marks and coordinates

## Figure and Panel

Every `render` returns one `<Figure>`. It creates the root `<svg>` with a `viewBox` equal to the layout's size, the accessible name from the definition's description, and the arrowhead markers the marks use. It takes only children; its size and IDs come from the renderer.

A `<Panel>` maps a data rectangle onto a pixel rectangle of the figure:

```tsx
<Panel area={{ x: 40, y: 20, width: 400, height: 200 }} x={[-3, 3]} y={[0, 1]} aspect="auto" clip>
  …marks in data coordinates…
</Panel>
```

- `area` is in figure pixels. `x` and `y` are the data domains, and the data y axis points up.
- `aspect="equal"` shrinks the drawn rectangle so one data unit has the same length on both axes, and centers it in `area`.
- `clip` hides anything drawn outside the rectangle. Each clipped panel gets its own clip path.
- `padding` insets the drawn rectangle inside `area`.

`Axes` draws two crossing axis lines by default. With `frame`, it draws a closed box around the panel with ticks pointing inward on the bottom and left edges, the usual form for a plot that fills its panel; pair it with `Grid` for light lines at the ticks. Tick labels are set in the theme's `math` font, so numbers match the TeX labels beside them, and negative numbers get a true minus sign (`withMinusSign`).

Panels can overlap. A common pattern draws dense marks in a clipped panel, then axes and labels in an unclipped panel over the same area, so points on the edge stay whole.

## The coordinate rule

| Prop | Meaning | Outside a Panel |
|---|---|---|
| `x`, `y`, `x1`, `y1`, `x2`, `y2`, `width`, `height` (numbers) | figure pixels, even inside a Panel | allowed |
| `at`, `from`, `to`, `points`, `center`, and the `x`/`y` spans of `Panel` and `Region` | data coordinates of the enclosing Panel | an error |
| `offset` | a pixel nudge, added after placement | allowed |

So a label can be pinned to a data point with `at`, or placed anywhere in the figure with `x` and `y`, and never means the other. A mark given both forms throws an error.

## Marks

All marks take a `tone` (see [themes](themes.md)). Stroked marks take a `weight` (`"hairline"`, `"regular"`, `"bold"`, or a number) and a `dash` (`"solid"`, `"dashed"`, `"dotted"`, or an SVG dash pattern). Filled marks take `fillOpacity` and, for an outline, `strokeTone`.

**Plotting, in data coordinates:**

| Mark | Draws | Key props |
|---|---|---|
| `Curve` | a function or a polyline | `fn` with optional `domain` and `samples` (200), or `points` |
| `Area` | the region between a function and a baseline | `fn`, `baseline` (number or function), `domain`, or `points` |
| `Scatter` | points | `points`, `radius`, `pointTone(point, i)`, `filterInside` |
| `Bars` | vertical bars | `data: { x, y, width?, tone? }[]` or `points`, `baseline`, `barWidth` |
| `Ellipse` | an ellipse from a covariance or from semi-axes | `covariance` and `radius`, or `semiAxes` and `angle`; `center` |
| `Polygon` | a closed polygon | `points` |
| `Region` | a band across the panel | `x` and/or `y` spans; the missing one spans the panel |
| `Grid` | grid lines | `ticksX`, `ticksY` (a count or explicit values) |
| `Axes` | axes, ticks, tick labels, axis titles | `origin` (a point or `"edges"`) or `frame`, `ticksX`, `ticksY`, `showTickLabels`, `tickFormatX`, `tickFormatY`, `xLabel`, `yLabel` |
| `SlopeField` | short segments of slope `f(x, y)` on a grid | `slope`, `columns`, `rows`, `length` (pixels), `where` |
| `SolutionCurve` | the solution of `y' = rate(x, y)` through a point, by fourth-order Runge–Kutta, drawn until it leaves the panel | `rate`, `through`, `domain`, `direction` (`"both"`, `"forward"`, `"backward"`), `step` |
| `Contour` | level curves `fn(x, y) = c` by marching squares, joined so dashes stay continuous | `fn`, `levels` (one or several), `resolution` |
| `LevelRegion` | the region where `fn(x, y)` is above (or below) a level, with a smooth boundary | `fn`, `level` (0), `side`, `resolution`, `fillOpacity` |
| `Vector` | an arrow from a point, with a label | `from` (origin by default), `to`, `label` |
| `Callout` | a leader line from a point to a label | `at`, `to`, `label` |

**In either space:**

| Mark | Data form | Pixel form |
|---|---|---|
| `Point` | `at` | `x`, `y` |
| `Line` | `from`/`to`; `point` and `direction`; or `slope` and `intercept` (clipped to the panel) | `x1`, `y1`, `x2`, `y2` |
| `Arrow` | `from`/`to` | `x1`, `y1`, `x2`, `y2` |
| `Rect` | opposite corners `from`/`to` | `x`, `y`, `width`, `height` |

**Composed, in figure pixels:**

| Mark | Draws |
|---|---|
| `Legend` | a vertical list of swatches (`line`, `point`, or `rect`) and labels at `x`, `y` |
| `Table` | a grid of labelled cells with optional row and column totals drawn as bars, at `x`, `y` |

`grid()` and `stack()` compute evenly spaced pixel areas and positions for laying out several panels or items.

## Text and math

`Label` draws text and `MathLabel` draws TeX. Both are placed by `at` or `x`/`y`, then moved by `offset`, and aligned by `anchor`: the point of the label's box that sits on the placement, one of `center`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`, `nw`.

```tsx
<MathLabel tex={String.raw`\hat\beta`} at={[2, 1.4]} anchor="sw" offset={[6, -6]} tone="accent" />
<Label text="observed" x={120} y={24} size="caption" tone="muted" />
```

- `size` is a text role: `title`, `label`, `tick`, `caption`, `math`, or `symbol`.
- `halo` keeps a label readable where it crosses lines or fills: a text label is outlined in the surface color, and a math label sits on a surface-colored plate, since an outline around each glyph leaves gaps between symbols where lines show through.
- `font` picks the theme font for a `Label`: `"sans"` (the default), `"serif"`, or `"math"`, the face that matches TeX. Use `"math"` for numbers and short symbolic labels set beside mathematics; it also uses tabular numerals.
- `MathLabel` renders TeX with MathJax into SVG paths when the figure is rendered, so the SVG needs no math fonts. `display` switches to display-style math.
- `InlineTex` renders TeX for HTML around a figure, such as control labels.
