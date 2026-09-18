export interface FigureDefinition<P = Record<string, any>, D = Record<string, any>> {
  id: string;
  title?: string;
  description: string;
  size: { width: number; height: number };
  params?: P;
  derive?: (params: any) => D;
  render: (ctx: { params: any; derived: D; theme: any; time?: number }) => any;
  controls?: any;
  player?: any;
}

export function defineFigure<P = Record<string, any>, D = Record<string, any>>(
  def: FigureDefinition<P, D>
): FigureDefinition<P, D> {
  return def;
}
