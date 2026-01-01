// Core game types for the Voxel Strategy Game

export type TerrainType = 'grass' | 'water' | 'mountain' | 'forest' | 'desert' | 'road';

export type PointOfInterestType = 'town' | 'enemy_camp' | 'resource_node' | 'neutral_encounter';

export type ResourceType = 'gold' | 'wood' | 'stone' | 'crystals';

export type UnitType = 'warrior' | 'archer' | 'cavalry' | 'mage' | 'healer';

export type FactionId = 'player' | 'enemy_1' | 'enemy_2' | 'neutral';

export interface Position {
  x: number;
  y: number;
}

export interface Position3D extends Position {
  z: number;
}

export interface UnitStats {
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  name: string;
  stats: UnitStats;
  count: number; // Stack count
  experience: number;
}

export interface Hero {
  id: string;
  name: string;
  level: number;
  experience: number;
  experienceToNext: number;
  position: Position;
  movementPoints: number;
  maxMovementPoints: number;
  crew: Unit[];
  bonuses: HeroBonuses;
  factionId: FactionId;
}

export interface HeroBonuses {
  attackBonus: number;
  defenseBonus: number;
  movementBonus: number;
  moraleBonus: number;
}

export interface Tile {
  position: Position;
  terrain: TerrainType;
  elevation: number;
  movementCost: number;
  isPassable: boolean;
  pointOfInterest?: PointOfInterest;
  resourceNode?: ResourceNode;
}

export interface PointOfInterest {
  id: string;
  type: PointOfInterestType;
  name: string;
  position: Position;
  factionId: FactionId;
  garrison?: Unit[];
  isDiscovered: boolean;
}

export interface Town extends PointOfInterest {
  type: 'town';
  recruitPool: UnitRecruitOption[];
  buildings: Building[];
  resources: Resources;
}

export interface EnemyCamp extends PointOfInterest {
  type: 'enemy_camp';
  difficulty: number;
  rewards: Resources;
}

export interface ResourceNode {
  id: string;
  resourceType: ResourceType;
  position: Position;
  amountPerTurn: number;
  isOwned: boolean;
  ownedBy?: FactionId;
}

export interface Resources {
  gold: number;
  wood: number;
  stone: number;
  crystals: number;
}

export interface UnitRecruitOption {
  unitType: UnitType;
  cost: Resources;
  available: number;
  maxPerWeek: number;
}

export interface Building {
  id: string;
  name: string;
  level: number;
  effects: BuildingEffect[];
}

export interface BuildingEffect {
  type: 'recruit_bonus' | 'resource_bonus' | 'defense_bonus';
  value: number;
}

export interface Faction {
  id: FactionId;
  name: string;
  color: string;
  resources: Resources;
  heroes: Hero[];
  ownedTowns: string[];
  isAI: boolean;
}

export interface WorldMap {
  width: number;
  height: number;
  tiles: Tile[][];
  pointsOfInterest: PointOfInterest[];
  resourceNodes: ResourceNode[];
  seed: string;
}

export interface CombatUnit extends Unit {
  combatPosition: Position;
  hasActed: boolean;
  isDefending: boolean;
  statusEffects: StatusEffect[];
}

export interface StatusEffect {
  type: 'poison' | 'stun' | 'boost' | 'shield';
  duration: number;
  value: number;
}

export interface CombatState {
  isActive: boolean;
  attacker: Hero;
  defender: Hero | PointOfInterest;
  attackerUnits: CombatUnit[];
  defenderUnits: CombatUnit[];
  currentTurn: 'attacker' | 'defender';
  currentUnitIndex: number;
  turnOrder: CombatUnit[];
  combatLog: CombatLogEntry[];
  gridWidth: number;
  gridHeight: number;
}

export interface CombatLogEntry {
  turn: number;
  message: string;
  timestamp: number;
}

export interface CombatAction {
  type: 'move' | 'attack' | 'defend' | 'wait' | 'ability';
  sourceUnit: string;
  targetPosition?: Position;
  targetUnit?: string;
}

export interface CombatResult {
  winner: 'attacker' | 'defender';
  attackerLosses: { unitId: string; lost: number }[];
  defenderLosses: { unitId: string; lost: number }[];
  experienceGained: number;
  resourcesLooted: Resources;
}

export interface GameState {
  turn: number;
  currentFaction: FactionId;
  worldMap: WorldMap;
  factions: Faction[];
  combatState?: CombatState;
  selectedHeroId?: string;
  gamePhase: 'world_map' | 'combat' | 'town' | 'menu';
  victoryCondition: VictoryCondition;
  isGameOver: boolean;
  winner?: FactionId;
}

export interface VictoryCondition {
  type: 'conquest' | 'elimination' | 'turns';
  targetValue?: number;
}

export interface GameConfig {
  mapWidth: number;
  mapHeight: number;
  seed: string;
  playerFactionId: FactionId;
  difficulty: 'easy' | 'normal' | 'hard';
  enableFogOfWar: boolean;
}

// Unit templates for creating new units
export const UNIT_TEMPLATES: Record<UnitType, Omit<Unit, 'id'>> = {
  warrior: {
    type: 'warrior',
    name: 'Warrior',
    stats: {
      maxHp: 50,
      hp: 50,
      attack: 12,
      defense: 8,
      speed: 4,
      range: 1,
    },
    count: 1,
    experience: 0,
  },
  archer: {
    type: 'archer',
    name: 'Archer',
    stats: {
      maxHp: 30,
      hp: 30,
      attack: 10,
      defense: 4,
      speed: 5,
      range: 4,
    },
    count: 1,
    experience: 0,
  },
  cavalry: {
    type: 'cavalry',
    name: 'Cavalry',
    stats: {
      maxHp: 60,
      hp: 60,
      attack: 14,
      defense: 6,
      speed: 7,
      range: 1,
    },
    count: 1,
    experience: 0,
  },
  mage: {
    type: 'mage',
    name: 'Mage',
    stats: {
      maxHp: 25,
      hp: 25,
      attack: 18,
      defense: 3,
      speed: 4,
      range: 3,
    },
    count: 1,
    experience: 0,
  },
  healer: {
    type: 'healer',
    name: 'Healer',
    stats: {
      maxHp: 20,
      hp: 20,
      attack: 5,
      defense: 5,
      speed: 5,
      range: 2,
    },
    count: 1,
    experience: 0,
  },
};

// Terrain movement costs
export const TERRAIN_COSTS: Record<TerrainType, number> = {
  grass: 1,
  road: 0.5,
  forest: 2,
  desert: 1.5,
  mountain: 3,
  water: Infinity, // Impassable
};

export const TERRAIN_PASSABLE: Record<TerrainType, boolean> = {
  grass: true,
  road: true,
  forest: true,
  desert: true,
  mountain: false,
  water: false,
};
