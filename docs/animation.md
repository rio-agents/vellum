# Animation and transformations

An animation is an ordinary figure evaluated at a changing time parameter. Its
static SVG, seeked frames, and live playback all use the same `render` function.

## One timeline

Declare at most one `param.time`, with a finite positive duration in seconds:

```tsx
params: {
  elapsed: param.time({ default: 0, duration: 8, label: "Time", labelKind: "text" }),
},
derive: ({ elapsed }) => ({ progress: stageProgress(elapsed, 0, 6, easing.easeInOut) }),
render: ({ time, params, derived }) => …
```

The parameter can have any name. `time` in render context equals the sanitized
parameter value; `derive` sees that same value. Defaults and overrides are
clamped to the interval `[0, duration]`. An invalid override uses the clamped
default. There is no independent player time or server time option.

To inspect a frame, render with an override:

```ts
renderToSvgString(figure, { params: { elapsed: 6 }, layout: "compact" });
```

A visible time parameter gets play/pause, restart, a keyboard-operable time
slider, speed, and loop controls after mounting. Playback starts paused, including
under reduced motion. Seeking pauses so the chosen frame stays available for
inspection. Playing from the end restarts at zero. Restart seeks to zero and
stays paused. `loop: true` on the time parameter initializes the loop setting.

The clock uses elapsed timestamps rather than adding one frame's nominal duration.
Hidden or offscreen figures suspend without advancing through the hidden interval,
then resume if playback was requested. A change enabling reduced motion pauses
playback. Unmount cancels the clock and removes its observers and listeners.
Hidden time parameters still render fixed snapshots but get no player.

## Interpolation and stages

`lerp`, `lerpPoint2`, and `lerpMatrix2` interpolate numbers, points, and matrix
entries. The progress argument is ordinarily in `[0, 1]`; the interpolation
functions also permit extrapolation. `easing.linear` and `easing.easeInOut` clamp
their input to `[0, 1]`.

`stageProgress(time, start, end, ease)` returns zero before a stage, one after it,
and eased progress within it. Exact endpoints let figures reach exact mathematical
states rather than approaching them indefinitely. Use several explicit stages to
hold a transformation, reveal a subspace, or change a caption. Each state should
be understandable when sought directly, without earlier frames having run.

Matrix interpolation is entrywise. Even two invertible endpoint matrices can
have singular intermediate matrices, for example between the identity and its
negative. Choose a rotation-angle parameter when the intended motion is rotation;
choose entrywise interpolation when it describes the intended family of maps.

## Transform geometry explicitly

```ts
const A: Mat2 = [[1, 0], [0, epsilon]];
const point = transformPoint2(A, [1, 2], [3, 0]); // A x plus a translation
const vector = transformVector2(A, [1, 2]);       // A v, without translation
const curve = transformPoints2(A, sampledCircle);
```

These functions use column vectors and apply the supplied matrix literally,
including symmetric, reflected, or singular matrices. Apply `transformPoints2`
to the endpoints of grid lines, polygon vertices, and sampled curves. Draw them
with the existing marks inside a fixed `Panel`. Position coordinate axes and
explanatory text separately when they should stay fixed.

`affine2(points, matrix, translation)` likewise applies a matrix directly. Its
probability-specific covariance option is explicit: `affine2(points, { cov: Sigma })`.

## Keep playback inexpensive

Keep formulas fixed and pre-rendered in `MathLabel`. Use `Label` for changing
numbers or captions; it updates SVG text without typesetting new TeX each frame.
When mounting into a page, harvest the static SVG's formula cache as usual and
pass `accessibleName` to preserve the page's alt text. A changing TeX formula
still loads MathJax when first needed; avoid changing its numeric content on
every animation frame.

The clock is general, but SVG geometry still redraws through React for every
declared layout. Review performance with the figure's actual mark count; this is
not a particle or video-rendering engine.

See [the flattening example](../examples/linear-map-flattening.figure.tsx). It
changes a family of maps, holds exact collapse for inspection, and labels the
displayed circle as a selected input region rather than the whole image.
