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

## Points

A `param.point` has no control below the figure. It is moved inside the figure by marks bound to it by name:

```tsx
params: { start: param.point({ label: "Initial point", labelKind: "text", default: [-2, 2], bounds: { x: [-3, 3], y: [-3, 3] }, step: 0.05 }) },
render: ({ params }) => (
  <Figure>
    <Panel area={area} x={[-3, 3]} y={[-3, 3]}>
      <SolutionCurve rate={rate} through={params.start} />
      <Probe sets="start">{(at) => at && <Point at={at} radius={2} tone="ink" />}</Probe>
      <DragHandle param="start" />
    </Panel>
  </Figure>
),
```

- `DragHandle` shows the point and moves it with the pointer and the arrow keys, by the parameter's `step` (Shift for five steps). The parameter's `bounds` limit it, and `constrain` can snap or restrict a proposed point. It is focusable, has a visible focus ring, and announces its name and position.
- `Probe` covers its panel. With `sets`, pressing anywhere in the panel moves the point there, so readers need not find the handle. Its `children` receive the pointer's position in data coordinates while a mouse hovers, for readouts such as a tangent at the cursor, and `null` otherwise. Place it before the marks that should stay on top.
- `useParam(name)` gives a custom mark the same access: the value, the parameter's config, and a setter.

In a static render a handle is a plain point and a probe draws only `children(null)`; neither adds focusable elements. A figure with a visible point parameter is interactive.

## Mounting a figure

```ts
import { mountFigure } from "@rio-agents/vellum/render/client";

const figure = mountFigure(element, definition, { theme, asset, initialParams });
// later: figure.unmount();
```

`mountFigure` renders every declared layout of the definition from one parameter store, followed by one set of controls, into `element`. When a parameter changes, every layout redraws. Which layout is visible is left to the page; for example, a stylesheet can show one SVG by its `data-layout` attribute and container width.

Before replacing the static SVGs, `mountFigure` collects the math they already contain, so labels that do not change are not typeset again. Labels whose TeX changes with a parameter are typeset in the browser, which loads MathJax on first use. To avoid loading MathJax for the controls' own labels, render the static SVG with `embedControlMath` (see [rendering](rendering.md)).

`initialParams` starts the figure at a variant's settings instead of the defaults, and `asset` scopes its SVG IDs to that variant's asset name.
