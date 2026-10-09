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

## Choices and switches inside the figure

A choice or boolean parameter can also be operated inside the figure instead of below it, which keeps the control next to what it changes and lets its options be typeset:

```tsx
controls: { inFigure: ["equation", "isoclines"] },
// in render:
<ChipGroup param="equation" x={58} y={6} labels={{ funnel: { tex: String.raw`y' = x - y` }, antifunnel: { tex: String.raw`y' = y - x` } }} />
<ChipToggle param="isoclines" x={676} y={6} align="end" content={{ tex: String.raw`\text{isoclines}` }} tone="series1" />
```

- `ChipGroup` draws one chip per option of a `param.choice`, the selected one highlighted. Clicking a chip selects it; the group is a radio group, so the arrow keys move the selection. `labels` gives each option TeX or text.
- `ChipToggle` draws an on/off chip with a check box for a `param.boolean`. Clicking it, Space, or Enter switches it. `tone` colors its content while on, to match the layer it shows.
- `measureChips` returns the size a row of chips will take, for placing other marks beside it.
- `controls.inFigure` lists these parameters, so they get no control below the figure but still make it interactive. In a static render the chips are drawn as a legend with the defaults selected, and nothing is focusable.

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
