# Concepts

## A figure is a definition

A figure is an object made by `defineFigure`. It holds everything needed to draw the figure, and nothing about where the figure will be shown:

```tsx
export default defineFigure({
  id: "gradient-steps",                 // equals the file name: gradient-steps.figure.tsx
  description: "…",                     // the SVG's accessible name and <title>
  layouts: { main: { width: 480, height: 280 } },
  params: { … },                         // optional: inputs, see below
  variants: { … },                       // optional: fixed input settings
  derive: (params) => ({ … }),           // optional: numbers computed from params
  render: ({ layout, size, params, derived, theme, time }) => <Figure>…</Figure>,
});
```

`render` returns React elements. It must be a pure function of what it receives: the same inputs always draw the same SVG. So anything random uses a seeded generator (`seededRandom`, `seededUniform`, `seededNormals`), and nothing reads the clock, the network, or global state.

## Layouts

A layout is a named size at which the figure is composed. `layouts` is a record of such sizes, and `render` is called once for each, with `layout` set to the name and `size` to the width and height in SVG units.

```tsx
layouts: { wide: { width: 720, height: 400 }, compact: { width: 340, height: 520 } },
render: ({ layout, size }) => …
```

A figure can use the name to compose itself differently at each size, for example stacking two panels on a narrow layout that sit side by side on a wide one. A small table keyed by layout name is the usual way to hold that geometry:

```tsx
const geometry = {
  wide: { plot: { x: 40, y: 20, width: 640, height: 340 } },
  compact: { plot: { x: 12, y: 20, width: 316, height: 300 } },
};
// in render: <Panel area={geometry[layout].plot} …>
```

The first declared layout is the **primary** layout. Its file is `<asset>.svg`, and every other layout's file is `<asset>.<layout>.svg`. The names mean nothing to Vellum beyond that; a project chooses its own, such as `wide` and `compact` for a responsive web page, or `column` and `page` for a document.

Layout names, figure ids, and variant names are lowercase words joined by single hyphens.

## Parameters and derived values

`params` declares the figure's inputs. Each parameter has a type, a default, and optional limits:

```tsx
import { param } from "@rio-agents/vellum";

params: {
  rho: param.number({ label: String.raw`\rho`, min: -0.95, max: 0.95, step: 0.01, default: 0.5 }),
  showAxes: param.boolean({ label: "axes", default: true }),
  kind: param.choice({ options: [{ value: "a", label: "A" }, { value: "b", label: "B" }], default: "a" }),
  stage: param.number({ default: 1, min: 1, max: 3, step: 1, hidden: true }),
},
```

Every value passes through one sanitizer before `render` sees it. Numbers are snapped to `step` and clamped to `[min, max]`, and invalid choices fall back to the default. So server rendering, client rendering, and variants all agree. A parameter marked `hidden` gets no control. A figure with at least one visible parameter is *interactive*; see [interactivity](interactivity.md).

`derive(params)` computes numbers once per parameter setting, such as a covariance matrix and its eigenvalues, and passes them to `render` as `derived`.

## Variants

A variant is a fixed setting of declared parameters. A definition with variants renders one *asset* per variant, named `<id>--<variant>`, each in every layout:

```tsx
params: { step: param.number({ default: 1, min: 1, max: 3, step: 1, hidden: true }) },
variants: { "step-1": { step: 1 }, "step-3": { step: 3 } },
```

This is the way to draw a staged family (the same picture at several stages) from one definition. A variant may set only declared parameters, and only to values the sanitizer would keep unchanged; `{ step: 5 }` above is an error, not a silent clamp to 3. A definition with variants has no bare `<id>` asset. [examples/staged-descent.figure.tsx](../examples/staged-descent.figure.tsx) is a worked example.

When the variants show different things, give `description` as a function of the parameters, so each asset gets its own accessible name and `<title>`:

```tsx
description: ({ step }) => `Gradient descent after ${step} steps.`,
```

## What Vellum leaves to a project

Vellum does not decide:

- which layouts a project's figures declare, or their sizes;
- how large text must be at the size a figure is shown;
- the theme's colors and fonts;
- how figures are embedded in pages or documents, and whether they carry titles or captions;
- any conversion of the SVG to other formats.

A project writes these conventions down in its own guide, and its `vellum.config.mjs` names its folders and theme.
