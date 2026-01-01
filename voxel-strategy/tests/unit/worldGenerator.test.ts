// Unit tests for world generation
import { describe, it, expect } from 'vitest';
import { generateWorld, getDefaultWorldGenConfig } from '../../src/world/worldGenerator';

describe('World Generator', () => {
  describe('getDefaultWorldGenConfig', () => {
    it('should return a valid config object', () => {
      const config = getDefaultWorldGenConfig();
      
      expect(config).toHaveProperty('width');
      expect(config).toHaveProperty('height');
      expect(config).toHaveProperty('seed');
      expect(config).toHaveProperty('numTowns');
      expect(config).toHaveProperty('numEnemyCamps');
      expect(config).toHaveProperty('numResourceNodes');
      expect(config).toHaveProperty('numNeutralEncounters');
    });

    it('should use provided seed', () => {
      const config = getDefaultWorldGenConfig('my-custom-seed');
      expect(config.seed).toBe('my-custom-seed');
    });

    it('should have reasonable default values', () => {
      const config = getDefaultWorldGenConfig();
      
      expect(config.width).toBeGreaterThanOrEqual(32);
      expect(config.height).toBeGreaterThanOrEqual(32);
      expect(config.numTowns).toBeGreaterThan(0);
      expect(config.numEnemyCamps).toBeGreaterThan(0);
    });
  });

  describe('generateWorld', () => {
    it('should generate a world with the correct dimensions', () => {
      const config = {
        ...getDefaultWorldGenConfig('test-world'),
        width: 32,
        height: 32,
      };
      
      const world = generateWorld(config);
      
      expect(world.width).toBe(32);
      expect(world.height).toBe(32);
      expect(world.tiles.length).toBe(32);
      expect(world.tiles[0].length).toBe(32);
    });

    it('should store the seed', () => {
      const config = getDefaultWorldGenConfig('reproducible-seed');
      const world = generateWorld(config);
      
      expect(world.seed).toBe('reproducible-seed');
    });

    it('should generate deterministic worlds with the same seed', () => {
      const config1 = {
        ...getDefaultWorldGenConfig('same-seed'),
        width: 32,
        height: 32,
      };
      const config2 = {
        ...getDefaultWorldGenConfig('same-seed'),
        width: 32,
        height: 32,
      };
      
      const world1 = generateWorld(config1);
      const world2 = generateWorld(config2);
      
      // Check that tiles are the same
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          expect(world1.tiles[y][x].terrain).toBe(world2.tiles[y][x].terrain);
          expect(world1.tiles[y][x].elevation).toBeCloseTo(world2.tiles[y][x].elevation, 10);
        }
      }
      
      // Check that POIs are at same positions
      expect(world1.pointsOfInterest.length).toBe(world2.pointsOfInterest.length);
      for (let i = 0; i < world1.pointsOfInterest.length; i++) {
        expect(world1.pointsOfInterest[i].position).toEqual(
          world2.pointsOfInterest[i].position
        );
      }
    });

    it('should generate different worlds with different seeds', () => {
      const config1 = {
        ...getDefaultWorldGenConfig('seed-a'),
        width: 32,
        height: 32,
      };
      const config2 = {
        ...getDefaultWorldGenConfig('seed-b'),
        width: 32,
        height: 32,
      };
      
      const world1 = generateWorld(config1);
      const world2 = generateWorld(config2);
      
      // At least some tiles should be different
      let differences = 0;
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          if (world1.tiles[y][x].terrain !== world2.tiles[y][x].terrain) {
            differences++;
          }
        }
      }
      
      expect(differences).toBeGreaterThan(0);
    });

    it('should generate tiles with valid terrain types', () => {
      const config = {
        ...getDefaultWorldGenConfig('terrain-test'),
        width: 32,
        height: 32,
      };
      
      const world = generateWorld(config);
      const validTerrains = ['grass', 'water', 'mountain', 'forest', 'desert', 'road'];
      
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          expect(validTerrains).toContain(world.tiles[y][x].terrain);
        }
      }
    });

    it('should generate tiles with positions matching their array indices', () => {
      const config = {
        ...getDefaultWorldGenConfig('position-test'),
        width: 32,
        height: 32,
      };
      
      const world = generateWorld(config);
      
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          expect(world.tiles[y][x].position).toEqual({ x, y });
        }
      }
    });

    it('should generate towns', () => {
      const config = {
        ...getDefaultWorldGenConfig('town-test'),
        width: 64,
        height: 64,
        numTowns: 5,
      };
      
      const world = generateWorld(config);
      const towns = world.pointsOfInterest.filter((poi) => poi.type === 'town');
      
      expect(towns.length).toBeGreaterThanOrEqual(1);
      expect(towns.length).toBeLessThanOrEqual(5);
    });

    it('should generate enemy camps', () => {
      const config = {
        ...getDefaultWorldGenConfig('camp-test'),
        width: 64,
        height: 64,
        numEnemyCamps: 10,
      };
      
      const world = generateWorld(config);
      const camps = world.pointsOfInterest.filter((poi) => poi.type === 'enemy_camp');
      
      expect(camps.length).toBeGreaterThan(0);
    });

    it('should generate resource nodes', () => {
      const config = {
        ...getDefaultWorldGenConfig('resource-test'),
        width: 64,
        height: 64,
        numResourceNodes: 15,
      };
      
      const world = generateWorld(config);
      
      expect(world.resourceNodes.length).toBeGreaterThan(0);
    });

    it('should have at least one player-owned town', () => {
      const config = {
        ...getDefaultWorldGenConfig('player-town'),
        width: 64,
        height: 64,
        numTowns: 5,
      };
      
      const world = generateWorld(config);
      const playerTowns = world.pointsOfInterest.filter(
        (poi) => poi.type === 'town' && poi.factionId === 'player'
      );
      
      expect(playerTowns.length).toBeGreaterThanOrEqual(1);
    });

    it('should place POIs on valid terrain', () => {
      const config = {
        ...getDefaultWorldGenConfig('valid-poi-placement'),
        width: 64,
        height: 64,
      };
      
      const world = generateWorld(config);
      
      for (const poi of world.pointsOfInterest) {
        const tile = world.tiles[poi.position.y][poi.position.x];
        expect(tile.isPassable).toBe(true);
        expect(tile.terrain).not.toBe('water');
      }
    });

    it('should generate resource nodes with valid resource types', () => {
      const config = {
        ...getDefaultWorldGenConfig('resource-types'),
        width: 64,
        height: 64,
        numResourceNodes: 20,
      };
      
      const world = generateWorld(config);
      const validResourceTypes = ['gold', 'wood', 'stone', 'crystals'];
      
      for (const node of world.resourceNodes) {
        expect(validResourceTypes).toContain(node.resourceType);
        expect(node.amountPerTurn).toBeGreaterThan(0);
      }
    });

    it('should maintain minimum distance between towns', () => {
      const config = {
        ...getDefaultWorldGenConfig('town-spacing'),
        width: 64,
        height: 64,
        numTowns: 6,
      };
      
      const world = generateWorld(config);
      const towns = world.pointsOfInterest.filter((poi) => poi.type === 'town');
      
      for (let i = 0; i < towns.length; i++) {
        for (let j = i + 1; j < towns.length; j++) {
          const distance =
            Math.abs(towns[i].position.x - towns[j].position.x) +
            Math.abs(towns[i].position.y - towns[j].position.y);
          expect(distance).toBeGreaterThanOrEqual(5); // Some minimum spacing
        }
      }
    });
  });

  describe('tile properties', () => {
    it('should set correct movement costs for different terrains', () => {
      const config = {
        ...getDefaultWorldGenConfig('movement-costs'),
        width: 64,
        height: 64,
      };
      
      const world = generateWorld(config);
      
      for (let y = 0; y < world.height; y++) {
        for (let x = 0; x < world.width; x++) {
          const tile = world.tiles[y][x];
          
          switch (tile.terrain) {
            case 'grass':
              expect(tile.movementCost).toBe(1);
              break;
            case 'road':
              expect(tile.movementCost).toBe(0.5);
              break;
            case 'forest':
              expect(tile.movementCost).toBe(2);
              break;
            case 'desert':
              expect(tile.movementCost).toBe(1.5);
              break;
            case 'mountain':
              expect(tile.movementCost).toBe(3);
              break;
            case 'water':
              expect(tile.movementCost).toBe(Infinity);
              break;
          }
        }
      }
    });

    it('should mark water and mountains as impassable', () => {
      const config = {
        ...getDefaultWorldGenConfig('passability'),
        width: 64,
        height: 64,
      };
      
      const world = generateWorld(config);
      
      for (let y = 0; y < world.height; y++) {
        for (let x = 0; x < world.width; x++) {
          const tile = world.tiles[y][x];
          
          if (tile.terrain === 'water' || tile.terrain === 'mountain') {
            expect(tile.isPassable).toBe(false);
          } else {
            expect(tile.isPassable).toBe(true);
          }
        }
      }
    });

    it('should have elevation values between 0 and 1', () => {
      const config = {
        ...getDefaultWorldGenConfig('elevation'),
        width: 64,
        height: 64,
      };
      
      const world = generateWorld(config);
      
      for (let y = 0; y < world.height; y++) {
        for (let x = 0; x < world.width; x++) {
          const tile = world.tiles[y][x];
          expect(tile.elevation).toBeGreaterThanOrEqual(0);
          expect(tile.elevation).toBeLessThanOrEqual(1);
        }
      }
    });
  });
});
