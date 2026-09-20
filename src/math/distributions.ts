import type { Vec2, Mat2 } from "./linalg.ts";

export function normalPdf(x: number, mean: number = 0, variance: number = 1): number {
  if (variance <= 0) throw new Error("Variance must be positive");
  const diff = x - mean;
  return (1 / Math.sqrt(2 * Math.PI * variance)) * Math.exp(-(diff * diff) / (2 * variance));
}

// Error function approximation (Abramowitz & Stegun 7.1.26, max error < 1.5e-7)
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1 / (1 + p * absX);
  const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  const y = 1 - poly * Math.exp(-absX * absX);
  return sign * y;
}

export function normalCdf(x: number, mean: number = 0, variance: number = 1): number {
  if (variance <= 0) throw new Error("Variance must be positive");
  const std = Math.sqrt(variance);
  return 0.5 * (1 + erf((x - mean) / (std * Math.SQRT2)));
}

export interface MixtureComponent {
  weight: number;
  mean: number;
  variance: number;
}

export function mixturePdf(x: number, components: readonly MixtureComponent[]): number {
  let sum = 0;
  for (const c of components) {
    sum += c.weight * normalPdf(x, c.mean, c.variance);
  }
  return sum;
}

export function mvnPdf2(point: Vec2, mean: Vec2, cov: Mat2): number {
  const det = cov[0][0] * cov[1][1] - cov[0][1] * cov[1][0];
  if (det <= 0) throw new Error("Covariance matrix must have positive determinant");

  const dx = point[0] - mean[0];
  const dy = point[1] - mean[1];

  // Quad form: d^T * inv(cov) * d = (cov[1][1]*dx^2 - 2*cov[0][1]*dx*dy + cov[0][0]*dy^2) / det
  const quad = (cov[1][1] * dx * dx - 2 * cov[0][1] * dx * dy + cov[0][0] * dy * dy) / det;
  const norm = 1 / (2 * Math.PI * Math.sqrt(det));
  return norm * Math.exp(-0.5 * quad);
}
