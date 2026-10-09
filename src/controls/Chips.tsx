import React, { useRef, useState, type KeyboardEvent } from "react";
import { useTheme, resolveTone, resolveFontSize, type TextRole, type Tone } from "../theme/index.ts";
import { useParam } from "../params/binding.ts";
import type { BooleanParamConfig, ChoiceParamConfig } from "../params/types.ts";
import { resolveTex } from "../text/tex-resolver.ts";
import { MathLabel } from "../text/MathLabel.tsx";
import { Label } from "../text/Label.tsx";

/** What a chip shows: TeX, typeset like `MathLabel`, or plain text. */
export type ChipContent = { tex: string } | { text: string };

interface ChipMetrics {
  width: number;
  height: number;
}

const PAD_X = 9;
const BOX = 9;
const BOX_GAP = 6;

/** Width of a chip's content in pixels; TeX is measured, plain text is estimated. */
function contentWidth(content: ChipContent, fontSize: number): number {
  if ("tex" in content) {
    const math = resolveTex(content.tex);
    return math ? math.widthEm * fontSize : content.tex.length * 0.5 * fontSize;
  }
  return content.text.length * 0.56 * fontSize;
}

function chipMetrics(content: ChipContent, fontSize: number, withBox: boolean): ChipMetrics {
  const box = withBox ? BOX + BOX_GAP : 0;
  return { width: Math.round(contentWidth(content, fontSize) + box + 2 * PAD_X), height: Math.round(fontSize * 1.9) };
}

function ChipContentLabel({ content, x, y, size, tone }: { content: ChipContent; x: number; y: number; size: TextRole; tone: Tone }) {
  return "tex" in content ? (
    <MathLabel tex={content.tex} x={x} y={y} anchor="w" size={size} tone={tone} allowOverlap />
  ) : (
    <Label text={content.text} x={x} y={y} anchor="w" size={size} tone={tone} allowOverlap />
  );
}

interface ChipFaceProps {
  x: number;
  y: number;
  metrics: ChipMetrics;
  content: ChipContent;
  size: TextRole;
  selected: boolean;
  focused: boolean;
  /** Draw a check box before the content, for on/off chips. */
  box?: boolean;
  /** Tone of the content when the chip is on, so a chip can match the layer it shows. */
  tone?: Tone;
}

function ChipFace({ x, y, metrics, content, size, selected, focused, box = false, tone = "ink" }: ChipFaceProps) {
  const theme = useTheme();
  const accent = resolveTone("accent", theme);
  const cy = y + metrics.height / 2;
  const bx = x + PAD_X;
  return (
    <>
      {focused && (
        <rect x={x - 3} y={y - 3} width={metrics.width + 6} height={metrics.height + 6} rx={7} fill="none" stroke={accent} strokeWidth={1.5} />
      )}
      <rect
        x={x}
        y={y}
        width={metrics.width}
        height={metrics.height}
        rx={5}
        fill={resolveTone(selected ? "accentSubtle" : "surface", theme)}
        stroke={resolveTone(selected ? "accent" : "border", theme)}
        strokeWidth={selected ? 1.25 : 1}
        shapeRendering="geometricPrecision"
      />
      {box && (
        <>
          <rect
            x={bx}
            y={cy - BOX / 2}
            width={BOX}
            height={BOX}
            rx={2}
            fill={selected ? accent : resolveTone("surface", theme)}
            stroke={selected ? accent : resolveTone("faint", theme)}
            strokeWidth={1}
          />
          {selected && (
            <path
              d={`M${bx + 2} ${cy}L${bx + 4} ${cy + 2.2}L${bx + 7.2} ${cy - 2.2}`}
              fill="none"
              stroke={resolveTone("surface", theme)}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </>
      )}
      <ChipContentLabel
        content={content}
        x={bx + (box ? BOX + BOX_GAP : 0)}
        y={cy}
        size={size}
        tone={selected ? tone : "muted"}
      />
    </>
  );
}

export interface ChipGroupProps {
  /** Name of the `param.choice` the chips show and set. */
  param: string;
  /** Position of the row in figure pixels: its left edge, or its right edge with `align="end"`. */
  x: number;
  /** Top of the row, in figure pixels. */
  y: number;
  align?: "start" | "end";
  /** What each option's chip shows, by option value; defaults to the option's label as text. */
  labels?: Record<string, ChipContent>;
  gap?: number;
  size?: TextRole;
  /** Accessible name of the group; defaults to the parameter's text label. */
  label?: string;
  className?: string;
}

/**
 * A row of chips inside the figure, one per option of a choice parameter. The
 * selected option is highlighted; clicking a chip selects it, and the arrow
 * keys move the selection. In a static render the row is drawn as a legend of
 * the options, with the default highlighted. List the parameter in the
 * definition's `controls.inFigure` so it gets no control below the figure.
 */
export function ChipGroup({ param: name, x, y, align = "start", labels, gap = 6, size = "label", label, className }: ChipGroupProps) {
  const theme = useTheme();
  const { value, config, set } = useParam<string>(name);
  const [focused, setFocused] = useState<string | null>(null);
  const groupRef = useRef<SVGGElement>(null);
  if (config.type !== "choice") throw new Error(`ChipGroup needs a choice parameter; "${name}" is a ${config.type}.`);
  const options = (config as ChoiceParamConfig).options;
  const fontSize = resolveFontSize(size, "label", theme);

  const chips = options.map((option) => {
    const content = labels?.[option.value] ?? { text: option.label };
    return { option, content, metrics: chipMetrics(content, fontSize, false) };
  });
  const total = chips.reduce((sum, c) => sum + c.metrics.width, 0) + gap * (chips.length - 1);
  let cursor = align === "end" ? x - total : x;
  const placed = chips.map((c) => {
    const at = cursor;
    cursor += c.metrics.width + gap;
    return { ...c, x: at };
  });

  const select = (next: string) => {
    set?.(next);
    requestAnimationFrame(() => groupRef.current?.querySelector<SVGGElement>(`[data-value="${CSS.escape(next)}"]`)?.focus());
  };
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    select(options[(i + step + options.length) % options.length].value);
  };
  const groupName = label ?? (config.labelKind === "text" && config.label ? config.label : name);

  return (
    <g
      ref={groupRef}
      className={`vellum-chip-group ${className ?? ""}`.trim()}
      role={set ? "radiogroup" : undefined}
      aria-label={set ? groupName : undefined}
      onKeyDown={set ? onKeyDown : undefined}
    >
      {placed.map(({ option, content, metrics, x: cx }) => {
        const selected = option.value === value;
        return (
          <g
            key={option.value}
            data-value={option.value}
            role={set ? "radio" : undefined}
            aria-checked={set ? selected : undefined}
            aria-label={set ? option.label : undefined}
            tabIndex={set ? (selected ? 0 : -1) : undefined}
            style={set ? { cursor: "pointer", outline: "none" } : undefined}
            onClick={set ? () => select(option.value) : undefined}
            onFocus={set ? () => setFocused(option.value) : undefined}
            onBlur={set ? () => setFocused(null) : undefined}
          >
            <ChipFace x={cx} y={y} metrics={metrics} content={content} size={size} selected={selected} focused={focused === option.value} />
          </g>
        );
      })}
    </g>
  );
}

export interface ChipToggleProps {
  /** Name of the `param.boolean` the chip shows and switches. */
  param: string;
  x: number;
  y: number;
  align?: "start" | "end";
  /** What the chip shows; defaults to the parameter's label as text. */
  content?: ChipContent;
  /** Tone of the content while the chip is on, to match the layer it shows. */
  tone?: Tone;
  size?: TextRole;
  className?: string;
}

/**
 * An on/off chip inside the figure for a boolean parameter, with a check box.
 * Clicking it, or pressing Space or Enter, switches the parameter. List the
 * parameter in the definition's `controls.inFigure`.
 */
export function ChipToggle({ param: name, x, y, align = "start", content, tone = "ink", size = "label", className }: ChipToggleProps) {
  const theme = useTheme();
  const { value, config, set } = useParam<boolean>(name);
  const [focused, setFocused] = useState(false);
  if (config.type !== "boolean") throw new Error(`ChipToggle needs a boolean parameter; "${name}" is a ${config.type}.`);
  const shown = content ?? { text: (config as BooleanParamConfig).label ?? name };
  const fontSize = resolveFontSize(size, "label", theme);
  const metrics = chipMetrics(shown, fontSize, true);
  const left = align === "end" ? x - metrics.width : x;
  const accessibleName = "text" in shown ? shown.text : (config.label ?? name);

  return (
    <g
      className={`vellum-chip-toggle ${className ?? ""}`.trim()}
      role={set ? "switch" : undefined}
      aria-checked={set ? value : undefined}
      aria-label={set ? accessibleName : undefined}
      tabIndex={set ? 0 : undefined}
      style={set ? { cursor: "pointer", outline: "none" } : undefined}
      onClick={set ? () => set(!value) : undefined}
      onKeyDown={
        set
          ? (e) => {
              if (e.key !== " " && e.key !== "Enter") return;
              e.preventDefault();
              set(!value);
            }
          : undefined
      }
      onFocus={set ? () => setFocused(true) : undefined}
      onBlur={set ? () => setFocused(false) : undefined}
    >
      <ChipFace x={left} y={y} metrics={metrics} content={shown} size={size} selected={value} focused={focused} box tone={tone} />
    </g>
  );
}

/** The width and height a chip row or toggle will take, for laying out around it. */
export function measureChips(contents: ChipContent[], options: { size?: number; gap?: number; box?: boolean } = {}): { width: number; height: number } {
  const size = options.size ?? 13;
  const gap = options.gap ?? 6;
  const metrics = contents.map((c) => chipMetrics(c, size, options.box ?? false));
  return {
    width: metrics.reduce((sum, m) => sum + m.width, 0) + gap * Math.max(0, metrics.length - 1),
    height: metrics.length ? metrics[0].height : 0,
  };
}
