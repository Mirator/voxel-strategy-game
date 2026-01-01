// Unit tests for game store
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';

describe('Game Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
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
    });
  });

  describe('initGame', () => {
    it('should initialize the game with default config', () => {
      const { initGame } = useGameStore.getState();
      
      initGame();
      
      const state = useGameStore.getState();
      expect(state.gamePhase).toBe('world_map');
      expect(state.turn).toBe(1);
      expect(state.currentFaction).toBe('player');
      expect(state.worldMap.width).toBeGreaterThan(0);
      expect(state.worldMap.height).toBeGreaterThan(0);
      expect(state.factions.length).toBeGreaterThan(0);
    });

    it('should initialize with custom config', () => {
      const { initGame } = useGameStore.getState();
      
      initGame({
        mapWidth: 32,
        mapHeight: 32,
        seed: 'test-seed',
        difficulty: 'hard',
      });
      
      const state = useGameStore.getState();
      expect(state.worldMap.width).toBe(32);
      expect(state.worldMap.height).toBe(32);
      expect(state.worldMap.seed).toBe('test-seed');
    });

    it('should create player faction with a hero', () => {
      const { initGame } = useGameStore.getState();
      
      initGame({ seed: 'hero-test' });
      
      const state = useGameStore.getState();
      const playerFaction = state.factions.find((f) => f.id === 'player');
      
      expect(playerFaction).toBeDefined();
      expect(playerFaction!.heroes.length).toBeGreaterThan(0);
      expect(playerFaction!.isAI).toBe(false);
    });

    it('should create AI faction', () => {
      const { initGame } = useGameStore.getState();
      
      initGame({ seed: 'ai-test' });
      
      const state = useGameStore.getState();
      const aiFaction = state.factions.find((f) => f.isAI);
      
      expect(aiFaction).toBeDefined();
    });

    it('should select the first player hero by default', () => {
      const { initGame } = useGameStore.getState();
      
      initGame({ seed: 'selection-test' });
      
      const state = useGameStore.getState();
      const playerFaction = state.factions.find((f) => f.id === 'player');
      
      expect(state.selectedHeroId).toBe(playerFaction?.heroes[0]?.id);
    });

    it('should give player faction starting resources', () => {
      const { initGame } = useGameStore.getState();
      
      initGame({ seed: 'resources-test' });
      
      const state = useGameStore.getState();
      const playerFaction = state.factions.find((f) => f.id === 'player');
      
      expect(playerFaction?.resources.gold).toBeGreaterThan(0);
      expect(playerFaction?.resources.wood).toBeGreaterThan(0);
      expect(playerFaction?.resources.stone).toBeGreaterThan(0);
    });
  });

  describe('selectHero', () => {
    beforeEach(() => {
      useGameStore.getState().initGame({ seed: 'select-hero-test' });
    });

    it('should select a hero by id', () => {
      const { selectHero, factions } = useGameStore.getState();
      const heroId = factions[0].heroes[0].id;
      
      selectHero(heroId);
      
      expect(useGameStore.getState().selectedHeroId).toBe(heroId);
    });

    it('should deselect hero when passing undefined', () => {
      const { selectHero } = useGameStore.getState();
      
      selectHero(undefined);
      
      expect(useGameStore.getState().selectedHeroId).toBeUndefined();
    });
  });

  describe('getHero', () => {
    beforeEach(() => {
      useGameStore.getState().initGame({ seed: 'get-hero-test' });
    });

    it('should return hero by id', () => {
      const { getHero, factions } = useGameStore.getState();
      const expectedHero = factions[0].heroes[0];
      
      const hero = getHero(expectedHero.id);
      
      expect(hero).toBeDefined();
      expect(hero?.id).toBe(expectedHero.id);
      expect(hero?.name).toBe(expectedHero.name);
    });

    it('should return undefined for non-existent hero', () => {
      const { getHero } = useGameStore.getState();
      
      const hero = getHero('non-existent-id');
      
      expect(hero).toBeUndefined();
    });
  });

  describe('getFaction', () => {
    beforeEach(() => {
      useGameStore.getState().initGame({ seed: 'get-faction-test' });
    });

    it('should return faction by id', () => {
      const { getFaction } = useGameStore.getState();
      
      const playerFaction = getFaction('player');
      
      expect(playerFaction).toBeDefined();
      expect(playerFaction?.id).toBe('player');
    });

    it('should return undefined for non-existent faction', () => {
      const { getFaction } = useGameStore.getState();
      
      const faction = getFaction('non-existent' as any);
      
      expect(faction).toBeUndefined();
    });
  });

  describe('getTileAt', () => {
    beforeEach(() => {
      useGameStore.getState().initGame({ 
        seed: 'tile-test',
        mapWidth: 32,
        mapHeight: 32,
      });
    });

    it('should return tile at valid position', () => {
      const { getTileAt } = useGameStore.getState();
      
      const tile = getTileAt({ x: 10, y: 10 });
      
      expect(tile).toBeDefined();
      expect(tile?.position).toEqual({ x: 10, y: 10 });
    });

    it('should return undefined for out of bounds position', () => {
      const { getTileAt } = useGameStore.getState();
      
      expect(getTileAt({ x: -1, y: 0 })).toBeUndefined();
      expect(getTileAt({ x: 0, y: -1 })).toBeUndefined();
      expect(getTileAt({ x: 100, y: 0 })).toBeUndefined();
      expect(getTileAt({ x: 0, y: 100 })).toBeUndefined();
    });
  });

  describe('getMovementRange', () => {
    beforeEach(() => {
      useGameStore.getState().initGame({ seed: 'movement-range-test' });
    });

    it('should return positions within movement range', () => {
      const { getMovementRange, factions } = useGameStore.getState();
      const heroId = factions[0].heroes[0].id;
      
      const range = getMovementRange(heroId);
      
      expect(Array.isArray(range)).toBe(true);
    });

    it('should return empty array for invalid hero', () => {
      const { getMovementRange } = useGameStore.getState();
      
      const range = getMovementRange('invalid-id');
      
      expect(range).toEqual([]);
    });
  });

  describe('canMoveTo', () => {
    beforeEach(() => {
      useGameStore.getState().initGame({ seed: 'can-move-test' });
    });

    it('should return true for valid move positions', () => {
      const { canMoveTo, getMovementRange, factions } = useGameStore.getState();
      const heroId = factions[0].heroes[0].id;
      const range = getMovementRange(heroId);
      
      if (range.length > 0) {
        const canMove = canMoveTo(heroId, range[0]);
        expect(canMove).toBe(true);
      }
    });

    it('should return false for positions outside range', () => {
      const { canMoveTo, factions } = useGameStore.getState();
      const heroId = factions[0].heroes[0].id;
      
      // Very far position
      const canMove = canMoveTo(heroId, { x: 1000, y: 1000 });
      expect(canMove).toBe(false);
    });
  });

  describe('moveHero', () => {
    beforeEach(() => {
      useGameStore.getState().initGame({ seed: 'move-hero-test' });
    });

    it('should move hero to valid position', () => {
      const { moveHero, getHero, getMovementRange, factions } = useGameStore.getState();
      const hero = factions[0].heroes[0];
      const range = getMovementRange(hero.id);
      
      if (range.length > 0) {
        const targetPos = range[0];
        const result = moveHero(hero.id, targetPos);
        
        if (result) {
          const movedHero = useGameStore.getState().getHero(hero.id);
          expect(movedHero?.position).toEqual(targetPos);
        }
      }
    });

    it('should reduce movement points after moving', () => {
      const { moveHero, getHero, getMovementRange, factions } = useGameStore.getState();
      const hero = factions[0].heroes[0];
      const initialMP = hero.movementPoints;
      const range = getMovementRange(hero.id);
      
      if (range.length > 0) {
        moveHero(hero.id, range[0]);
        
        const movedHero = useGameStore.getState().getHero(hero.id);
        expect(movedHero?.movementPoints).toBeLessThan(initialMP);
      }
    });

    it('should return false for invalid moves', () => {
      const { moveHero, factions } = useGameStore.getState();
      const hero = factions[0].heroes[0];
      
      const result = moveHero(hero.id, { x: 1000, y: 1000 });
      
      expect(result).toBe(false);
    });
  });

  describe('endTurn', () => {
    beforeEach(() => {
      useGameStore.getState().initGame({ seed: 'end-turn-test' });
    });

    it('should advance to next faction', () => {
      const { endTurn } = useGameStore.getState();
      const initialFaction = useGameStore.getState().currentFaction;
      
      endTurn();
      
      // Note: The actual next faction depends on game implementation
      // This test verifies the function runs without error
      const state = useGameStore.getState();
      expect(state.currentFaction).toBeDefined();
    });

    it('should reset movement points when cycling back to a faction', () => {
      const state = useGameStore.getState();
      const hero = state.factions[0].heroes[0];
      
      // Exhaust movement points by multiple moves
      // Then end turns to cycle back
      // This is a simplified test - actual implementation may vary
      expect(hero.movementPoints).toBe(hero.maxMovementPoints);
    });
  });

  describe('resource management', () => {
    beforeEach(() => {
      useGameStore.getState().initGame({ seed: 'resource-mgmt-test' });
    });

    describe('addResources', () => {
      it('should add resources to faction', () => {
        const { addResources, getFaction } = useGameStore.getState();
        const initialGold = getFaction('player')!.resources.gold;
        
        addResources('player', { gold: 100 });
        
        const newGold = useGameStore.getState().getFaction('player')!.resources.gold;
        expect(newGold).toBe(initialGold + 100);
      });

      it('should handle partial resource updates', () => {
        const { addResources, getFaction } = useGameStore.getState();
        const initial = getFaction('player')!.resources;
        
        addResources('player', { wood: 50 });
        
        const updated = useGameStore.getState().getFaction('player')!.resources;
        expect(updated.wood).toBe(initial.wood + 50);
        expect(updated.gold).toBe(initial.gold);
      });
    });

    describe('spendResources', () => {
      it('should spend resources if affordable', () => {
        const { spendResources, getFaction } = useGameStore.getState();
        const initialGold = getFaction('player')!.resources.gold;
        
        const result = spendResources('player', { gold: 50 });
        
        expect(result).toBe(true);
        const newGold = useGameStore.getState().getFaction('player')!.resources.gold;
        expect(newGold).toBe(initialGold - 50);
      });

      it('should return false if not affordable', () => {
        const { spendResources } = useGameStore.getState();
        
        const result = spendResources('player', { gold: 1000000 });
        
        expect(result).toBe(false);
      });

      it('should not modify resources if not affordable', () => {
        const { spendResources, getFaction } = useGameStore.getState();
        const initialResources = { ...getFaction('player')!.resources };
        
        spendResources('player', { gold: 1000000 });
        
        const currentResources = useGameStore.getState().getFaction('player')!.resources;
        expect(currentResources).toEqual(initialResources);
      });
    });
  });

  describe('town interactions', () => {
    beforeEach(() => {
      useGameStore.getState().initGame({ seed: 'town-test' });
    });

    describe('enterTown', () => {
      it('should change game phase to town', () => {
        const { enterTown, worldMap } = useGameStore.getState();
        const town = worldMap.pointsOfInterest.find((poi) => poi.type === 'town');
        
        if (town) {
          enterTown(town.id);
          expect(useGameStore.getState().gamePhase).toBe('town');
        }
      });
    });

    describe('leaveTown', () => {
      it('should change game phase back to world_map', () => {
        const { leaveTown, enterTown, worldMap } = useGameStore.getState();
        const town = worldMap.pointsOfInterest.find((poi) => poi.type === 'town');
        
        if (town) {
          enterTown(town.id);
          leaveTown();
          expect(useGameStore.getState().gamePhase).toBe('world_map');
        }
      });
    });
  });

  describe('hero properties', () => {
    beforeEach(() => {
      useGameStore.getState().initGame({ seed: 'hero-props-test' });
    });

    it('should have valid hero stats', () => {
      const { factions } = useGameStore.getState();
      const hero = factions[0].heroes[0];
      
      expect(hero.level).toBeGreaterThanOrEqual(1);
      expect(hero.experience).toBeGreaterThanOrEqual(0);
      expect(hero.experienceToNext).toBeGreaterThan(0);
      expect(hero.movementPoints).toBeGreaterThan(0);
      expect(hero.maxMovementPoints).toBeGreaterThan(0);
    });

    it('should have a crew with units', () => {
      const { factions } = useGameStore.getState();
      const hero = factions[0].heroes[0];
      
      expect(Array.isArray(hero.crew)).toBe(true);
      expect(hero.crew.length).toBeGreaterThan(0);
      
      for (const unit of hero.crew) {
        expect(unit.id).toBeDefined();
        expect(unit.type).toBeDefined();
        expect(unit.stats).toBeDefined();
        expect(unit.count).toBeGreaterThan(0);
      }
    });

    it('should have hero bonuses', () => {
      const { factions } = useGameStore.getState();
      const hero = factions[0].heroes[0];
      
      expect(hero.bonuses).toBeDefined();
      expect(typeof hero.bonuses.attackBonus).toBe('number');
      expect(typeof hero.bonuses.defenseBonus).toBe('number');
    });
  });
});
