export type Vec2 = [number, number];

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededUniform(seed: number, min: number = 0, max: number = 1): () => number {
  const rng = seededRandom(seed);
  return () => min + (max - min) * rng();
}

/**
 * Returns `count` pairs [e1, e2] of independent standard Normal draws (Box-Muller).
 * Matches the existing implementation in src/components/diagrams/gaussian-samples.mjs.
 */
export function seededNormals(count: number, seed: number): Vec2[] {
  const random = seededRandom(seed);
  const pairs: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    const u1 = Math.max(random(), 1e-12);
    const u2 = random();
    const radius = Math.sqrt(-2 * Math.log(u1));
    pairs.push([radius * Math.cos(2 * Math.PI * u2), radius * Math.sin(2 * Math.PI * u2)]);
  }
  return pairs;
}
