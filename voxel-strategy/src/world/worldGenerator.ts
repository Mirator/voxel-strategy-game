// Procedural world generation with seeded randomness
import type {
  WorldMap,
  Tile,
  TerrainType,
  PointOfInterest,
  Town,
  EnemyCamp,
  ResourceNode,
  ResourceType,
  Position,
  UnitRecruitOption,
  Unit,
} from '../core/types';
import {
  TERRAIN_COSTS,
  TERRAIN_PASSABLE,
  UNIT_TEMPLATES,
} from '../core/types';
import { SeededRandom } from '../utils/random';

interface WorldGenConfig {
  width: number;
  height: number;
  seed: string;
  numTowns: number;
  numEnemyCamps: number;
  numResourceNodes: number;
  numNeutralEncounters: number;
}

// Simplex-like noise for terrain generation
class SimplexNoise {
  private permutation: number[] = [];
  
  constructor(rng: SeededRandom) {
    // Create permutation table
    const p = Array.from({ length: 256 }, (_, i) => i);
    this.permutation = rng.shuffle(p);
    this.permutation = [...this.permutation, ...this.permutation];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = this.fade(x);
    const v = this.fade(y);
    
    const A = this.permutation[X] + Y;
    const B = this.permutation[X + 1] + Y;
    
    return this.lerp(
      this.lerp(this.grad(this.permutation[A], x, y), this.grad(this.permutation[B], x - 1, y), u),
      this.lerp(this.grad(this.permutation[A + 1], x, y - 1), this.grad(this.permutation[B + 1], x - 1, y - 1), u),
      v
    );
  }

  // Multi-octave noise for more natural terrain
  octaveNoise(x: number, y: number, octaves: number, persistence: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    
    return total / maxValue;
  }
}

export function generateWorld(config: WorldGenConfig): WorldMap {
  const rng = new SeededRandom(config.seed);
  const noise = new SimplexNoise(rng);
  
  // Generate base terrain
  const tiles = generateTerrain(config.width, config.height, noise, rng);
  
  // Generate points of interest
  const towns = generateTowns(tiles, config.numTowns, rng);
  const enemyCamps = generateEnemyCamps(tiles, config.numEnemyCamps, rng, towns);
  const resourceNodes = generateResourceNodes(tiles, config.numResourceNodes, rng, towns, enemyCamps);
  const neutralEncounters = generateNeutralEncounters(
    tiles,
    config.numNeutralEncounters,
    rng,
    towns,
    enemyCamps,
    resourceNodes
  );
  
  // Place points of interest on tiles
  const allPOIs: PointOfInterest[] = [...towns, ...enemyCamps, ...neutralEncounters];
  
  for (const poi of allPOIs) {
    const tile = tiles[poi.position.y][poi.position.x];
    tile.pointOfInterest = poi;
  }
  
  for (const node of resourceNodes) {
    const tile = tiles[node.position.y][node.position.x];
    tile.resourceNode = node;
  }
  
  // Generate roads connecting towns
  generateRoads(tiles, towns, rng);
  
  return {
    width: config.width,
    height: config.height,
    tiles,
    pointsOfInterest: allPOIs,
    resourceNodes,
    seed: config.seed,
  };
}

function generateTerrain(
  width: number,
  height: number,
  noise: SimplexNoise,
  rng: SeededRandom
): Tile[][] {
  const tiles: Tile[][] = [];
  
  // Generate height and moisture maps
  const scale = 0.05;
  const moistureOffset = rng.randomFloat(100, 1000);
  
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const elevation = noise.octaveNoise(x * scale, y * scale, 4, 0.5);
      const moisture = noise.octaveNoise(
        (x + moistureOffset) * scale,
        (y + moistureOffset) * scale,
        3,
        0.6
      );
      
      // Normalize to 0-1 range
      const normalizedElevation = (elevation + 1) / 2;
      const normalizedMoisture = (moisture + 1) / 2;
      
      const terrain = determineTerrain(normalizedElevation, normalizedMoisture);
      
      tiles[y][x] = {
        position: { x, y },
        terrain,
        elevation: normalizedElevation,
        movementCost: TERRAIN_COSTS[terrain],
        isPassable: TERRAIN_PASSABLE[terrain],
      };
    }
  }
  
  return tiles;
}

function determineTerrain(elevation: number, moisture: number): TerrainType {
  // Water for low elevation
  if (elevation < 0.3) {
    return 'water';
  }
  
  // Mountains for high elevation
  if (elevation > 0.75) {
    return 'mountain';
  }
  
  // Desert for low moisture, mid elevation
  if (moisture < 0.3 && elevation > 0.35) {
    return 'desert';
  }
  
  // Forest for high moisture
  if (moisture > 0.6 && elevation < 0.65) {
    return 'forest';
  }
  
  // Default to grass
  return 'grass';
}

function generateTowns(tiles: Tile[][], count: number, rng: SeededRandom): Town[] {
  const towns: Town[] = [];
  const minDistance = 8;
  
  const validPositions = findValidPositions(tiles, ['grass', 'desert']);
  const shuffledPositions = rng.shuffle(validPositions);
  
  for (const pos of shuffledPositions) {
    if (towns.length >= count) break;
    
    // Check minimum distance from other towns
    const tooClose = towns.some(
      (town) => manhattanDistance(pos, town.position) < minDistance
    );
    
    if (!tooClose) {
      towns.push(createTown(pos, rng, towns.length === 0));
    }
  }
  
  return towns;
}

function createTown(position: Position, rng: SeededRandom, isPlayerStart: boolean): Town {
  const townNames = [
    'Ironhold', 'Silverdale', 'Goldcrest', 'Stonehaven', 'Oakshire',
    'Riverwatch', 'Hillcrest', 'Meadowbrook', 'Thornfield', 'Crystalvale',
    'Frostgate', 'Sunhaven', 'Shadowmere', 'Brightwater', 'Stormwind'
  ];
  
  return {
    id: `town_${rng.randomId()}`,
    type: 'town',
    name: rng.randomElement(townNames),
    position,
    factionId: isPlayerStart ? 'player' : 'neutral',
    isDiscovered: isPlayerStart,
    garrison: isPlayerStart ? [] : generateGarrison(rng, 1),
    recruitPool: generateRecruitPool(rng),
    buildings: [],
    resources: {
      gold: rng.randomInt(100, 500),
      wood: rng.randomInt(50, 200),
      stone: rng.randomInt(30, 150),
      crystals: rng.randomInt(10, 50),
    },
  };
}

function generateRecruitPool(rng: SeededRandom): UnitRecruitOption[] {
  return [
    {
      unitType: 'warrior',
      cost: { gold: 100, wood: 0, stone: 0, crystals: 0 },
      available: rng.randomInt(5, 15),
      maxPerWeek: 10,
    },
    {
      unitType: 'archer',
      cost: { gold: 80, wood: 20, stone: 0, crystals: 0 },
      available: rng.randomInt(3, 10),
      maxPerWeek: 8,
    },
    {
      unitType: 'cavalry',
      cost: { gold: 200, wood: 0, stone: 0, crystals: 0 },
      available: rng.randomInt(2, 6),
      maxPerWeek: 4,
    },
    {
      unitType: 'mage',
      cost: { gold: 250, wood: 0, stone: 0, crystals: 20 },
      available: rng.randomInt(1, 4),
      maxPerWeek: 2,
    },
    {
      unitType: 'healer',
      cost: { gold: 150, wood: 0, stone: 0, crystals: 10 },
      available: rng.randomInt(2, 5),
      maxPerWeek: 3,
    },
  ];
}

function generateGarrison(rng: SeededRandom, difficulty: number): Unit[] {
  const garrison: Unit[] = [];
  const unitCount = Math.floor(difficulty * 2) + rng.randomInt(1, 3);
  
  for (let i = 0; i < unitCount; i++) {
    const unitType = rng.randomElement(['warrior', 'archer', 'cavalry'] as const);
    const template = UNIT_TEMPLATES[unitType];
    garrison.push({
      ...template,
      id: `unit_${rng.randomId()}`,
      count: Math.floor(difficulty * 3) + rng.randomInt(2, 8),
    });
  }
  
  return garrison;
}

function generateEnemyCamps(
  tiles: Tile[][],
  count: number,
  rng: SeededRandom,
  towns: Town[]
): EnemyCamp[] {
  const camps: EnemyCamp[] = [];
  const minDistanceFromTowns = 5;
  const minDistanceFromCamps = 4;
  
  const validPositions = findValidPositions(tiles, ['grass', 'forest', 'desert']);
  const shuffledPositions = rng.shuffle(validPositions);
  
  for (const pos of shuffledPositions) {
    if (camps.length >= count) break;
    
    const tooCloseToTown = towns.some(
      (town) => manhattanDistance(pos, town.position) < minDistanceFromTowns
    );
    
    const tooCloseToCamp = camps.some(
      (camp) => manhattanDistance(pos, camp.position) < minDistanceFromCamps
    );
    
    if (!tooCloseToTown && !tooCloseToCamp) {
      const difficulty = rng.randomInt(1, 5);
      camps.push({
        id: `camp_${rng.randomId()}`,
        type: 'enemy_camp',
        name: `${rng.randomElement(['Goblin', 'Bandit', 'Orc', 'Skeleton', 'Troll'])} Camp`,
        position: pos,
        factionId: rng.randomElement(['enemy_1', 'enemy_2'] as const),
        isDiscovered: false,
        garrison: generateGarrison(rng, difficulty),
        difficulty,
        rewards: {
          gold: difficulty * 100 + rng.randomInt(50, 200),
          wood: difficulty * 20 + rng.randomInt(10, 50),
          stone: difficulty * 15 + rng.randomInt(5, 30),
          crystals: difficulty * 5 + rng.randomInt(0, 20),
        },
      });
    }
  }
  
  return camps;
}

function generateResourceNodes(
  tiles: Tile[][],
  count: number,
  rng: SeededRandom,
  towns: Town[],
  camps: EnemyCamp[]
): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  const minDistance = 3;
  
  const validPositions = findValidPositions(tiles, ['grass', 'forest', 'desert', 'mountain']);
  const shuffledPositions = rng.shuffle(validPositions);
  
  const resourceTypes: ResourceType[] = ['gold', 'wood', 'stone', 'crystals'];
  
  for (const pos of shuffledPositions) {
    if (nodes.length >= count) break;
    
    const tooClose = 
      towns.some((t) => manhattanDistance(pos, t.position) < minDistance) ||
      camps.some((c) => manhattanDistance(pos, c.position) < minDistance) ||
      nodes.some((n) => manhattanDistance(pos, n.position) < minDistance);
    
    if (!tooClose) {
      const tile = tiles[pos.y][pos.x];
      let resourceType: ResourceType;
      
      // Terrain-appropriate resources
      if (tile.terrain === 'forest') {
        resourceType = rng.chance(0.7) ? 'wood' : rng.randomElement(resourceTypes);
      } else if (tile.terrain === 'mountain') {
        resourceType = rng.chance(0.7) ? 'stone' : rng.randomElement(resourceTypes);
      } else {
        resourceType = rng.randomElement(resourceTypes);
      }
      
      nodes.push({
        id: `resource_${rng.randomId()}`,
        resourceType,
        position: pos,
        amountPerTurn: rng.randomInt(5, 20),
        isOwned: false,
      });
    }
  }
  
  return nodes;
}

function generateNeutralEncounters(
  tiles: Tile[][],
  count: number,
  rng: SeededRandom,
  towns: Town[],
  camps: EnemyCamp[],
  resources: ResourceNode[]
): PointOfInterest[] {
  const encounters: PointOfInterest[] = [];
  const minDistance = 3;
  
  const validPositions = findValidPositions(tiles, ['grass', 'forest']);
  const shuffledPositions = rng.shuffle(validPositions);
  
  const encounterTypes = [
    'Ancient Shrine',
    'Wandering Merchant',
    'Lost Treasure',
    'Hermit\'s Hut',
    'Mystic Well',
    'Abandoned Wagon',
  ];
  
  for (const pos of shuffledPositions) {
    if (encounters.length >= count) break;
    
    const tooClose = 
      towns.some((t) => manhattanDistance(pos, t.position) < minDistance) ||
      camps.some((c) => manhattanDistance(pos, c.position) < minDistance) ||
      resources.some((r) => manhattanDistance(pos, r.position) < minDistance) ||
      encounters.some((e) => manhattanDistance(pos, e.position) < minDistance);
    
    if (!tooClose) {
      encounters.push({
        id: `encounter_${rng.randomId()}`,
        type: 'neutral_encounter',
        name: rng.randomElement(encounterTypes),
        position: pos,
        factionId: 'neutral',
        isDiscovered: false,
      });
    }
  }
  
  return encounters;
}

function generateRoads(tiles: Tile[][], towns: Town[], rng: SeededRandom): void {
  // Connect towns with roads using simple pathfinding
  for (let i = 0; i < towns.length - 1; i++) {
    const start = towns[i].position;
    const end = towns[i + 1].position;
    
    // Simple straight-ish path with some randomness
    let current = { ...start };
    
    while (current.x !== end.x || current.y !== end.y) {
      const tile = tiles[current.y][current.x];
      
      // Only place roads on passable terrain that isn't water
      if (tile.isPassable && tile.terrain !== 'water') {
        tile.terrain = 'road';
        tile.movementCost = TERRAIN_COSTS.road;
      }
      
      // Move towards target with some randomness
      const dx = end.x - current.x;
      const dy = end.y - current.y;
      
      if (rng.chance(0.6)) {
        // Move in primary direction
        if (Math.abs(dx) > Math.abs(dy)) {
          current.x += Math.sign(dx);
        } else {
          current.y += Math.sign(dy);
        }
      } else {
        // Move in secondary direction
        if (Math.abs(dx) <= Math.abs(dy) && dx !== 0) {
          current.x += Math.sign(dx);
        } else if (dy !== 0) {
          current.y += Math.sign(dy);
        } else {
          current.x += Math.sign(dx);
        }
      }
      
      // Bounds check
      current.x = Math.max(0, Math.min(tiles[0].length - 1, current.x));
      current.y = Math.max(0, Math.min(tiles.length - 1, current.y));
    }
  }
}

function findValidPositions(tiles: Tile[][], validTerrains: TerrainType[]): Position[] {
  const positions: Position[] = [];
  
  for (let y = 1; y < tiles.length - 1; y++) {
    for (let x = 1; x < tiles[0].length - 1; x++) {
      if (validTerrains.includes(tiles[y][x].terrain) && tiles[y][x].isPassable) {
        positions.push({ x, y });
      }
    }
  }
  
  return positions;
}

function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function getDefaultWorldGenConfig(seed?: string): WorldGenConfig {
  return {
    width: 64,
    height: 64,
    seed: seed || Date.now().toString(),
    numTowns: 6,
    numEnemyCamps: 12,
    numResourceNodes: 20,
    numNeutralEncounters: 8,
  };
}
