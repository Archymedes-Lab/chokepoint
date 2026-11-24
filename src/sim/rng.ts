/**
 * Deterministic, seedable PRNG (mulberry32) so every simulation run and
 * Monte-Carlo batch is reproducible from a seed. Reproducibility matters:
 * a defender comparing two postures must know the difference came from the
 * controls, not from random noise.
 */
export class RNG {
  private state: number;

  constructor(seed: number) {
    // Avoid a zero state, which would collapse the generator.
    this.state = (seed >>> 0) || 0x9e3779b9;
  }

  /** Uniform float in [0, 1). */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Uniform float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Pick an index from a weight array (weights need not sum to 1). */
  weightedIndex(weights: number[]): number {
    const total = weights.reduce((a, b) => a + Math.max(0, b), 0);
    if (total <= 0) return 0;
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= Math.max(0, weights[i]);
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }
}

/** Create a 32-bit seed from an arbitrary string (FNV-1a). */
export function seedFromString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
