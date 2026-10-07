import type { Mat2, Vec2 } from "./linalg.ts";

/** Column-vector convention: apply the matrix as written, including singular matrices. */
export function transformVector2(matrix: Mat2, vector: Vec2): Vec2 {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1],
  ];
}

export function transformPoint2(matrix: Mat2, point: Vec2, translation: Vec2 = [0, 0]): Vec2 {
  const [x, y] = transformVector2(matrix, point);
  return [x + translation[0], y + translation[1]];
}

/** Use for the vertices of a grid, polyline, polygon, or sampled curve. */
export function transformPoints2(matrix: Mat2, points: readonly Vec2[], translation: Vec2 = [0, 0]): Vec2[] {
  return points.map((point) => transformPoint2(matrix, point, translation));
}
