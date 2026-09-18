import { scaleLinear as d3ScaleLinear } from "d3-scale";

export interface LinearScaleOptions {
  domain: [number, number];
  range: [number, number];
}

export interface LinearScale {
  (x: number): number;
  invert(y: number): number;
  domain(): [number, number];
  range(): [number, number];
  ticks(count?: number): number[];
  tickFormat(count?: number, specifier?: string): (d: number) => string;
}

export function scaleLinear(options: LinearScaleOptions): LinearScale {
  const scale = d3ScaleLinear().domain(options.domain).range(options.range);
  const fn = ((x: number) => scale(x)) as LinearScale;
  fn.invert = (y: number) => scale.invert(y);
  fn.domain = () => scale.domain() as [number, number];
  fn.range = () => scale.range() as [number, number];
  fn.ticks = (count?: number) => scale.ticks(count);
  fn.tickFormat = (count?: number, specifier?: string) => scale.tickFormat(count, specifier);
  return fn;
}

export function niceDomain(domain: [number, number], count: number = 5): [number, number] {
  const scale = d3ScaleLinear().domain(domain).nice(count);
  return scale.domain() as [number, number];
}
