# Themes

Marks never take literal colors or font sizes. They take a **tone**, such as `tone="accent"`, and a **text role**, such as `size="caption"`, and the theme maps both to values. So the same definition can be drawn in a site's colors, in black and white, or at different text sizes by changing only the theme.

## Tones

`ink`, `muted`, `faint`, `accent`, `accentSubtle`, `surface`, `background`, `border`, and `series1` to `series6` for categorical data.

`resolveTone(tone, theme)` returns the color string for a tone, which is what a custom mark uses when it draws raw SVG.

## The theme object

A `FigureTheme` has these parts:

| Part | Holds | Default |
|---|---|---|
| `color` | one value per tone, with `series` as an array of six | a warm light palette |
| `font` | `sans` and `serif` font stacks | system sans, Source Serif 4 |
| `text` | a size in SVG units for each role: `title`, `label`, `tick`, `caption`, `math`, `symbol` | 15, 13, 11, 12, 13.5, 30 |
| `stroke` | the widths of `hairline`, `regular`, and `bold` | 1, 1.5, 2.5 |
| `space` | `labelOffset` and `tickLength`, in pixels | 8, 4 |
| `opacity` | `cloud`, `fill`, and `faded` opacities | 0.45, 0.1, 0.25 |

Text sizes are in SVG units, so how large they look depends on the size at which the SVG is shown. A figure 720 units wide shown 720 CSS pixels wide draws a 12-unit caption at 12 px; shown 360 pixels wide, it draws it at 6 px. A project that needs a minimum text size checks it at its own display sizes.

## Writing a theme

Start from `defaultTheme` and change what you need:

```ts
import { defaultTheme, type FigureTheme } from "@rio-agents/vellum";

export const printTheme: FigureTheme = {
  ...defaultTheme,
  color: { ...defaultTheme.color, ink: "#000000", muted: "#444444" },
  font: { ...defaultTheme.font, sans: '"Times New Roman", serif' },
};
```

Name it in `vellum.config.mjs` as `theme: { module: "figures/print-theme.ts", export: "printTheme" }`, or pass it to `renderToSvgString` and `mountFigure`.

A theme's values are written into the SVG as they are, so they can be CSS expressions. A web page can use variables with fallbacks, such as `var(--color-text, #1c1b18)`, so the figure follows the page's light and dark themes.
