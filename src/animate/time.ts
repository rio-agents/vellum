import type { FigureParamsSchema, TimeParamConfig } from "../params/types.ts";

export interface TimeParameter {
  name: string;
  config: TimeParamConfig;
}

/** A figure has at most one timeline, regardless of its parameter's name. */
export function timeParameter(schema?: FigureParamsSchema): TimeParameter | undefined {
  const entries = Object.entries(schema ?? {}).filter(([, config]) => config.type === "time");
  if (entries.length > 1) throw new Error("A figure may declare only one time parameter.");
  if (!entries.length) return undefined;
  const [name, config] = entries[0] as [string, TimeParamConfig];
  if (!Number.isFinite(config.duration) || config.duration <= 0) {
    throw new Error(`Time parameter "${name}" needs a finite, positive duration in seconds.`);
  }
  if (!Number.isFinite(config.default)) {
    throw new Error(`Time parameter "${name}" needs a finite default.`);
  }
  return { name, config };
}

export function figureTime(schema: FigureParamsSchema | undefined, params: Record<string, unknown>): number {
  const timeline = timeParameter(schema);
  return timeline ? params[timeline.name] as number : 0;
}
