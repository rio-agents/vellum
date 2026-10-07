export type Vec2 = [number, number];
export type Mat2 = [[number, number], [number, number]];

export function det2(m: Mat2): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

export function inv2(m: Mat2): Mat2 {
  const d = det2(m);
  if (Math.abs(d) < 1e-14) throw new Error("Matrix is singular");
  return [
    [m[1][1] / d, -m[0][1] / d],
    [-m[1][0] / d, m[0][0] / d],
  ];
}

export function mul2(a: Mat2, b: Mat2): Mat2 {
  return [
    [
      a[0][0] * b[0][0] + a[0][1] * b[1][0],
      a[0][0] * b[0][1] + a[0][1] * b[1][1],
    ],
    [
      a[1][0] * b[0][0] + a[1][1] * b[1][0],
      a[1][0] * b[0][1] + a[1][1] * b[1][1],
    ],
  ];
}

export function transpose2(m: Mat2): Mat2 {
  return [
    [m[0][0], m[1][0]],
    [m[0][1], m[1][1]],
  ];
}

export function cov2(sx: number, sy: number, rho: number): Mat2 {
  return [
    [sx * sx, rho * sx * sy],
    [rho * sx * sy, sy * sy],
  ];
}

export function cholesky2(cov: Mat2): Mat2 {
  if (cov[0][0] <= 0) throw new Error("Covariance must be positive definite");
  const l11 = Math.sqrt(cov[0][0]);
  const l21 = cov[1][0] / l11;
  const rem = cov[1][1] - l21 * l21;
  const l22 = Math.sqrt(Math.max(0, rem));
  return [
    [l11, 0],
    [l21, l22],
  ];
}

export interface Eig2Result {
  values: [number, number];
  vectors: [Vec2, Vec2];
  axes: [Vec2, Vec2];
}

export function eig2(cov: Mat2): Eig2Result {
  const a = cov[0][0];
  const b = (cov[0][1] + cov[1][0]) / 2; // enforce symmetry
  const c = cov[1][1];

  const tr = a + c;
  const delta = Math.sqrt(Math.max(0, (a - c) * (a - c) + 4 * b * b));
  const lam1 = (tr + delta) / 2;
  const lam2 = (tr - delta) / 2;

  let q1: Vec2;
  if (Math.abs(b) > 1e-12) {
    const v: Vec2 = [b, lam1 - a];
    const len = Math.hypot(v[0], v[1]);
    q1 = [v[0] / len, v[1] / len];
  } else if (a >= c) {
    q1 = [1, 0];
  } else {
    q1 = [0, 1];
  }

  // Ensure q1 points into positive x-halfplane for stability
  if (q1[0] < 0 || (Math.abs(q1[0]) < 1e-12 && q1[1] < 0)) {
    q1 = [-q1[0], -q1[1]];
  }

  // Right-handed orthonormal partner: [-q1[1], q1[0]]
  const q2: Vec2 = [-q1[1], q1[0]];

  const sqrt1 = Math.sqrt(Math.max(0, lam1));
  const sqrt2 = Math.sqrt(Math.max(0, lam2));
  const axes: [Vec2, Vec2] = [
    [q1[0] * sqrt1, q1[1] * sqrt1],
    [q2[0] * sqrt2, q2[1] * sqrt2],
  ];

  return {
    values: [lam1, lam2],
    vectors: [q1, q2],
    axes,
  };
}

export type Transform2 = Mat2 | { cov: Mat2 } | { cholesky: Mat2 };

export function affine2(points: readonly Vec2[], transform: Transform2, mean: Vec2 = [0, 0]): Vec2[] {
  let L: Mat2;
  if ("cov" in transform) {
    L = cholesky2(transform.cov);
  } else if ("cholesky" in transform) {
    L = transform.cholesky;
  } else {
    L = transform;
  }

  return points.map(([x, y]) => [
    mean[0] + L[0][0] * x + L[0][1] * y,
    mean[1] + L[1][0] * x + L[1][1] * y,
  ]);
}

export function matVec(matrix: readonly number[][], vec: readonly number[]): number[] {
  const result: number[] = new Array(matrix.length);
  for (let i = 0; i < matrix.length; i++) {
    let sum = 0;
    const row = matrix[i];
    for (let j = 0; j < vec.length; j++) {
      sum += row[j] * vec[j];
    }
    result[i] = sum;
  }
  return result;
}

export function matMul(a: readonly number[][], b: readonly number[][]): number[][] {
  const rows = a.length;
  const cols = b[0].length;
  const inner = b.length;
  const result: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let k = 0; k < inner; k++) {
      const aik = a[i][k];
      for (let j = 0; j < cols; j++) {
        result[i][j] += aik * b[k][j];
      }
    }
  }
  return result;
}
