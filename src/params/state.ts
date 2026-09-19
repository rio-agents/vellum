import { useState, useMemo, useCallback } from "react";
import type {
  FigureParamsSchema,
  InferParamsValues,
  AnyParamConfig,
  NumberParamConfig,
  PointParamConfig,
  ChoiceParamConfig,
} from "./types.ts";
import type { FigureDefinition } from "../define.ts";

export function snapToStep(val: number, step?: number, min?: number): number {
  if (step === undefined || step <= 0) return val;
  const base = min ?? 0;
  const rawSnapped = base + Math.round((val - base) / step) * step;
  const stepStr = step.toString();
  const decimals = stepStr.includes(".") ? stepStr.split(".")[1].length : 0;
  return Number(rawSnapped.toFixed(Math.min(decimals + 2, 8)));
}

export function clampNumber(val: number, min?: number, max?: number): number {
  let v = val;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  return v;
}

export function sanitizeNumberParam(val: number, config: NumberParamConfig): number {
  const snapped = snapToStep(val, config.step, config.min);
  return clampNumber(snapped, config.min, config.max);
}

export function sanitizePointParam(
  pt: [number, number],
  config: PointParamConfig
): [number, number] {
  let x = pt[0];
  let y = pt[1];
  if (config.bounds?.x) {
    x = clampNumber(x, config.bounds.x[0], config.bounds.x[1]);
  }
  if (config.bounds?.y) {
    y = clampNumber(y, config.bounds.y[0], config.bounds.y[1]);
  }
  return [x, y];
}

export function sanitizeParamValue(config: AnyParamConfig, value: unknown): unknown {
  switch (config.type) {
    case "number":
      if (typeof value === "number" && !Number.isNaN(value)) {
        return sanitizeNumberParam(value, config);
      }
      return config.default;
    case "boolean":
      return Boolean(value);
    case "choice": {
      const choiceConfig = config as ChoiceParamConfig;
      const valid = choiceConfig.options.some((opt) => opt.value === value);
      return valid ? value : config.default;
    }
    case "point":
      if (Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number") {
        return sanitizePointParam(value as [number, number], config);
      }
      return config.default;
    case "time":
      if (typeof value === "number" && !Number.isNaN(value)) {
        let t = value;
        if (config.duration !== undefined) {
          t = Math.max(0, Math.min(config.duration, t));
        }
        return t;
      }
      return config.default;
    default:
      return value ?? (config as any).default;
  }
}

export function resolveDefaultParams<P extends FigureParamsSchema>(
  schema?: P,
  overrides?: Partial<InferParamsValues<P>>
): InferParamsValues<P> {
  const result: Record<string, unknown> = {};
  if (!schema) return result as InferParamsValues<P>;

  for (const [key, config] of Object.entries(schema)) {
    const rawVal = overrides?.[key] !== undefined ? overrides[key] : config.default;
    result[key] = sanitizeParamValue(config, rawVal);
  }

  return result as InferParamsValues<P>;
}

export interface FigureParamsHookResult<
  P extends FigureParamsSchema,
  D extends Record<string, unknown>
> {
  params: InferParamsValues<P>;
  derived: D;
  set: <K extends keyof InferParamsValues<P>>(
    name: K,
    value: InferParamsValues<P>[K] | ((prev: InferParamsValues<P>[K]) => InferParamsValues<P>[K])
  ) => void;
  reset: () => void;
}

export function useFigureParams<
  P extends FigureParamsSchema = Record<string, never>,
  D extends Record<string, unknown> = Record<string, never>
>(
  definition: FigureDefinition<P, D>,
  initialOverrides?: Partial<InferParamsValues<P>>
): FigureParamsHookResult<P, D> {
  const schema = definition.params;

  const [params, setParams] = useState<InferParamsValues<P>>(() =>
    resolveDefaultParams(schema, initialOverrides)
  );

  const set = useCallback(
    <K extends keyof InferParamsValues<P>>(
      name: K,
      value: InferParamsValues<P>[K] | ((prev: InferParamsValues<P>[K]) => InferParamsValues<P>[K])
    ) => {
      setParams((prev) => {
        const config = schema?.[name as string];
        const nextRaw = typeof value === "function" ? (value as any)(prev[name]) : value;
        const sanitized = config ? (sanitizeParamValue(config, nextRaw) as InferParamsValues<P>[K]) : nextRaw;

        if (prev[name] === sanitized) return prev;
        return {
          ...prev,
          [name]: sanitized,
        };
      });
    },
    [schema]
  );

  const reset = useCallback(() => {
    setParams(resolveDefaultParams(schema, initialOverrides));
  }, [schema, initialOverrides]);

  const derived = useMemo(() => {
    if (definition.derive) {
      return definition.derive(params);
    }
    return {} as D;
  }, [definition, params]);

  return {
    params,
    derived,
    set,
    reset,
  };
}
