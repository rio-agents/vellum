import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  scaleLinear,
  niceDomain,
  seededRandom,
  seededNormals,
  seededUniform,
  normalPdf,
  normalCdf,
  mixturePdf,
  mvnPdf2,
  det2,
  inv2,
  mul2,
  transpose2,
  cov2,
  cholesky2,
  eig2,
  affine2,
  matVec,
  matMul,
  ellipsePoints,
  ellipseTangentPoints,
  projectOnto,
  clipLineToBox,
  rotate2,
  type Mat2,
  type Vec2,
} from "../src/math/index.ts";
import { defaultTheme, resolveTone } from "../src/theme/index.ts";

function approx(actual: number, expected: number, eps = 1e-4, msg?: string) {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${msg ?? "Expected"} ${actual} ≈ ${expected} (diff: ${Math.abs(actual - expected)} > ${eps})`
  );
}

describe("Math Core", () => {
  describe("scale.ts", () => {
    it("maps domain to range and inverts correctly", () => {
      const scale = scaleLinear({ domain: [0, 10], range: [0, 100] });
      assert.equal(scale(5), 50);
      assert.equal(scale.invert(50), 5);
      assert.deepEqual(scale.domain(), [0, 10]);
      assert.deepEqual(scale.range(), [0, 100]);
      assert.ok(scale.ticks(5).length > 0);
      assert.equal(scale.tickFormat(5)(5), "5");
    });

    it("niceDomain extends domain to clean bounds", () => {
      const nice = niceDomain([0.12, 9.87], 5);
      assert.ok(nice[0] <= 0);
      assert.ok(nice[1] >= 10);
    });
  });

  describe("random.ts", () => {
    it("produces deterministic random sequences across runs", () => {
      const r1 = seededRandom(42);
      const r2 = seededRandom(42);
      const seq1 = [r1(), r1(), r1(), r1()];
      const seq2 = [r2(), r2(), r2(), r2()];
      assert.deepEqual(seq1, seq2);

      const u1 = seededUniform(42, 10, 20)();
      const u2 = seededUniform(42, 10, 20)();
      assert.equal(u1, u2);
      assert.ok(u1 >= 10 && u1 <= 20);
    });

    it("seededNormals produces deterministic pairs with zero mean", () => {
      const pairs1 = seededNormals(100, 41);
      const pairs2 = seededNormals(100, 41);
      assert.deepEqual(pairs1, pairs2);

      // Verify approximate zero mean and unit variance for 1000 samples
      const big = seededNormals(2000, 12345);
      let sumX = 0;
      let sumY = 0;
      let sumSqX = 0;
      for (const [x, y] of big) {
        sumX += x;
        sumY += y;
        sumSqX += x * x;
      }
      approx(sumX / 2000, 0, 0.1, "Normal mean X");
      approx(sumY / 2000, 0, 0.1, "Normal mean Y");
      approx(sumSqX / 2000, 1, 0.15, "Normal variance X");
    });
  });

  describe("distributions.ts", () => {
    it("computes normalPdf and normalCdf accurately", () => {
      // Standard normal peak at 0 is 1 / sqrt(2pi) ≈ 0.398942
      approx(normalPdf(0, 0, 1), 0.39894228);
      approx(normalPdf(1, 0, 1), 0.2419707);

      // CDF at 0 is 0.5; at 1.96 is ~0.975; at -1.96 is ~0.025
      approx(normalCdf(0, 0, 1), 0.5);
      approx(normalCdf(1.95996, 0, 1), 0.975);
      approx(normalCdf(-1.95996, 0, 1), 0.025);
    });

    it("computes mixturePdf as linear combination", () => {
      const comps = [
        { weight: 0.4, mean: -2, variance: 1 },
        { weight: 0.6, mean: 2, variance: 1 },
      ];
      const expected = 0.4 * normalPdf(0, -2, 1) + 0.6 * normalPdf(0, 2, 1);
      approx(mixturePdf(0, comps), expected);
    });

    it("computes mvnPdf2 correctly", () => {
      const mean: Vec2 = [0, 0];
      const cov: Mat2 = [
        [1, 0],
        [0, 1],
      ];
      // At origin: 1 / (2pi * 1) ≈ 0.159155
      approx(mvnPdf2([0, 0], mean, cov), 1 / (2 * Math.PI));
    });
  });

  describe("linalg.ts", () => {
    it("handles det2, inv2, mul2, transpose2", () => {
      const m: Mat2 = [
        [1, 2],
        [3, 4],
      ];
      assert.equal(det2(m), -2);
      const inv = inv2(m);
      const identity = mul2(m, inv);
      approx(identity[0][0], 1);
      approx(identity[0][1], 0);
      approx(identity[1][0], 0);
      approx(identity[1][1], 1);

      const trans = transpose2(m);
      assert.deepEqual(trans, [
        [1, 3],
        [2, 4],
      ]);
    });

    it("matches the covariance note verified numbers for Sigma = [[0.7, 0.25], [0.25, 0.4]]", () => {
      const sigma: Mat2 = [
        [0.7, 0.25],
        [0.25, 0.4],
      ];

      // Eigenvalues and eigenvectors
      const eig = eig2(sigma);
      approx(eig.values[0], 0.841548, 1e-4, "lambda1");
      approx(eig.values[1], 0.258452, 1e-4, "lambda2");

      approx(eig.vectors[0][0], 0.8702, 1e-3, "q1_x");
      approx(eig.vectors[0][1], 0.4927, 1e-3, "q1_y");

      // Verify orthogonality
      approx(
        eig.vectors[0][0] * eig.vectors[1][0] + eig.vectors[0][1] * eig.vectors[1][1],
        0,
        1e-6,
        "q1 . q2 = 0"
      );

      // Cholesky factor
      const L = cholesky2(sigma);
      approx(L[0][0], 0.8367, 1e-3, "L11");
      approx(L[0][1], 0, 1e-6, "L12");
      approx(L[1][0], 0.2988, 1e-3, "L21");
      approx(L[1][1], 0.5574, 1e-3, "L22");

      // Verify L * L^T = sigma
      const recon = mul2(L, transpose2(L));
      approx(recon[0][0], 0.7);
      approx(recon[0][1], 0.25);
      approx(recon[1][0], 0.25);
      approx(recon[1][1], 0.4);

      // Directional variances: u^T * Sigma * u
      // Along (1, 1)/sqrt(2):
      const u1 = [1 / Math.SQRT2, 1 / Math.SQRT2];
      const var1 =
        u1[0] * (sigma[0][0] * u1[0] + sigma[0][1] * u1[1]) +
        u1[1] * (sigma[1][0] * u1[0] + sigma[1][1] * u1[1]);
      approx(var1, 0.8, 1e-6, "Directional variance along (1,1)/sqrt(2)");

      // Along (1, -1)/sqrt(2):
      const u2 = [1 / Math.SQRT2, -1 / Math.SQRT2];
      const var2 =
        u2[0] * (sigma[0][0] * u2[0] + sigma[0][1] * u2[1]) +
        u2[1] * (sigma[1][0] * u2[0] + sigma[1][1] * u2[1]);
      approx(var2, 0.3, 1e-6, "Directional variance along (1,-1)/sqrt(2)");
    });

    it("transforms points with affine2", () => {
      const sigma: Mat2 = [
        [0.7, 0.25],
        [0.25, 0.4],
      ];
      const points: Vec2[] = [
        [1, 0],
        [0, 1],
      ];
      const transformed = affine2(points, { cov: sigma }, [1, 2]);
      const L = cholesky2(sigma);
      approx(transformed[0][0], 1 + L[0][0]);
      approx(transformed[0][1], 2 + L[1][0]);
      approx(transformed[1][0], 1 + L[0][1]);
      approx(transformed[1][1], 2 + L[1][1]);
    });

    it("computes cov2 from standard deviations and correlation", () => {
      const c = cov2(0.83666, 0.6324555, 0.4724556);
      approx(c[0][0], 0.7, 1e-3);
      approx(c[1][1], 0.4, 1e-3);
      approx(c[0][1], 0.25, 1e-3);
    });

    it("handles general matVec and matMul", () => {
      const A = [
        [1, 2, 3],
        [4, 5, 6],
      ];
      const x = [1, 2, 3];
      assert.deepEqual(matVec(A, x), [14, 32]);

      const B = [
        [7, 8],
        [9, 1],
        [2, 3],
      ];
      assert.deepEqual(matMul(A, B), [
        [31, 19],
        [85, 55],
      ]);
    });
  });

  describe("geometry.ts", () => {
    it("generates closed ellipsePoints", () => {
      const sigma: Mat2 = [
        [0.7, 0.25],
        [0.25, 0.4],
      ];
      const pts = ellipsePoints([0, 0], sigma, 1, 100);
      assert.equal(pts.length, 101);
      approx(pts[0][0], pts[100][0]);
      approx(pts[0][1], pts[100][1]);

      // Every point on boundary must satisfy x^T * inv(sigma) * x = 1
      const invSigma = inv2(sigma);
      for (const [x, y] of pts) {
        const val =
          x * (invSigma[0][0] * x + invSigma[0][1] * y) +
          y * (invSigma[1][0] * x + invSigma[1][1] * y);
        approx(val, 1, 1e-3);
      }
    });

    it("calculates ellipseTangentPoints correctly", () => {
      const sigma: Mat2 = [
        [0.7, 0.25],
        [0.25, 0.4],
      ];
      const tp = ellipseTangentPoints(sigma, 1);
      approx(tp.xMax[0], Math.sqrt(0.7));
      approx(tp.xMax[1], 0.25 / Math.sqrt(0.7));
      approx(tp.yMax[1], Math.sqrt(0.4));
      approx(tp.yMax[0], 0.25 / Math.sqrt(0.4));

      // Verify tangent points satisfy x^T * inv(sigma) * x = 1
      const invSigma = inv2(sigma);
      const valX =
        tp.xMax[0] * (invSigma[0][0] * tp.xMax[0] + invSigma[0][1] * tp.xMax[1]) +
        tp.xMax[1] * (invSigma[1][0] * tp.xMax[0] + invSigma[1][1] * tp.xMax[1]);
      approx(valX, 1, 1e-4);

      const valY =
        tp.yMax[0] * (invSigma[0][0] * tp.yMax[0] + invSigma[0][1] * tp.yMax[1]) +
        tp.yMax[1] * (invSigma[1][0] * tp.yMax[0] + invSigma[1][1] * tp.yMax[1]);
      approx(valY, 1, 1e-4);
    });

    it("projects points onto directions", () => {
      const p: Vec2 = [3, 4];
      const dir: Vec2 = [1, 0];
      const proj = projectOnto(p, dir);
      assert.deepEqual(proj, [3, 0]);
    });

    it("clips lines to box", () => {
      const box = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
      const res = clipLineToBox([0, 0], [1, 1], box);
      assert(res);
      assert.deepEqual(res[0], [-2, -2]);
      assert.deepEqual(res[1], [2, 2]);

      const miss = clipLineToBox([5, 5], [1, 0], box);
      assert.equal(miss, null);
    });

    it("rotates points in 2D", () => {
      const p: Vec2 = [1, 0];
      const rot = rotate2(p, Math.PI / 2);
      approx(rot[0], 0);
      approx(rot[1], 1);
    });
  });

  describe("theme.ts", () => {
    it("resolves roles from defaultTheme correctly", () => {
      assert.equal(resolveTone("ink", defaultTheme), defaultTheme.color.ink);
      assert.equal(resolveTone("accent", defaultTheme), defaultTheme.color.accent);
      assert.equal(resolveTone("series1", defaultTheme), defaultTheme.color.series[0]);
      assert.equal(resolveTone("series6", defaultTheme), defaultTheme.color.series[5]);
    });
  });
});
