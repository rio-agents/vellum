import React from "react";
import {
  defineFigure,
  defaultTheme,
  Figure,
  Label,
  Line,
  Connector,
  ThemeProvider,
  useTheme,
  useFigureScope,
  resolveTone,
  type FigureTheme,
  type Tone,
} from "@rio-agents/vellum";

// A two-panel explanatory figure: a diagram of why streaming saves memory (A)
// and a log-scale chart of gains (B), with every mark it needs
// beyond the built-in ones written beside it. The numbers are illustrative.
//
// Colors come from whatever theme renders it. It brings its own typography
// through ThemeProvider: Fraunces headings, Hanken Grotesk labels, and sizes a
// step larger than the defaults. A project figure would normally take the
// project's theme from vellum.config.mjs instead.

const showcaseType: FigureTheme = {
  ...defaultTheme,
  font: {
    ...defaultTheme.font,
    sans: '"Hanken Grotesk", system-ui, -apple-system, sans-serif',
    serif: '"Fraunces", "Source Serif 4", Georgia, serif',
  },
  text: { ...defaultTheme.text, title: 19, label: 14, tick: 12.5, caption: 12.5 },
};

// ---------------------------------------------------------------------------
// Color helpers: shades are mixed from theme colors, never written literally.
// ---------------------------------------------------------------------------

function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

function useColors() {
  const theme = useTheme();
  return { theme, c: (tone: Tone) => resolveTone(tone, theme) };
}

// ---------------------------------------------------------------------------
// Local marks
// ---------------------------------------------------------------------------

/** One layer's buffer: a rhombus with a little thickness, lit from above. */
function Slab({ cx, cy, w, tone, lighten = 0, ghost = false, fade = 1 }: {
  cx: number; cy: number; w: number; tone: Tone; lighten?: number; ghost?: boolean; fade?: number;
}) {
  const { theme, c } = useColors();
  const h = w * 0.34;
  const t = 8;
  const L = [cx - w, cy], T = [cx, cy - h], R = [cx + w, cy], B = [cx, cy + h];
  const path = (pts: number[][]) => "M " + pts.map((p) => p.join(" ")).join(" L ") + " Z";
  if (ghost) {
    return (
      <path d={path([L, T, R, B])} fill={c("surface")} stroke={c("faint")} strokeOpacity={fade}
        strokeWidth={theme.stroke.hairline * 1.2} strokeDasharray="4 4" strokeLinejoin="round" />
    );
  }
  const base = mix(c(tone), c("surface"), lighten);
  const ink = c("ink");
  return (
    <g strokeLinejoin="round">
      <path d={path([L, B, [B[0], B[1] + t], [L[0], L[1] + t]])} fill={mix(base, ink, 0.32)} />
      <path d={path([B, R, [R[0], R[1] + t], [B[0], B[1] + t]])} fill={mix(base, ink, 0.18)} />
      <path d={path([L, T, R, B])} fill={base} stroke={mix(base, c("surface"), 0.35)} strokeWidth={1} />
    </g>
  );
}

/** The dilated taps drawn on the active slab. */
function Taps({ cx, cy, points }: { cx: number; cy: number; points: [number, number][] }) {
  const { c } = useColors();
  return <g>{points.map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={cy + dy} r={3.2} fill={c("surface")} fillOpacity={0.92} />)}</g>;
}

/** A skip link: a cubic arc with heads at both ends, which Connector does not draw. */
function SkipArc({ x, y1, y2, bow, tone }: { x: number; y1: number; y2: number; bow: number; tone: Tone }) {
  const { theme, c } = useColors();
  const { id } = useFigureScope();
  const marker = `${id}-skip-${tone}`;
  return (
    <g>
      <defs>
        <marker id={marker} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1.5 L 12 6 L 0 10.5 z" fill={c(tone)} />
        </marker>
      </defs>
      <path d={`M ${x} ${y1} C ${x + bow} ${y1}, ${x + bow} ${y2}, ${x} ${y2}`} fill="none" stroke={c(tone)}
        strokeWidth={theme.stroke.regular} markerStart={`url(#${marker})`} markerEnd={`url(#${marker})`} />
    </g>
  );
}

/** A row of small squares: how many buffers are live at the peak. */
function BufferMeter({ cx, y, live, tone }: { cx: number; y: number; live: number; tone: Tone }) {
  const { c } = useColors();
  const s = 13, gap = 5, n = 5;
  const x0 = cx - (n * s + (n - 1) * gap) / 2;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x0 + i * (s + gap)} y={y - s / 2} width={s} height={s} rx={2.5}
          fill={i < live ? c(tone) : c("surface")} stroke={i < live ? c(tone) : c("faint")}
          strokeDasharray={i < live ? undefined : "2.5 2.5"} />
      ))}
    </g>
  );
}

/** A value label with a bold figure and a lighter remainder, haloed in the paper color. */
function Value({ x, y, strong, rest, tone, anchor = "start" }: {
  x: number; y: number; strong: string; rest: string; tone: Tone; anchor?: "start" | "end";
}) {
  const { theme, c } = useColors();
  return (
    <text x={x} y={y} dominantBaseline="central" textAnchor={anchor} fontFamily={theme.font.sans}
      fontSize={theme.text.label} fill={c(tone)} stroke={tint(c, tone)} strokeWidth={5}
      strokeLinejoin="round" paintOrder="stroke">
      <tspan fontWeight={700}>{strong}</tspan>
      <tspan dx={4} fill={c("muted")} fontWeight={450}>{rest}</tspan>
    </text>
  );
}

/** A measured range: a soft capsule with solid ends. */
function Dumbbell({ x1, x2, y, tone }: { x1: number; x2: number; y: number; tone: Tone }) {
  const { c } = useColors();
  const h = 12;
  return (
    <g>
      <rect x={x1 - h / 2} y={y - h / 2} width={x2 - x1 + h} height={h} rx={h / 2} fill={c(tone)} fillOpacity={0.22} />
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={c(tone)} strokeWidth={2.5} />
      {[x1, x2].map((x) => <circle key={x} cx={x} cy={y} r={5.5} fill={c(tone)} stroke={tint(c, tone)} strokeWidth={1.5} />)}
    </g>
  );
}

/** A single measured value. */
function Dot({ x, y, tone }: { x: number; y: number; tone: Tone }) {
  const { c } = useColors();
  return (
    <g>
      <circle cx={x} cy={y} r={11} fill={c(tone)} fillOpacity={0.16} />
      <circle cx={x} cy={y} r={6} fill={c(tone)} stroke={tint(c, tone)} strokeWidth={1.5} />
    </g>
  );
}

const tint = (c: (t: Tone) => string, tone: Tone) => mix(c(tone), c("surface"), 0.93);

/** A soft tinted band behind one group of rows. */
function Band({ y1, y2, tone }: { y1: number; y2: number; tone: Tone }) {
  const { c } = useColors();
  return <rect x={16} y={y1} width={868} height={y2 - y1} rx={10} fill={tint(c, tone)} />;
}

/** The paper the figure is printed on, so the standalone file carries its own background. */
function Paper({ width, height }: { width: number; height: number }) {
  const { c } = useColors();
  return <rect x={0} y={0} width={width} height={height} fill={c("surface")} />;
}

// ---------------------------------------------------------------------------
// Panel A
// ---------------------------------------------------------------------------

const LEFT = 185;
const RIGHT = 585;
const unet = [
  { cy: 162, w: 118, lighten: 0 },
  { cy: 210, w: 94, lighten: 0.14 },
  { cy: 250, w: 70, lighten: 0.28 },
  { cy: 290, w: 94, lighten: 0.14 },
  { cy: 338, w: 118, lighten: 0 },
];
const SW = 104;
const stream = [162, 212, 262, 312, 362];
const taps: [number, number][] = [[-52, 6], [-26, -2], [-26, 14], [0, 6], [0, 22], [26, -2], [26, 14], [52, 6]];

// ---------------------------------------------------------------------------
// Panel B
// ---------------------------------------------------------------------------

const AX = { x0: 262, x1: 862, top: 552, bottom: 872 };
const px = (v: number) => AX.x0 + (Math.log10(v) / Math.log10(250)) * (AX.x1 - AX.x0);
const ticks = [1, 2, 5, 10, 20, 50, 100, 200];

type Row = { label: string; y: number; lo: number; hi?: number; strong: string; rest: string; left?: boolean };
type Group = { name: string; y: number; band: [number, number]; tone: Tone; rows: Row[] };

const groups: Group[] = [
  {
    name: "Streaming model vs. U-Net", y: 574, band: [556, 676], tone: "series1", rows: [
      { label: "Parameters", y: 604, lo: 12, strong: "12×", rest: "fewer (92%)" },
      { label: "Run time", y: 632, lo: 8, hi: 25, strong: "8–25×", rest: "faster" },
      { label: "Peak RAM", y: 660, lo: 20, hi: 30, strong: "20–30×", rest: "less" },
    ],
  },
  {
    name: "Streamed preprocessing ops", y: 708, band: [690, 782], tone: "series6", rows: [
      { label: "Heap memory", y: 738, lo: 120, strong: "120×", rest: "lower", left: true },
      { label: "Pipeline speed", y: 766, lo: 3, hi: 9, strong: "3–9×", rest: "faster" },
    ],
  },
  {
    name: "Streamed 4D pipeline", y: 814, band: [796, 860], tone: "series4", rows: [
      { label: "Peak 4D RAM", y: 844, lo: 3, strong: "3×", rest: "less" },
    ],
  },
];

const W = 650;
const SIZE = { width: 900, height: 940 };

export default defineFigure({
  id: "streaming-memory",
  description:
    "Panel A contrasts a conventional U-Net, whose skip links keep every layer's buffer in memory, with a skip-free dilated network that streams one active buffer and frees the rest. Panel B plots illustrative gains on a log scale: a streaming model uses 12 times fewer parameters than a U-Net, runs 8 to 25 times faster, and needs 20 to 30 times less peak memory; streamed preprocessing uses 120 times less heap and runs 3 to 9 times faster; a streamed 4D pipeline needs 3 times less peak memory.",
  layouts: { main: SIZE },
  render: () => (
    <Figure style={{ fontFamily: showcaseType.font.sans }}>
      <ThemeProvider theme={showcaseType}>
        <Paper {...SIZE} />

        {/* ---------------- Panel A ---------------- */}
        <Label text="A" x={22} y={36} anchor="w" size="title" font="serif" fontWeight={W} tone="accent" />
        <Label text="Why memory drops: in-place streaming vs. skip buffers" x={48} y={36} anchor="w" size="title" font="serif" fontWeight={500} tone="ink" />

        <Label text="Conventional U-Net" x={LEFT} y={88} anchor="center" size="label" font="serif" fontWeight={W} tone="series2" style={{ fontSize: 17 }} />
        <Label text="All buffers stay live in RAM" x={LEFT} y={112} anchor="center" size="label" tone="muted" />
        {[...unet].reverse().map((s, i) => <Slab key={i} cx={LEFT} cy={s.cy} w={s.w} tone="series2" lighten={s.lighten} />)}
        <SkipArc x={LEFT + 124} y1={162} y2={338} bow={66} tone="series2" />
        <SkipArc x={LEFT + 100} y1={210} y2={290} bow={40} tone="series2" />
        {["Skip links hold", "all layers", "in memory"].map((t, i) => (
          <Label key={t} text={t} x={LEFT + 188} y={232 + 19 * i} anchor="w" size="label" tone="series2" />
        ))}
        <BufferMeter cx={LEFT} y={424} live={5} tone="series2" />
        <Label text="Peak RAM grows with depth" x={LEFT} y={454} anchor="center" size="label" fontWeight={W} tone="series2" />

        <Label text="Skip-free dilated stream" x={RIGHT} y={88} anchor="center" size="label" font="serif" fontWeight={W} tone="series1" style={{ fontSize: 17 }} />
        <Label text="1 active buffer; prior layers freed" x={RIGHT} y={112} anchor="center" size="label" tone="muted" />
        {[...stream].reverse().map((cy, k) => {
          const i = stream.length - 1 - k;
          if (i === 0) return <Slab key={i} cx={RIGHT} cy={cy} w={SW} tone="series6" />;
          if (i === 1) return <Slab key={i} cx={RIGHT} cy={cy} w={SW} tone="series1" />;
          return <Slab key={i} cx={RIGHT} cy={cy} w={SW} tone="series1" ghost fade={1.25 - 0.25 * i} />;
        })}
        <Taps cx={RIGHT} cy={212} points={taps} />
        <Connector from={{ x: RIGHT + SW + 6, y: 222 }} controls={[{ x: RIGHT + 152, y: 236 }, { x: RIGHT + 152, y: 186 }]}
          to={{ x: RIGHT + SW + 8, y: 203 }} tone="series1" />

        <Label text="Streamed output" x={RIGHT + 124} y={162} anchor="w" size="label" fontWeight={W} tone="series6" />
        <Label text="Active dilated slab" x={RIGHT + 162} y={203} anchor="w" size="label" fontWeight={W} tone="series1" />
        <Label text="(in-place reuse)" x={RIGHT + 162} y={222} anchor="w" size="label" tone="series1" />
        <Label text="Freed buffers" x={RIGHT + 124} y={304} anchor="w" size="label" tone="muted" />
        <Label text="(no skip links)" x={RIGHT + 124} y={323} anchor="w" size="label" tone="muted" />
        <BufferMeter cx={RIGHT} y={424} live={1} tone="series1" />
        <Label text="Peak RAM = 1 buffer" x={RIGHT} y={454} anchor="center" size="label" fontWeight={W} tone="series1" />

        <Line x1={22} y1={490} x2={878} y2={490} tone="border" weight="hairline" />

        {/* ---------------- Panel B ---------------- */}
        <Label text="B" x={22} y={524} anchor="w" size="title" font="serif" fontWeight={W} tone="accent" />
        <Label text="Gains from streaming (illustrative data)" x={48} y={524} anchor="w" size="title" font="serif" fontWeight={500} tone="ink" />

        {groups.map((g) => <Band key={g.name} y1={g.band[0]} y2={g.band[1]} tone={g.tone} />)}

        {ticks.map((t) => (
          <g key={t}>
            <Line x1={px(t)} y1={AX.top} x2={px(t)} y2={AX.bottom} tone={t === 1 ? "faint" : "border"} weight="hairline" dash={t === 1 ? "solid" : "dotted"} />
            <Label text={`${t}×`} x={px(t)} y={AX.bottom + 10} anchor="n" size="tick" tone="muted" />
          </g>
        ))}
        <Line x1={AX.x0} y1={AX.bottom} x2={AX.x1} y2={AX.bottom} tone="faint" weight="hairline" />
        <Label text="Improvement over the baseline, log scale" x={AX.x1} y={AX.bottom + 40} anchor="e" size="caption" tone="faint" />

        {groups.map((g) => (
          <g key={g.name}>
            <Label text={g.name} x={32} y={g.y} anchor="w" size="label" font="serif" fontWeight={W} tone={g.tone} style={{ fontSize: 15 }} />
            {g.rows.map((r) => {
              const end = px(r.hi ?? r.lo);
              return (
                <g key={r.label}>
                  <Label text={r.label} x={AX.x0 - 16} y={r.y} anchor="e" size="label" tone="ink" />
                  {r.hi ? <Dumbbell x1={px(r.lo)} x2={end} y={r.y} tone={g.tone} /> : <Dot x={end} y={r.y} tone={g.tone} />}
                  <Value x={r.left ? px(r.lo) - 18 : end + 18} y={r.y} strong={r.strong} rest={r.rest} tone={g.tone} anchor={r.left ? "end" : "start"} />
                </g>
              );
            })}
          </g>
        ))}
      </ThemeProvider>
    </Figure>
  ),
});
