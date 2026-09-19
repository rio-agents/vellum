import type {
  NumberParamConfig,
  BooleanParamConfig,
  ChoiceParamConfig,
  ChoiceOption,
  PointParamConfig,
  TimeParamConfig,
} from "./types.ts";

export type NumberParamInput = Omit<NumberParamConfig, "type">;
export type BooleanParamInput = Omit<BooleanParamConfig, "type">;
export type ChoiceParamInput<T extends string = string> = Omit<ChoiceParamConfig<T>, "type">;
export type PointParamInput = Omit<PointParamConfig, "type">;
export type TimeParamInput = Omit<TimeParamConfig, "type">;

export const param = {
  number(config: NumberParamInput): NumberParamConfig {
    return {
      type: "number",
      labelKind: config.labelKind ?? "tex",
      ...config,
    };
  },

  boolean(config: BooleanParamInput): BooleanParamConfig {
    return {
      type: "boolean",
      labelKind: config.labelKind ?? "tex",
      ...config,
    };
  },

  choice<T extends string = string>(config: ChoiceParamInput<T>): ChoiceParamConfig<T> {
    return {
      type: "choice",
      labelKind: config.labelKind ?? "tex",
      ...config,
    };
  },

  point(config: PointParamInput): PointParamConfig {
    return {
      type: "point",
      labelKind: config.labelKind ?? "tex",
      ...config,
    };
  },

  time(config: TimeParamInput): TimeParamConfig {
    return {
      type: "time",
      labelKind: config.labelKind ?? "tex",
      ...config,
    };
  },
};
