import { useTheme, resolveTone, type Tone, type TextRole } from "../theme/index.ts";
import { resolveDash, type Dash } from "./style-helpers.ts";
import { Label } from "../text/Label.tsx";

export interface LegendEntry {
  label: string;
  tone: Tone;
  dash?: Dash;
  shape?: "line" | "point" | "rect";
}

export interface LegendProps {
  entries: readonly LegendEntry[];
  x: number;
  y: number;
  lineLength?: number;
  gap?: number;
  size?: TextRole;
  className?: string;
}

export function Legend({
  entries,
  x,
  y,
  lineLength = 36,
  gap = 26,
  size = "label",
  className,
}: LegendProps) {
  const theme = useTheme();

  return (
    <g className={`vellum-legend ${className ?? ""}`.trim()}>
      {entries.map((entry, idx) => {
        const itemY = y + idx * gap;
        const color = resolveTone(entry.tone, theme);
        const dasharray = resolveDash(entry.dash);
        const shape = entry.shape ?? "line";

        return (
          <g key={idx}>
            {shape === "line" && (
              <line
                x1={x}
                y1={itemY}
                x2={x + lineLength}
                y2={itemY}
                stroke={color}
                strokeWidth={2}
                strokeDasharray={dasharray}
              />
            )}
            {shape === "point" && (
              <circle
                cx={x + lineLength / 2}
                cy={itemY}
                r={3.5}
                fill={color}
              />
            )}
            {shape === "rect" && (
              <rect
                x={x}
                y={itemY - 6}
                width={lineLength}
                height={12}
                fill={color}
                fillOpacity={0.4}
                stroke={color}
                strokeWidth={1}
              />
            )}
            <Label
              text={entry.label}
              x={x + lineLength + 10}
              y={itemY}
              anchor="w"
              size={size}
              tone="ink"
            />
          </g>
        );
      })}
    </g>
  );
}
