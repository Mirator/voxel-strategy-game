// Unit tests for SeededRandom utility
import { describe, it, expect } from 'vitest';
import { SeededRandom, generateSeed } from '../../src/utils/random';

describe('SeededRandom', () => {
  describe('constructor', () => {
    it('should create a random generator with a seed', () => {
      const rng = new SeededRandom('test-seed');
      expect(rng).toBeDefined();
    });
  });

  describe('determinism', () => {
    it('should produce the same sequence with the same seed', () => {
      const rng1 = new SeededRandom('test-seed-123');
      const rng2 = new SeededRandom('test-seed-123');
      
      const sequence1 = Array.from({ length: 10 }, () => rng1.random());
      const sequence2 = Array.from({ length: 10 }, () => rng2.random());
      
      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = new SeededRandom('seed-a');
      const rng2 = new SeededRandom('seed-b');
      
      const value1 = rng1.random();
      const value2 = rng2.random();
      
      expect(value1).not.toEqual(value2);
    });
  });

  describe('random()', () => {
    it('should return values between 0 and 1', () => {
      const rng = new SeededRandom('bounds-test');
      
      for (let i = 0; i < 100; i++) {
        const value = rng.random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('randomInt()', () => {
    it('should return integers within the specified range', () => {
      const rng = new SeededRandom('int-test');
      const min = 5;
      const max = 15;
      
      for (let i = 0; i < 100; i++) {
        const value = rng.randomInt(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThan(max);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('should be able to return the minimum value', () => {
      const rng = new SeededRandom('min-test');
      const values = Array.from({ length: 1000 }, () => rng.randomInt(0, 3));
      expect(values).toContain(0);
    });
  });

  describe('randomFloat()', () => {
    it('should return floats within the specified range', () => {
      const rng = new SeededRandom('float-test');
      const min = 2.5;
      const max = 7.5;
      
      for (let i = 0; i < 100; i++) {
        const value = rng.randomFloat(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
      }
    });
  });

  describe('randomElement()', () => {
    it('should return an element from the array', () => {
      const rng = new SeededRandom('element-test');
      const array = ['apple', 'banana', 'cherry', 'date'];
      
      for (let i = 0; i < 50; i++) {
        const element = rng.randomElement(array);
        expect(array).toContain(element);
      }
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom('element-seed');
      const rng2 = new SeededRandom('element-seed');
      const array = ['a', 'b', 'c', 'd', 'e'];
      
      const result1 = Array.from({ length: 5 }, () => rng1.randomElement(array));
      const result2 = Array.from({ length: 5 }, () => rng2.randomElement(array));
      
      expect(result1).toEqual(result2);
    });
  });

  describe('shuffle()', () => {
    it('should return an array of the same length', () => {
      const rng = new SeededRandom('shuffle-test');
      const array = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle(array);
      
      expect(shuffled.length).toBe(array.length);
    });

    it('should contain all original elements', () => {
      const rng = new SeededRandom('shuffle-elements');
      const array = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle(array);
      
      expect(shuffled.sort()).toEqual(array.sort());
    });

    it('should not modify the original array', () => {
      const rng = new SeededRandom('shuffle-immutable');
      const array = [1, 2, 3, 4, 5];
      const original = [...array];
      rng.shuffle(array);
      
      expect(array).toEqual(original);
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom('shuffle-det');
      const rng2 = new SeededRandom('shuffle-det');
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      const shuffled1 = rng1.shuffle(array);
      const shuffled2 = rng2.shuffle(array);
      
      expect(shuffled1).toEqual(shuffled2);
    });
  });

  describe('chance()', () => {
    it('should return true or false', () => {
      const rng = new SeededRandom('chance-test');
      const result = rng.chance(0.5);
      expect(typeof result).toBe('boolean');
    });

    it('should always return true for probability 1', () => {
      const rng = new SeededRandom('chance-always');
      for (let i = 0; i < 100; i++) {
        expect(rng.chance(1)).toBe(true);
      }
    });

    it('should always return false for probability 0', () => {
      const rng = new SeededRandom('chance-never');
      for (let i = 0; i < 100; i++) {
        expect(rng.chance(0)).toBe(false);
      }
    });
  });

  describe('randomId()', () => {
    it('should generate an ID of the specified length', () => {
      const rng = new SeededRandom('id-test');
      const id = rng.randomId(12);
      expect(id.length).toBe(12);
    });

    it('should only contain alphanumeric characters', () => {
      const rng = new SeededRandom('id-chars');
      const id = rng.randomId(100);
      expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it('should be deterministic', () => {
      const rng1 = new SeededRandom('id-det');
      const rng2 = new SeededRandom('id-det');
      
      expect(rng1.randomId(8)).toBe(rng2.randomId(8));
    });
  });

  describe('gaussian()', () => {
    it('should return values centered around the mean', () => {
      const rng = new SeededRandom('gaussian-test');
      const mean = 50;
      const stddev = 10;
      const samples = Array.from({ length: 1000 }, () => rng.gaussian(mean, stddev));
      
      const average = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(average).toBeCloseTo(mean, 0);
    });
  });

  describe('pickMultiple()', () => {
    it('should return the specified number of unique elements', () => {
      const rng = new SeededRandom('pick-test');
      const array = ['a', 'b', 'c', 'd', 'e', 'f'];
      const picked = rng.pickMultiple(array, 3);
      
      expect(picked.length).toBe(3);
      expect(new Set(picked).size).toBe(3);
    });

    it('should not exceed array length', () => {
      const rng = new SeededRandom('pick-overflow');
      const array = ['a', 'b', 'c'];
      const picked = rng.pickMultiple(array, 10);
      
      expect(picked.length).toBe(3);
    });
  });
});

describe('generateSeed', () => {
  it('should generate a non-empty string', () => {
    const seed = generateSeed();
    expect(seed.length).toBeGreaterThan(0);
  });

  it('should generate different seeds on each call', () => {
    const seeds = new Set(Array.from({ length: 100 }, () => generateSeed()));
    expect(seeds.size).toBeGreaterThan(90); // Allow some small chance of collision
  });
});
