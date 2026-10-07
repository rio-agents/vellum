import React from "react";
import { defineFigure, Figure, Panel, Axes, Line, Curve, Point, Vector, Label, MathLabel, param,
  easing, stageProgress, lerpMatrix2, transformPoints2, transformVector2, type Vec2, type Mat2 } from "../src/index.ts";

const identity: Mat2 = [[1, 0], [0, 1]];
const collapse: Mat2 = [[1, 0], [0, 0]];
const circle: Vec2[] = Array.from({ length: 97 }, (_, i) => [Math.cos(i * Math.PI / 48), Math.sin(i * Math.PI / 48)]);
const points: Vec2[] = [[0.8, 1.2], [0.8, 0], [0.8, -1.2]];
const ticks = [-2, -1, 0, 1, 2];
const grid: [Vec2, Vec2][] = ticks.flatMap((tick): [Vec2, Vec2][] => [
  [[tick, -2], [tick, 2]], [[-2, tick], [2, tick]],
]);
const geometry = {
  wide: { left: { x: 20, y: 65, width: 310, height: 280 }, right: { x: 390, y: 65, width: 310, height: 280 },
    headings: [175, 545], outputHeadingY: 28, readoutY: 366, captionY: 394 },
  compact: { left: { x: 16, y: 48, width: 308, height: 238 }, right: { x: 16, y: 352, width: 308, height: 238 },
    headings: [170, 170], outputHeadingY: 332, readoutY: 622, captionY: 650 },
};

export default defineFigure({
  id: "linear-map-flattening",
  description: "A grid and unit circle flatten vertically. At exact collapse, three marked inputs share one output, the image is the horizontal axis, and the kernel is the vertical axis.",
  layouts: { wide: { width: 720, height: 418 }, compact: { width: 340, height: 678 } },
  params: { elapsed: param.time({ default: 0, duration: 8, label: "Time", labelKind: "text" }) },
  derive: ({ elapsed }) => {
    const matrix = lerpMatrix2(identity, collapse, stageProgress(elapsed, 0, 6, easing.easeInOut));
    return { matrix, epsilon: matrix[1][1], collapsed: matrix[1][1] === 0 };
  },
  render: ({ layout, size, derived }) => {
    const place = geometry[layout];
    const { matrix, epsilon, collapsed } = derived;
    const panels = [place.left, place.right];
    return (
      <Figure>
        <Label text="INPUT SPACE" x={place.headings[0]} y={28} size="label" />
        <Label text="TRANSFORMED OUTPUT" x={place.headings[1]} y={place.outputHeadingY} size="label" />
        {panels.map((area, index) => {
          const transform = index ? matrix : identity;
          return (
            <Panel key={index} area={area} x={[-2.4, 2.4]} y={[-2.4, 2.4]} aspect="equal" clip>
              {grid.map((segment, i) => {
                const [from, to] = transformPoints2(transform, segment);
                return <Line key={i} from={from} to={to} tone="border" weight="hairline" />;
              })}
              <Axes />
              {collapsed && <Line from={index ? [-2.3, 0] : [0, -2.3]} to={index ? [2.3, 0] : [0, 2.3]}
                tone={index ? "accent" : "series3"} dash={index ? "solid" : "dashed"} weight="bold" />}
              <Curve points={transformPoints2(transform, circle)} tone="accent" weight="bold" />
              <Vector to={transformVector2(transform, [1, 0])} tone="accent" />
              {(!index || !collapsed) && <Vector to={transformVector2(transform, [0, 1])} tone="series3" />}
              {points.map((point, i) => (!index || !collapsed || i === 1) && (
                <Point key={i} at={transformVector2(transform, point)} radius={4} tone="ink"
                  label={index && collapsed ? "a, b, c" : ["a", "b", "c"][i]} labelKind="text"
                  labelOffset={[10, 0]} />
              ))}
            </Panel>
          );
        })}
        <MathLabel tex={String.raw`T_\varepsilon(x,y)=(x,\varepsilon y)`} x={size.width / 2}
          y={layout === "wide" ? 50 : 307} size="math" />
        <Label text={`ε = ${epsilon === 0 ? "0 (exact collapse)" : epsilon < 0.001 ? epsilon.toExponential(2) : epsilon.toFixed(3)} · rank ${collapsed ? 1 : 2} · nullity ${collapsed ? 1 : 0}`}
          x={size.width / 2} y={place.readoutY} size="caption" />
        <Label text={collapsed ? "Vertical input changes are now invisible." : "A selected region, not the entire image."}
          x={size.width / 2} y={place.captionY} size="caption" tone="muted" />
      </Figure>
    );
  },
});
