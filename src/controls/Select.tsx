import React, { useId } from "react";
import { InlineTex } from "../text/InlineTex.tsx";
import type { ChoiceOption } from "../params/types.ts";

export interface SelectProps<T extends string = string> {
  id?: string;
  name?: string;
  label?: string;
  labelKind?: "tex" | "text";
  options: ChoiceOption<T>[] | readonly ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function Select<T extends string = string>({
  id: propId,
  name,
  label,
  labelKind = "tex",
  options,
  value,
  onChange,
  disabled = false,
  className,
}: SelectProps<T>) {
  const generatedId = useId();
  const selectId = propId ?? (name ? `${generatedId}-${name}` : generatedId);

  return (
    <div className={`vellum-control vellum-control-select ${className ?? ""}`.trim()}>
      {label && (
        <label htmlFor={selectId} className="vellum-control-select__label">
          {labelKind === "tex" ? <InlineTex tex={label} /> : <span>{label}</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="vellum-control-select__input"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
