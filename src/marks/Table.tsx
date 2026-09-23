import React, { type ReactNode } from "react";
import { useTheme, resolveTone, type Tone } from "../theme/index.ts";
import { MathLabel } from "../text/MathLabel.tsx";
import { Label } from "../text/Label.tsx";
import { Line } from "./Line.tsx";

export interface TableCell {
  label: string;
  value?: number;
  tone?: Tone;
  bold?: boolean;
  kind?: "tex" | "text";
  fillOpacity?: number;
  highlight?: boolean;
  strokeTone?: Tone;
  dashed?: boolean;
}

export type TableCellInput = string | number | TableCell;

export interface TableTotalItem {
  label: string;
  value?: number;
  tone?: Tone;
  kind?: "tex" | "text";
}

export interface TableProps {
  x: number;
  y: number;
  rows: (string | { label: string; kind?: "tex" | "text" })[];
  cols: (string | { label: string; kind?: "tex" | "text" })[];
  data: TableCellInput[][];
  cellWidth?: number;
  cellHeight?: number;
  cellTone?: Tone;
  cellMax?: number;
  title?: string;
  rowTotals?: (string | number | TableTotalItem)[];
  rowTotalsTitle?: string;
  rowTotalsNote?: string;
  rowTotalsBarScale?: number;
  colTotals?: (string | number | TableTotalItem)[];
  colTotalsTitle?: string;
  colTotalsNote?: string;
  colTotalsBarScale?: number;
  className?: string;
  children?: ReactNode;
}

export function Table({
  x,
  y,
  rows,
  cols,
  data,
  cellWidth = 72,
  cellHeight = 72,
  cellTone = "accent",
  cellMax,
  title,
  rowTotals,
  rowTotalsTitle,
  rowTotalsNote,
  rowTotalsBarScale = 150,
  colTotals,
  colTotalsTitle,
  colTotalsNote,
  colTotalsBarScale = 110,
  className,
  children,
}: TableProps) {
  const theme = useTheme();

  const numCols = cols.length;
  const numRows = rows.length;
  const gridW = numCols * cellWidth;
  const gridH = numRows * cellHeight;
  const gridRight = x + gridW;
  const gridBottom = y + gridH;

  const surfaceColor = theme.color.surface;
  const borderColor = theme.color.border;
  const accentColor = resolveTone(cellTone, theme);

  return (
    <g className={`webnotes-table ${className ?? ""}`.trim()}>
      {/* Optional Table Title */}
      {title && (
        <MathLabel
          tex={title}
          x={x + gridW / 2}
          y={y - 40}
          anchor="center"
          size="title"
          tone="ink"
        />
      )}

      {/* Column Headers (above cells) */}
      {cols.map((col, j) => {
        const colLabel = typeof col === "string" ? col : col.label;
        const kind = typeof col === "string" ? "tex" : col.kind ?? "tex";
        const cx = x + j * cellWidth + cellWidth / 2;
        const cy = y - 12;
        return kind === "tex" ? (
          <MathLabel key={`ch-${j}`} tex={colLabel} x={cx} y={cy} anchor="s" size="label" tone="muted" />
        ) : (
          <Label key={`ch-${j}`} text={colLabel} x={cx} y={cy} anchor="s" size="label" tone="muted" />
        );
      })}

      {/* Row Headers (left of cells) */}
      {rows.map((row, i) => {
        const rowLabel = typeof row === "string" ? row : row.label;
        const kind = typeof row === "string" ? "tex" : row.kind ?? "tex";
        const cx = x - 18;
        const cy = y + i * cellHeight + cellHeight / 2;
        return kind === "tex" ? (
          <MathLabel key={`rh-${i}`} tex={rowLabel} x={cx} y={cy} anchor="e" size="label" tone="muted" />
        ) : (
          <Label key={`rh-${i}`} text={rowLabel} x={cx} y={cy} anchor="e" size="label" tone="muted" />
        );
      })}

      {/* Grid Cells */}
      {data.map((row, i) =>
        row.map((cellRaw, j) => {
          const cx = x + j * cellWidth;
          const cy = y + i * cellHeight;

          let labelStr: string;
          let val: number | undefined;
          let cellT = cellTone;
          let isBold = false;
          let kind: "tex" | "text" = "text";
          let opacity: number | undefined;
          let strokeT: Tone | undefined;
          let isDashed = false;

          if (typeof cellRaw === "object" && cellRaw !== null) {
            labelStr = cellRaw.label;
            val = cellRaw.value;
            if (cellRaw.tone) cellT = cellRaw.tone;
            isBold = Boolean(cellRaw.bold || cellRaw.highlight);
            kind = cellRaw.kind ?? "text";
            opacity = cellRaw.fillOpacity;
            strokeT = cellRaw.strokeTone;
            isDashed = Boolean(cellRaw.dashed);
          } else {
            labelStr = String(cellRaw);
            val = typeof cellRaw === "number" ? cellRaw : undefined;
          }

          if (opacity === undefined && val !== undefined && cellMax !== undefined && cellMax > 0) {
            opacity = (val / cellMax) * 0.5;
          }

          const fillToneColor = resolveTone(cellT, theme);
          const cellStroke = strokeT ? resolveTone(strokeT, theme) : borderColor;

          return (
            <g key={`cell-${i}-${j}`}>
              <rect
                x={cx}
                y={cy}
                width={cellWidth}
                height={cellHeight}
                fill={surfaceColor}
                stroke={cellStroke}
                strokeWidth={strokeT ? 1.6 : 1}
                strokeDasharray={isDashed ? "4 3" : undefined}
              />
              {opacity !== undefined && opacity > 0 && (
                <rect
                  x={cx}
                  y={cy}
                  width={cellWidth}
                  height={cellHeight}
                  fill={fillToneColor}
                  fillOpacity={opacity}
                />
              )}
              {kind === "tex" ? (
                <MathLabel
                  tex={labelStr}
                  x={cx + cellWidth / 2}
                  y={cy + cellHeight / 2}
                  anchor="center"
                  size="label"
                  tone={isBold ? cellT : "ink"}
                />
              ) : (
                <Label
                  text={labelStr}
                  x={cx + cellWidth / 2}
                  y={cy + cellHeight / 2}
                  anchor="center"
                  size="label"
                  fontWeight={isBold ? 700 : 500}
                  tone={isBold ? cellT : labelStr === "0" ? "muted" : "ink"}
                />
              )}
            </g>
          );
        })
      )}

      {/* Row Totals (Right margin) */}
      {rowTotals && (
        <g className="webnotes-table-row-totals">
          <Line x1={gridRight + 22} y1={y} x2={gridRight + 22} y2={gridBottom} tone="ink" weight="regular" />
          {rowTotals.map((totRaw, i) => {
            const cy = y + i * cellHeight + cellHeight / 2;
            const item: TableTotalItem =
              typeof totRaw === "object" && totRaw !== null
                ? totRaw
                : { label: String(totRaw), value: typeof totRaw === "number" ? totRaw : undefined };

            const w = item.value !== undefined ? (item.value / 8) * rowTotalsBarScale : 36;
            const itemTone = item.tone ?? "accent";
            const toneColor = resolveTone(itemTone, theme);

            return (
              <g key={`rt-${i}`}>
                <line
                  x1={gridRight + 4}
                  y1={cy}
                  x2={gridRight + 18}
                  y2={cy}
                  stroke={borderColor}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <rect
                  x={gridRight + 22}
                  y={cy - 13}
                  width={w}
                  height={26}
                  rx={2}
                  fill={theme.color.accentSubtle}
                  stroke={toneColor}
                  strokeWidth={1.2}
                />
                <Label
                  text={item.label}
                  x={gridRight + 30 + w}
                  y={cy}
                  anchor="w"
                  size="label"
                  fontWeight={600}
                  tone={itemTone}
                />
              </g>
            );
          })}
          {rowTotalsTitle && (
            <MathLabel
              tex={rowTotalsTitle}
              x={gridRight + 22}
              y={y - 14}
              anchor="w"
              size="label"
              tone="ink"
            />
          )}
          {rowTotalsNote && (
            <Label
              text={rowTotalsNote}
              x={gridRight + 22}
              y={gridBottom + 20}
              anchor="w"
              size="caption"
              tone="muted"
            />
          )}
        </g>
      )}

      {/* Column Totals (Bottom margin) */}
      {colTotals && (
        <g className="webnotes-table-col-totals">
          <Line x1={x} y1={gridBottom + 22} x2={gridRight} y2={gridBottom + 22} tone="ink" weight="regular" />
          {colTotals.map((totRaw, j) => {
            const cx = x + j * cellWidth + cellWidth / 2;
            const item: TableTotalItem =
              typeof totRaw === "object" && totRaw !== null
                ? totRaw
                : { label: String(totRaw), value: typeof totRaw === "number" ? totRaw : undefined };

            const h = item.value !== undefined ? (item.value / 8) * colTotalsBarScale : 30;
            const itemTone = item.tone ?? "accent";
            const toneColor = resolveTone(itemTone, theme);

            return (
              <g key={`ct-${j}`}>
                <line
                  x1={cx}
                  y1={gridBottom + 4}
                  x2={cx}
                  y2={gridBottom + 18}
                  stroke={borderColor}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <rect
                  x={cx - 15}
                  y={gridBottom + 22}
                  width={30}
                  height={h}
                  rx={2}
                  fill={theme.color.accentSubtle}
                  stroke={toneColor}
                  strokeWidth={1.2}
                />
                <Label
                  text={item.label}
                  x={cx}
                  y={gridBottom + 40 + h}
                  anchor="center"
                  size="label"
                  fontWeight={600}
                  tone={itemTone}
                />
              </g>
            );
          })}
          {colTotalsTitle && (
            <MathLabel
              tex={colTotalsTitle}
              x={x - 14}
              y={gridBottom + 60}
              anchor="e"
              size="label"
              tone="ink"
            />
          )}
          {colTotalsNote && (
            <Label
              text={colTotalsNote}
              x={x - 14}
              y={gridBottom + 86}
              anchor="e"
              size="caption"
              tone="muted"
            />
          )}
        </g>
      )}

      {children}
    </g>
  );
}
