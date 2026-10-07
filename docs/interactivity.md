# Interactivity

A figure with at least one visible parameter is interactive. Its static SVG is still rendered at the parameters' defaults, so it reads correctly without JavaScript, and a page can then *mount* the definition to make it live.

## Controls

Each visible parameter gets a control:

| Parameter | Control |
|---|---|
| `param.number` | `Slider`, with a formatted readout |
| `param.boolean` | `Toggle` |
| `param.choice` | `Select` |

A parameter's `label` is TeX unless `labelKind: "text"`. `controls: { order, hidden }` in the definition reorders controls or hides some without hiding the parameter from variants. Control IDs are unique per mounted figure, and form names are the parameter names.

`param.time` gets a shared animation player; see [animation](animation.md).
`param.point` is not yet bound to a drag control and does not by itself make a figure interactive.

## Mounting a figure

```ts
import { mountFigure } from "@rio-agents/vellum/render/client";

const figure = mountFigure(element, definition, { theme, asset, initialParams });
// later: figure.unmount();
```

`mountFigure` renders every declared layout of the definition from one parameter store, followed by one set of controls, into `element`. When a parameter changes, every layout redraws. Which layout is visible is left to the page; for example, a stylesheet can show one SVG by its `data-layout` attribute and container width.

Before replacing the static SVGs, `mountFigure` collects the math they already contain, so labels that do not change are not typeset again. Labels whose TeX changes with a parameter are typeset in the browser, which loads MathJax on first use. To avoid loading MathJax for the controls' own labels, render the static SVG with `embedControlMath` (see [rendering](rendering.md)).

`initialParams` starts the figure at a variant's settings instead of the defaults, and `asset` scopes its SVG IDs to that variant's asset name.
