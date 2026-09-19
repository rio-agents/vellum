import React, { useId } from "react";
import { InlineTex } from "../text/InlineTex.tsx";
import { defaultFormatNumber } from "./format.ts";

export interface SliderProps {
  id?: string;
  name?: string;
  label?: string;
  labelKind?: "tex" | "text";
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

export { defaultFormatNumber };

export function Slider({
  id: propId,
  name,
  label,
  labelKind = "tex",
  min = 0,
  max = 1,
  step = 0.01,
  value,
  onChange,
  format,
  disabled = false,
  className,
}: SliderProps) {
  const generatedId = useId();
  const inputId = propId ?? (name ? `control-${name}` : generatedId);

  const formatted = format ? format(value) : defaultFormatNumber(value, step);

  return (
    <div className={`webnotes-control webnotes-control-slider ${className ?? ""}`.trim()}>
      <div className="webnotes-control-slider__header">
        <label htmlFor={inputId} className="webnotes-control-slider__label">
          {label && (labelKind === "tex" ? <InlineTex tex={label} /> : <span>{label}</span>)}
        </label>
        <output htmlFor={inputId} className="webnotes-control-slider__readout" aria-live="off">
          {formatted}
        </output>
      </div>
      <input
        type="range"
        id={inputId}
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={formatted}
        aria-label={label}
        onChange={(e) => {
          const next = parseFloat(e.target.value);
          if (!Number.isNaN(next)) {
            onChange(next);
          }
        }}
        className="webnotes-control-slider__input"
      />
    </div>
  );
}
