export class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    let hash = 0xdeadbeef;
    for (let index = 0; index < seed.length; index += 1) {
      hash = Math.imul(hash ^ seed.charCodeAt(index), 2654435761);
    }
    this.seed = (hash ^ (hash >>> 16)) >>> 0;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}
