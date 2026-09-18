import React, { type ReactNode, type CSSProperties, createContext, useContext } from "react";
import { MarkerDefs } from "../marks/markers.tsx";
import { useTheme, resolveTone } from "../theme/index.ts";

export interface FigureProps {
  id?: string;
  title?: string;
  eyebrow?: string;
  description?: string;
  size?: { width: number; height: number };
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface FigureDefinitionContextValue {
  id?: string;
  title?: string;
  description?: string;
  size?: { width: number; height: number };
}

export const FigureDefinitionContext = createContext<FigureDefinitionContextValue>({});

export function useFigureDefinition(): FigureDefinitionContextValue {
  return useContext(FigureDefinitionContext);
}

interface FigureContextValue {
  id: string;
  width: number;
  height: number;
}

const FigureContext = createContext<FigureContextValue>({
  id: "figure",
  width: 720,
  height: 460,
});

export function useFigureContext(): FigureContextValue {
  return useContext(FigureContext);
}

export function Figure({
  id: propId,
  title: propTitle,
  eyebrow: propEyebrow,
  description: propDescription,
  size: propSize,
  children,
  className,
  style,
}: FigureProps) {
  const def = useFigureDefinition();
  const theme = useTheme();

  const id = propId ?? def.id ?? "figure";
  const title = propTitle ?? def.title;
  const description = propDescription ?? def.description;
  const size = propSize ?? def.size ?? { width: 720, height: 460 };
  const { width, height } = size;

  const headerText = propEyebrow ?? title;

  return (
    <FigureContext.Provider value={{ id, width, height }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={description ?? title ?? "Mathematical figure"}
        className={`webnotes-figure-svg ${className ?? ""}`.trim()}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          fontFamily: theme.font.sans,
          ...style,
        }}
      >
        {description && <title>{description}</title>}
        <defs>
          <MarkerDefs />
        </defs>

        {headerText && (
          <text
            x={width / 2}
            y={24}
            textAnchor="middle"
            fontFamily={theme.font.sans}
            fontSize={theme.text.eyebrow}
            fontWeight={700}
            letterSpacing={1.5}
            fill={resolveTone("muted", theme)}
          >
            {headerText.toUpperCase()}
          </text>
        )}

        {children}
      </svg>
    </FigureContext.Provider>
  );
}
