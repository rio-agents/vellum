import React, { useId } from "react";
import { InlineTex } from "../text/InlineTex.tsx";

export interface ToggleProps {
  id?: string;
  name?: string;
  label?: string;
  labelKind?: "tex" | "text";
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  id: propId,
  name,
  label,
  labelKind = "tex",
  checked,
  onChange,
  disabled = false,
  className,
}: ToggleProps) {
  const generatedId = useId();
  const inputId = propId ?? (name ? `control-${name}` : generatedId);

  return (
    <div className={`webnotes-control webnotes-control-toggle ${className ?? ""}`.trim()}>
      <label htmlFor={inputId} className="webnotes-control-toggle__label">
        <input
          type="checkbox"
          id={inputId}
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="webnotes-control-toggle__input"
        />
        <span className="webnotes-control-toggle__text">
          {label && (labelKind === "tex" ? <InlineTex tex={label} /> : label)}
        </span>
      </label>
    </div>
  );
}
