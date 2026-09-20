import React, { useId } from "react";
import type { FigureDefinition } from "../define.ts";
import type {
  FigureParamsSchema,
  InferParamsValues,
  AnyParamConfig,
  NumberParamConfig,
  BooleanParamConfig,
  ChoiceParamConfig,
} from "../params/types.ts";
import { Slider } from "./Slider.tsx";
import { Toggle } from "./Toggle.tsx";
import { Select } from "./Select.tsx";

export interface ControlsProps<
  P extends FigureParamsSchema = FigureParamsSchema,
  D extends Record<string, unknown> = Record<string, unknown>
> {
  definition: FigureDefinition<P, D>;
  params: InferParamsValues<P>;
  set: <K extends keyof InferParamsValues<P>>(name: K, value: InferParamsValues<P>[K]) => void;
  className?: string;
  idPrefix?: string;
}

export function Controls<
  P extends FigureParamsSchema = FigureParamsSchema,
  D extends Record<string, unknown> = Record<string, unknown>
>({ definition, params, set, className, idPrefix }: ControlsProps<P, D>) {
  const generatedId = useId();
  const controlsId = idPrefix ?? generatedId;
  const schema = definition.params;
  if (!schema) return null;

  const hiddenList = definition.controls?.hidden ?? [];
  const customOrder = definition.controls?.order;

  let paramKeys = Object.keys(schema).filter((key) => {
    const config = schema[key];
    if (config.hidden) return false;
    if (hiddenList.includes(key)) return false;
    // Points are driven by DragHandle inside the SVG
    if (config.type === "point") return false;
    // Time is driven by animation player in Phase 5
    if (config.type === "time") return false;
    return true;
  });

  if (customOrder && customOrder.length > 0) {
    paramKeys.sort((a, b) => {
      const idxA = customOrder.indexOf(a);
      const idxB = customOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  if (paramKeys.length === 0) return null;

  return (
    <div className={`webnotes-figure-controls ${className ?? ""}`.trim()}>
      {paramKeys.map((key) => {
        const config = schema[key] as AnyParamConfig;
        const val = (params as any)[key];

        switch (config.type) {
          case "number": {
            const numConfig = config as NumberParamConfig;
            return (
              <Slider
                key={key}
                id={`${controlsId}-${key}`}
                name={key}
                label={numConfig.label}
                labelKind={numConfig.labelKind}
                min={numConfig.min}
                max={numConfig.max}
                step={numConfig.step}
                value={typeof val === "number" ? val : numConfig.default}
                onChange={(next) => set(key as any, next as any)}
                format={numConfig.format}
              />
            );
          }
          case "boolean": {
            const boolConfig = config as BooleanParamConfig;
            return (
              <Toggle
                key={key}
                id={`${controlsId}-${key}`}
                name={key}
                label={boolConfig.label}
                labelKind={boolConfig.labelKind}
                checked={Boolean(val)}
                onChange={(next) => set(key as any, next as any)}
              />
            );
          }
          case "choice": {
            const choiceConfig = config as ChoiceParamConfig;
            return (
              <Select
                key={key}
                id={`${controlsId}-${key}`}
                name={key}
                label={choiceConfig.label}
                labelKind={choiceConfig.labelKind}
                options={choiceConfig.options}
                value={val ?? choiceConfig.default}
                onChange={(next) => set(key as any, next as any)}
              />
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
