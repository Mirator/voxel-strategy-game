// Game state management with Zustand
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  GameState,
  GameConfig,
  Hero,
  Unit,
  Faction,
  Position,
  FactionId,
  Resources,
  Town,
  Tile,
  CombatUnit,
  CombatAction,
  CombatResult,
  PointOfInterest,
} from '../core/types';
import { UNIT_TEMPLATES } from '../core/types';
import { generateWorld, getDefaultWorldGenConfig } from '../world/worldGenerator';
import { SeededRandom } from '../utils/random';

interface GameStore extends GameState {
  // Actions
  initGame: (config?: Partial<GameConfig>) => void;
  selectHero: (heroId: string | undefined) => void;
  moveHero: (heroId: string, targetPosition: Position) => boolean;
  endTurn: () => void;
  
  // Combat actions
  startCombat: (attackerId: string, defenderId: string | PointOfInterest) => void;
  executeCombatAction: (action: CombatAction) => void;
  endCombat: (result: CombatResult) => void;
  runAutoBattle: () => CombatResult | null;
  
  // Town actions
  enterTown: (townId: string) => void;
  leaveTown: () => void;
  recruitUnit: (townId: string, unitType: string, count: number) => boolean;
  
  // Resource management
  addResources: (factionId: FactionId, resources: Partial<Resources>) => void;
  spendResources: (factionId: FactionId, resources: Partial<Resources>) => boolean;
  
  // Utility
  getHero: (heroId: string) => Hero | undefined;
  getFaction: (factionId: FactionId) => Faction | undefined;
  getTileAt: (position: Position) => Tile | undefined;
  getMovementRange: (heroId: string) => Position[];
  canMoveTo: (heroId: string, position: Position) => boolean;
}

const createInitialHero = (
  factionId: FactionId,
  position: Position,
  rng: SeededRandom
): Hero => {
  const heroNames = ['Alaric', 'Seraphina', 'Magnus', 'Elena', 'Theron', 'Lyra'];
  
  return {
    id: `hero_${rng.randomId()}`,
    name: rng.randomElement(heroNames),
    level: 1,
    experience: 0,
    experienceToNext: 100,
    position,
    movementPoints: 10,
    maxMovementPoints: 10,
    crew: [
      { ...UNIT_TEMPLATES.warrior, id: `unit_${rng.randomId()}`, count: 10 },
      { ...UNIT_TEMPLATES.archer, id: `unit_${rng.randomId()}`, count: 5 },
    ],
    bonuses: {
      attackBonus: 0,
      defenseBonus: 0,
      movementBonus: 0,
      moraleBonus: 0,
    },
    factionId,
  };
};

const createInitialFactions = (
  worldMap: ReturnType<typeof generateWorld>,
  rng: SeededRandom
): Faction[] => {
  // Find player start town
  const playerTown = worldMap.pointsOfInterest.find(
    (poi) => poi.type === 'town' && poi.factionId === 'player'
  );
  
  const playerStartPos = playerTown?.position || { x: 10, y: 10 };
  
  // Find a position for enemy hero
  const enemyTowns = worldMap.pointsOfInterest.filter(
    (poi) => poi.type === 'town' && poi.factionId === 'neutral'
  );
  const enemyStartPos = enemyTowns[0]?.position || { x: 50, y: 50 };
  
  return [
    {
      id: 'player',
      name: 'Kingdom of Light',
      color: '#4a90d9',
      resources: { gold: 1000, wood: 200, stone: 100, crystals: 50 },
      heroes: [createInitialHero('player', playerStartPos, rng)],
      ownedTowns: playerTown ? [playerTown.id] : [],
      isAI: false,
    },
    {
      id: 'enemy_1',
      name: 'Dark Legion',
      color: '#d94a4a',
      resources: { gold: 800, wood: 150, stone: 80, crystals: 30 },
      heroes: [createInitialHero('enemy_1', enemyStartPos, rng)],
      ownedTowns: [],
      isAI: true,
    },
  ];
};

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // Initial state
    turn: 1,
    currentFaction: 'player',
    worldMap: {
      width: 0,
      height: 0,
      tiles: [],
      pointsOfInterest: [],
      resourceNodes: [],
      seed: '',
    },
    factions: [],
    combatState: undefined,
    selectedHeroId: undefined,
    gamePhase: 'menu',
    victoryCondition: { type: 'conquest' },
    isGameOver: false,
    winner: undefined,

    // Initialize game
    initGame: (config?: Partial<GameConfig>) => {
      const fullConfig: GameConfig = {
        mapWidth: config?.mapWidth || 64,
        mapHeight: config?.mapHeight || 64,
        seed: config?.seed || Date.now().toString(),
        playerFactionId: config?.playerFactionId || 'player',
        difficulty: config?.difficulty || 'normal',
        enableFogOfWar: config?.enableFogOfWar ?? true,
      };

      const worldGenConfig = getDefaultWorldGenConfig(fullConfig.seed);
      worldGenConfig.width = fullConfig.mapWidth;
      worldGenConfig.height = fullConfig.mapHeight;
      
      const worldMap = generateWorld(worldGenConfig);
      const rng = new SeededRandom(fullConfig.seed);
      const factions = createInitialFactions(worldMap, rng);

      set((state) => {
        state.worldMap = worldMap;
        state.factions = factions;
        state.turn = 1;
        state.currentFaction = 'player';
        state.gamePhase = 'world_map';
        state.selectedHeroId = factions[0].heroes[0]?.id;
        state.isGameOver = false;
        state.winner = undefined;
      });
    },

    // Select hero
    selectHero: (heroId) => {
      set((state) => {
        state.selectedHeroId = heroId;
      });
    },

    // Move hero
    moveHero: (heroId, targetPosition) => {
      const state = get();
      const hero = state.getHero(heroId);
      
      if (!hero) return false;
      if (!state.canMoveTo(heroId, targetPosition)) return false;
      
      const tile = state.getTileAt(targetPosition);
      if (!tile) return false;
      
      const movementCost = tile.movementCost;
      
      set((draft) => {
        const faction = draft.factions.find((f) => f.id === hero.factionId);
        const heroToMove = faction?.heroes.find((h) => h.id === heroId);
        
        if (heroToMove && heroToMove.movementPoints >= movementCost) {
          heroToMove.position = targetPosition;
          heroToMove.movementPoints -= movementCost;
          
          // Check for POI interaction
          if (tile.pointOfInterest) {
            const poi = tile.pointOfInterest;
            poi.isDiscovered = true;
            
            if (poi.type === 'town') {
              draft.gamePhase = 'town';
            } else if (poi.type === 'enemy_camp' && poi.garrison?.length) {
              // Trigger combat
            }
          }
        }
      });
      
      return true;
    },

    // End turn
    endTurn: () => {
      set((state) => {
        // Find next faction
        const currentIndex = state.factions.findIndex(
          (f) => f.id === state.currentFaction
        );
        const nextIndex = (currentIndex + 1) % state.factions.length;
        const nextFaction = state.factions[nextIndex];
        
        // If we've cycled back to player, increment turn
        if (nextFaction.id === 'player') {
          state.turn += 1;
          
          // Collect resources from owned nodes
          for (const faction of state.factions) {
            for (const node of state.worldMap.resourceNodes) {
              if (node.isOwned && node.ownedBy === faction.id) {
                faction.resources[node.resourceType] += node.amountPerTurn;
              }
            }
          }
        }
        
        // Reset movement points for next faction's heroes
        for (const hero of nextFaction.heroes) {
          hero.movementPoints = hero.maxMovementPoints;
        }
        
        state.currentFaction = nextFaction.id;
        
        // Auto-select first hero of current faction
        if (nextFaction.heroes.length > 0) {
          state.selectedHeroId = nextFaction.heroes[0].id;
        }
      });
      
      // If AI turn, process AI actions
      const state = get();
      if (state.factions.find((f) => f.id === state.currentFaction)?.isAI) {
        // Simple AI: just end turn for now (will be expanded)
        setTimeout(() => {
          get().endTurn();
        }, 500);
      }
    },

    // Start combat
    startCombat: (attackerId, defenderId) => {
      const state = get();
      const attacker = state.getHero(attackerId);
      
      if (!attacker) return;
      
      let defender: Hero | PointOfInterest | undefined;
      let defenderUnits: Unit[] = [];
      
      if (typeof defenderId === 'string') {
        defender = state.getHero(defenderId);
        defenderUnits = (defender as Hero)?.crew || [];
      } else {
        defender = defenderId;
        defenderUnits = defenderId.garrison || [];
      }
      
      if (!defender) return;
      
      // Convert units to combat units
      const attackerCombatUnits: CombatUnit[] = attacker.crew.map((unit, i) => ({
        ...unit,
        combatPosition: { x: 0, y: i },
        hasActed: false,
        isDefending: false,
        statusEffects: [],
      }));
      
      const defenderCombatUnits: CombatUnit[] = defenderUnits.map((unit, i) => ({
        ...unit,
        combatPosition: { x: 7, y: i },
        hasActed: false,
        isDefending: false,
        statusEffects: [],
      }));
      
      // Create turn order based on speed
      const allUnits = [...attackerCombatUnits, ...defenderCombatUnits];
      const turnOrder = [...allUnits].sort((a, b) => b.stats.speed - a.stats.speed);
      
      set((draft) => {
        draft.combatState = {
          isActive: true,
          attacker,
          defender,
          attackerUnits: attackerCombatUnits,
          defenderUnits: defenderCombatUnits,
          currentTurn: 'attacker',
          currentUnitIndex: 0,
          turnOrder,
          combatLog: [],
          gridWidth: 8,
          gridHeight: 6,
        };
        draft.gamePhase = 'combat';
      });
    },

    // Execute combat action
    executeCombatAction: (action) => {
      set((draft) => {
        if (!draft.combatState) return;
        
        const { combatState } = draft;
        const sourceUnit = [...combatState.attackerUnits, ...combatState.defenderUnits]
          .find((u) => u.id === action.sourceUnit);
        
        if (!sourceUnit || sourceUnit.hasActed) return;
        
        switch (action.type) {
          case 'move':
            if (action.targetPosition) {
              sourceUnit.combatPosition = action.targetPosition;
            }
            break;
            
          case 'attack':
            if (action.targetUnit) {
              const targetUnit = [...combatState.attackerUnits, ...combatState.defenderUnits]
                .find((u) => u.id === action.targetUnit);
              
              if (targetUnit) {
                // Calculate damage
                const damage = Math.max(
                  1,
                  sourceUnit.stats.attack * sourceUnit.count - targetUnit.stats.defense
                );
                
                // Apply damage
                targetUnit.stats.hp -= damage;
                
                // Calculate casualties
                const hpPerUnit = UNIT_TEMPLATES[targetUnit.type].stats.maxHp;
                const unitsKilled = Math.floor(damage / hpPerUnit);
                targetUnit.count = Math.max(0, targetUnit.count - unitsKilled);
                
                // Log combat
                combatState.combatLog.push({
                  turn: combatState.turnOrder.indexOf(sourceUnit),
                  message: `${sourceUnit.name} deals ${damage} damage to ${targetUnit.name}`,
                  timestamp: Date.now(),
                });
                
                // Remove dead units
                if (targetUnit.count <= 0 || targetUnit.stats.hp <= 0) {
                  const isAttacker = combatState.attackerUnits.includes(targetUnit);
                  if (isAttacker) {
                    const index = combatState.attackerUnits.indexOf(targetUnit);
                    combatState.attackerUnits.splice(index, 1);
                  } else {
                    const index = combatState.defenderUnits.indexOf(targetUnit);
                    combatState.defenderUnits.splice(index, 1);
                  }
                }
              }
            }
            break;
            
          case 'defend':
            sourceUnit.isDefending = true;
            sourceUnit.stats.defense *= 1.5;
            break;
            
          case 'wait':
            // Move to end of turn order
            break;
        }
        
        sourceUnit.hasActed = true;
        
        // Check for combat end
        if (combatState.attackerUnits.length === 0 || combatState.defenderUnits.length === 0) {
          // Combat will end
        } else {
          // Next unit
          combatState.currentUnitIndex = 
            (combatState.currentUnitIndex + 1) % combatState.turnOrder.length;
          
          // If all units have acted, reset for next round
          const allActed = combatState.turnOrder.every((u) => u.hasActed);
          if (allActed) {
            combatState.turnOrder.forEach((u) => {
              u.hasActed = false;
              u.isDefending = false;
            });
          }
        }
      });
    },

    // Run auto battle
    runAutoBattle: () => {
      const state = get();
      if (!state.combatState) return null;
      
      // Simple auto-battle: units attack random enemies each round
      let maxRounds = 20;
      
      while (maxRounds > 0) {
        const combat = get().combatState;
        if (!combat) break;
        
        if (combat.attackerUnits.length === 0 || combat.defenderUnits.length === 0) {
          break;
        }
        
        // Each unit attacks
        for (const unit of [...combat.attackerUnits]) {
          const enemies = combat.defenderUnits;
          if (enemies.length === 0) break;
          
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          get().executeCombatAction({
            type: 'attack',
            sourceUnit: unit.id,
            targetUnit: target.id,
          });
        }
        
        const combatAfterAttack = get().combatState;
        if (!combatAfterAttack || combatAfterAttack.defenderUnits.length === 0) break;
        
        for (const unit of [...combatAfterAttack.defenderUnits]) {
          const enemies = combatAfterAttack.attackerUnits;
          if (enemies.length === 0) break;
          
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          get().executeCombatAction({
            type: 'attack',
            sourceUnit: unit.id,
            targetUnit: target.id,
          });
        }
        
        maxRounds--;
      }
      
      const finalCombat = get().combatState;
      if (!finalCombat) return null;
      
      const winner = finalCombat.attackerUnits.length > 0 ? 'attacker' : 'defender';
      
      const result: CombatResult = {
        winner,
        attackerLosses: [],
        defenderLosses: [],
        experienceGained: winner === 'attacker' ? 50 : 0,
        resourcesLooted: winner === 'attacker' ? { gold: 100, wood: 20, stone: 10, crystals: 5 } : { gold: 0, wood: 0, stone: 0, crystals: 0 },
      };
      
      return result;
    },

    // End combat
    endCombat: (result) => {
      set((draft) => {
        if (!draft.combatState) return;
        
        const attacker = draft.factions
          .flatMap((f) => f.heroes)
          .find((h) => h.id === draft.combatState!.attacker.id);
        
        if (attacker && result.winner === 'attacker') {
          // Add experience
          attacker.experience += result.experienceGained;
          
          // Level up check
          if (attacker.experience >= attacker.experienceToNext) {
            attacker.level += 1;
            attacker.experience -= attacker.experienceToNext;
            attacker.experienceToNext = Math.floor(attacker.experienceToNext * 1.5);
            attacker.bonuses.attackBonus += 1;
            attacker.bonuses.defenseBonus += 1;
          }
          
          // Add resources
          const faction = draft.factions.find((f) => f.id === attacker.factionId);
          if (faction) {
            faction.resources.gold += result.resourcesLooted.gold;
            faction.resources.wood += result.resourcesLooted.wood;
            faction.resources.stone += result.resourcesLooted.stone;
            faction.resources.crystals += result.resourcesLooted.crystals;
          }
          
          // Update crew with surviving units
          attacker.crew = draft.combatState.attackerUnits.map((cu) => ({
            id: cu.id,
            type: cu.type,
            name: cu.name,
            stats: cu.stats,
            count: cu.count,
            experience: cu.experience,
          }));
        }
        
        draft.combatState = undefined;
        draft.gamePhase = 'world_map';
      });
    },

    // Enter town
    enterTown: (townId) => {
      set((state) => {
        const town = state.worldMap.pointsOfInterest.find(
          (poi) => poi.id === townId && poi.type === 'town'
        );
        if (town) {
          state.gamePhase = 'town';
        }
      });
    },

    // Leave town
    leaveTown: () => {
      set((state) => {
        state.gamePhase = 'world_map';
      });
    },

    // Recruit unit
    recruitUnit: (townId, unitType, count) => {
      const state = get();
      const hero = state.selectedHeroId ? state.getHero(state.selectedHeroId) : undefined;
      const faction = hero ? state.getFaction(hero.factionId) : undefined;
      
      if (!hero || !faction) return false;
      
      const town = state.worldMap.pointsOfInterest.find(
        (poi) => poi.id === townId
      ) as Town | undefined;
      
      if (!town || town.type !== 'town') return false;
      
      const recruitOption = town.recruitPool.find((r) => r.unitType === unitType);
      if (!recruitOption || recruitOption.available < count) return false;
      
      const totalCost = {
        gold: recruitOption.cost.gold * count,
        wood: recruitOption.cost.wood * count,
        stone: recruitOption.cost.stone * count,
        crystals: recruitOption.cost.crystals * count,
      };
      
      if (!state.spendResources(faction.id, totalCost)) return false;
      
      set((draft) => {
        // Find or create unit stack in hero's crew
        const draftHero = draft.factions
          .flatMap((f) => f.heroes)
          .find((h) => h.id === hero.id);
        
        if (!draftHero) return;
        
        const existingUnit = draftHero.crew.find((u) => u.type === unitType);
        
        if (existingUnit) {
          existingUnit.count += count;
        } else {
          const template = UNIT_TEMPLATES[unitType as keyof typeof UNIT_TEMPLATES];
          draftHero.crew.push({
            ...template,
            id: `unit_${Date.now()}`,
            count,
          });
        }
        
        // Update recruit pool
        const draftTown = draft.worldMap.pointsOfInterest.find(
          (poi) => poi.id === townId
        ) as Town;
        const draftRecruit = draftTown.recruitPool.find((r) => r.unitType === unitType);
        if (draftRecruit) {
          draftRecruit.available -= count;
        }
      });
      
      return true;
    },

    // Add resources
    addResources: (factionId, resources) => {
      set((draft) => {
        const faction = draft.factions.find((f) => f.id === factionId);
        if (faction) {
          if (resources.gold) faction.resources.gold += resources.gold;
          if (resources.wood) faction.resources.wood += resources.wood;
          if (resources.stone) faction.resources.stone += resources.stone;
          if (resources.crystals) faction.resources.crystals += resources.crystals;
        }
      });
    },

    // Spend resources
    spendResources: (factionId, resources) => {
      const faction = get().getFaction(factionId);
      if (!faction) return false;
      
      const canAfford =
        (resources.gold === undefined || faction.resources.gold >= resources.gold) &&
        (resources.wood === undefined || faction.resources.wood >= resources.wood) &&
        (resources.stone === undefined || faction.resources.stone >= resources.stone) &&
        (resources.crystals === undefined || faction.resources.crystals >= resources.crystals);
      
      if (!canAfford) return false;
      
      set((draft) => {
        const draftFaction = draft.factions.find((f) => f.id === factionId);
        if (draftFaction) {
          if (resources.gold) draftFaction.resources.gold -= resources.gold;
          if (resources.wood) draftFaction.resources.wood -= resources.wood;
          if (resources.stone) draftFaction.resources.stone -= resources.stone;
          if (resources.crystals) draftFaction.resources.crystals -= resources.crystals;
        }
      });
      
      return true;
    },

    // Utility: Get hero by ID
    getHero: (heroId) => {
      return get().factions.flatMap((f) => f.heroes).find((h) => h.id === heroId);
    },

    // Utility: Get faction by ID
    getFaction: (factionId) => {
      return get().factions.find((f) => f.id === factionId);
    },

    // Utility: Get tile at position
    getTileAt: (position) => {
      const { worldMap } = get();
      if (
        position.x < 0 ||
        position.x >= worldMap.width ||
        position.y < 0 ||
        position.y >= worldMap.height
      ) {
        return undefined;
      }
      return worldMap.tiles[position.y]?.[position.x];
    },

    // Utility: Get movement range for hero
    getMovementRange: (heroId) => {
      const state = get();
      const hero = state.getHero(heroId);
      
      if (!hero) return [];
      
      const reachable: Position[] = [];
      const visited = new Set<string>();
      const queue: { pos: Position; cost: number }[] = [
        { pos: hero.position, cost: 0 },
      ];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        const key = `${current.pos.x},${current.pos.y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        if (current.cost <= hero.movementPoints) {
          if (current.pos.x !== hero.position.x || current.pos.y !== hero.position.y) {
            reachable.push(current.pos);
          }
          
          // Check neighbors
          const neighbors = [
            { x: current.pos.x + 1, y: current.pos.y },
            { x: current.pos.x - 1, y: current.pos.y },
            { x: current.pos.x, y: current.pos.y + 1 },
            { x: current.pos.x, y: current.pos.y - 1 },
          ];
          
          for (const neighbor of neighbors) {
            const tile = state.getTileAt(neighbor);
            if (tile && tile.isPassable) {
              const newCost = current.cost + tile.movementCost;
              if (newCost <= hero.movementPoints) {
                queue.push({ pos: neighbor, cost: newCost });
              }
            }
          }
        }
      }
      
      return reachable;
    },

    // Utility: Check if hero can move to position
    canMoveTo: (heroId, position) => {
      const range = get().getMovementRange(heroId);
      return range.some((p) => p.x === position.x && p.y === position.y);
    },
  }))
);
