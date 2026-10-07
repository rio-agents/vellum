export type ParamKind = "number" | "boolean" | "choice" | "point" | "time";

export interface BaseParamConfig<T = unknown> {
  type: ParamKind;
  default: T;
  label?: string;
  labelKind?: "tex" | "text";
  hidden?: boolean;
}

export interface NumberParamConfig extends BaseParamConfig<number> {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
}

export interface BooleanParamConfig extends BaseParamConfig<boolean> {
  type: "boolean";
}

export interface ChoiceOption<T extends string = string> {
  value: T;
  label: string;
}

export interface ChoiceParamConfig<T extends string = string> extends BaseParamConfig<T> {
  type: "choice";
  options: ChoiceOption<T>[] | readonly ChoiceOption<T>[];
}

export interface PointParamConfig extends BaseParamConfig<[number, number]> {
  type: "point";
  bounds?: { x?: [number, number]; y?: [number, number] };
}

export interface TimeParamConfig extends BaseParamConfig<number> {
  type: "time";
  /** Timeline length in seconds. Must be finite and positive. */
  duration: number;
  loop?: boolean;
}

export type AnyParamConfig =
  | NumberParamConfig
  | BooleanParamConfig
  | ChoiceParamConfig<any>
  | PointParamConfig
  | TimeParamConfig;

export type FigureParamsSchema = Record<string, AnyParamConfig>;

export type InferParamValue<P> =
  P extends ChoiceParamConfig<infer T>
    ? T
    : P extends PointParamConfig
      ? [number, number]
      : P extends NumberParamConfig
        ? number
        : P extends BooleanParamConfig
          ? boolean
          : P extends TimeParamConfig
            ? number
            : P extends { default: infer V }
              ? V
              : unknown;

export type InferParamsValues<P extends FigureParamsSchema> = {
  [K in keyof P]: InferParamValue<P[K]>;
};
