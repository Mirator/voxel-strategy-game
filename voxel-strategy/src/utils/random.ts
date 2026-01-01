// Seeded random number generator for deterministic procedural generation
import seedrandom from 'seedrandom';

export class SeededRandom {
  private rng: seedrandom.PRNG;
  
  constructor(seed: string) {
    this.rng = seedrandom(seed);
  }

  // Returns a random float between 0 and 1
  random(): number {
    return this.rng();
  }

  // Returns a random integer between min (inclusive) and max (exclusive)
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  // Returns a random float between min and max
  randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  // Returns a random element from an array
  randomElement<T>(array: T[]): T {
    return array[this.randomInt(0, array.length)];
  }

  // Shuffle an array in place using Fisher-Yates algorithm
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Returns true with the given probability (0-1)
  chance(probability: number): boolean {
    return this.random() < probability;
  }

  // Generate a random string ID
  randomId(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(this.randomInt(0, chars.length));
    }
    return result;
  }

  // Gaussian/normal distribution random number
  gaussian(mean: number = 0, stddev: number = 1): number {
    // Box-Muller transform
    const u1 = this.random();
    const u2 = this.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stddev + mean;
  }

  // Pick multiple unique random elements from array
  pickMultiple<T>(array: T[], count: number): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  }
}

// Generate a random seed string
export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 15);
}
