import { createContext, useContext } from "react";
import type { AnyParamConfig } from "./types.ts";

/**
 * The parameters of the figure being drawn, for marks that read or change one
 * by name, such as a drag handle bound to a point parameter. `set` exists only
 * in a live, mounted figure; a static render has values but no setter.
 */
export interface ParamBinding {
  values: Record<string, unknown>;
  schema: Record<string, AnyParamConfig>;
  set?: (name: string, value: unknown) => void;
}

export const ParamBindingContext = createContext<ParamBinding | null>(null);

export interface BoundParam<T> {
  value: T;
  config: AnyParamConfig;
  /** Present only when the figure is live. */
  set?: (value: T) => void;
}

/** Reads a declared parameter by name; throws if the figure does not declare it. */
export function useParam<T = unknown>(name: string): BoundParam<T> {
  const binding = useContext(ParamBindingContext);
  const config = binding?.schema[name];
  if (!binding || !config) {
    throw new Error(`No parameter named "${name}" is declared by this figure.`);
  }
  return {
    value: binding.values[name] as T,
    config,
    set: binding.set ? (value: T) => binding.set!(name, value) : undefined,
  };
}
