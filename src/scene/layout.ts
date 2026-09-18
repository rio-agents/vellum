export interface RectArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridOptions {
  columns: number;
  rows: number;
  area: RectArea;
  gap?: number | { x?: number; y?: number };
}

export function grid({ columns, rows, area, gap = 20 }: GridOptions): RectArea[] {
  const gapX = typeof gap === "number" ? gap : (gap.x ?? 20);
  const gapY = typeof gap === "number" ? gap : (gap.y ?? 20);

  const colWidth = (area.width - (columns - 1) * gapX) / columns;
  const rowHeight = (area.height - (rows - 1) * gapY) / rows;

  const cells: RectArea[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      cells.push({
        x: Number((area.x + c * (colWidth + gapX)).toFixed(2)),
        y: Number((area.y + r * (rowHeight + gapY)).toFixed(2)),
        width: Number(colWidth.toFixed(2)),
        height: Number(rowHeight.toFixed(2)),
      });
    }
  }
  return cells;
}

export interface StackOptions {
  x: number;
  y: number;
  gap?: number;
  count: number;
}

export function stack({ x, y, gap = 20, count }: StackOptions): { x: number; y: number }[] {
  const items: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      x,
      y: Number((y + i * gap).toFixed(2)),
    });
  }
  return items;
}
