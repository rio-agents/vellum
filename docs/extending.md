# Extending

Vellum is a base to build on. When the built-in marks do not draw what you need, the four ways below are part of the library's contract. A figure that uses them renders, themes, and tests like any other.

## 1. Write a mark

A mark is a React component. It reads the same context the built-in marks read:

- `useFrame()` inside a `Panel`: `toPx([x, y])` converts a data point to figure pixels, `sx` and `sy` are the two scales, `area` is the drawn rectangle, and `pxPerUnit` gives pixels per data unit on each axis.
- `useTheme()` and `resolveTone(tone, theme)`: colors, stroke widths, and text sizes.
- `useFigureScope()`: `id` is the prefix for any SVG IDs the mark defines, such as a gradient or a clip path, so they cannot collide with another figure's on the same page.

[examples/custom-mark.figure.tsx](../examples/custom-mark.figure.tsx) draws a stem plot this way:

```tsx
function Stems({ values, tone = "accent" }: { values: [number, number][]; tone?: Tone }) {
  const { toPx } = useFrame();
  const theme = useTheme();
  const color = resolveTone(tone, theme);
  return (
    <g>
      {values.map(([x, y]) => {
        const [px, py] = toPx([x, y]);
        const [, baseline] = toPx([x, 0]);
        return <line key={x} x1={px} y1={baseline} x2={px} y2={py} stroke={color} strokeWidth={theme.stroke.regular} />;
      })}
    </g>
  );
}
```

Follow the coordinate rule in your own props: tuples for data points, scalar `x`/`y` for pixels. Keep a mark written for one figure beside that figure.

## 2. Draw raw SVG

Any SVG element can go inside `Figure` or `Panel`. Pixel coordinates are figure pixels in both. Take colors from the theme rather than writing literal colors, so the figure still follows its theme:

```tsx
const theme = useTheme();
<path d="M 20 20 C 80 0, 120 60, 180 40" fill="none" stroke={resolveTone("muted", theme)} />
```

## 3. Supply a theme

A theme changes every color, font, text size, and stroke width at once ([themes](themes.md)). Name it in `vellum.config.mjs`, or pass it to `renderToSvgString` and `mountFigure`.

## 4. Post-process the SVG

`renderToSvgString` returns text, and `vellum render` writes plain `.svg` files. Anything that reads SVG can take it from there: convert it to PDF or PNG, outline its text, crop it, or combine several figures. Vellum does none of this itself, so a project uses whichever tools suit it.

## Adding to the library

A mark, helper, or option belongs in the library when other projects would use it as it is. Then:

- put it under `src/` with the other code of its kind, and export it from the matching `index.ts`;
- keep it free of any project's assumptions (sizes, layout names, colors, output formats);
- add focused tests, document it under `docs/`, and use it in an example if that helps to show it;
- record it in the changelog.
