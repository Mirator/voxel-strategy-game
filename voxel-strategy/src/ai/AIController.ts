// AI Controller for enemy faction behavior
import type {
  Hero,
  Faction,
  WorldMap,
  Position,
  PointOfInterest,
  ResourceNode,
} from '../core/types';

interface AIAction {
  type: 'move' | 'attack' | 'capture' | 'recruit' | 'wait';
  heroId: string;
  target?: Position | string;
  priority: number;
}

interface AIState {
  faction: Faction;
  worldMap: WorldMap;
  allFactions: Faction[];
}

// Simple AI decision making
export class AIController {
  private state: AIState;

  constructor(state: AIState) {
    this.state = state;
  }

  // Get all possible actions for an AI faction
  getActions(): AIAction[] {
    const actions: AIAction[] = [];

    for (const hero of this.state.faction.heroes) {
      // Get movement options
      const moveActions = this.evaluateMoveActions(hero);
      actions.push(...moveActions);

      // Get attack options
      const attackActions = this.evaluateAttackActions(hero);
      actions.push(...attackActions);

      // Add wait action as fallback
      actions.push({
        type: 'wait',
        heroId: hero.id,
        priority: 0,
      });
    }

    // Sort by priority
    return actions.sort((a, b) => b.priority - a.priority);
  }

  // Get the best action
  getBestAction(): AIAction | null {
    const actions = this.getActions();
    return actions.length > 0 ? actions[0] : null;
  }

  // Evaluate possible move destinations
  private evaluateMoveActions(hero: Hero): AIAction[] {
    const actions: AIAction[] = [];
    const movementRange = this.getMovementRange(hero);

    for (const pos of movementRange) {
      const priority = this.evaluatePosition(hero, pos);
      
      if (priority > 0) {
        actions.push({
          type: 'move',
          heroId: hero.id,
          target: pos,
          priority,
        });
      }
    }

    return actions;
  }

  // Evaluate attack opportunities
  private evaluateAttackActions(hero: Hero): AIAction[] {
    const actions: AIAction[] = [];
    const nearbyEnemies = this.findNearbyEnemies(hero);

    for (const enemy of nearbyEnemies) {
      const canAttack = this.canReach(hero, enemy.position);
      const winChance = this.estimateBattleOutcome(hero, enemy);

      if (canAttack && winChance > 0.4) {
        actions.push({
          type: 'attack',
          heroId: hero.id,
          target: enemy.id,
          priority: 50 + winChance * 50,
        });
      }
    }

    return actions;
  }

  // Calculate value of a position
  private evaluatePosition(hero: Hero, pos: Position): number {
    let value = 0;

    const tile = this.state.worldMap.tiles[pos.y]?.[pos.x];
    if (!tile || !tile.isPassable) return -1;

    // Value unclaimed resource nodes
    const nearbyResources = this.findNearbyResources(pos);
    for (const resource of nearbyResources) {
      if (!resource.isOwned || resource.ownedBy !== this.state.faction.id) {
        value += 20;
      }
    }

    // Value unclaimed towns
    const nearbyTowns = this.findNearbyTowns(pos);
    for (const town of nearbyTowns) {
      if (town.factionId !== this.state.faction.id) {
        value += 40;
      }
    }

    // Value positions closer to enemies (aggressive AI)
    const nearbyEnemies = this.findNearbyEnemies(hero);
    for (const enemy of nearbyEnemies) {
      const currentDist = this.manhattanDistance(hero.position, enemy.position);
      const newDist = this.manhattanDistance(pos, enemy.position);
      
      if (newDist < currentDist) {
        value += 15;
      }
    }

    // Penalize moving away from owned territory
    const ownedTowns = this.state.worldMap.pointsOfInterest.filter(
      (poi) => poi.type === 'town' && poi.factionId === this.state.faction.id
    );
    
    if (ownedTowns.length > 0) {
      const closestOwned = ownedTowns.reduce((closest, town) => {
        const dist = this.manhattanDistance(pos, town.position);
        return dist < closest ? dist : closest;
      }, Infinity);
      
      if (closestOwned > 20) {
        value -= 10;
      }
    }

    return Math.max(0, value);
  }

  // Estimate battle outcome (0-1, higher is better for attacker)
  private estimateBattleOutcome(attacker: Hero, defender: Hero): number {
    const attackerPower = this.calculateArmyPower(attacker);
    const defenderPower = this.calculateArmyPower(defender);

    if (defenderPower === 0) return 1;
    
    const ratio = attackerPower / (attackerPower + defenderPower);
    return ratio;
  }

  // Calculate total army power
  private calculateArmyPower(hero: Hero): number {
    return hero.crew.reduce((total, unit) => {
      const unitPower = 
        (unit.stats.attack + unit.stats.defense) * 
        unit.count * 
        (unit.stats.hp / unit.stats.maxHp);
      return total + unitPower;
    }, 0);
  }

  // Get movement range for hero (simplified)
  private getMovementRange(hero: Hero): Position[] {
    const range: Position[] = [];
    const mp = hero.movementPoints;

    for (let dy = -mp; dy <= mp; dy++) {
      for (let dx = -mp; dx <= mp; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= mp) {
          const x = hero.position.x + dx;
          const y = hero.position.y + dy;
          
          const tile = this.state.worldMap.tiles[y]?.[x];
          if (tile && tile.isPassable) {
            range.push({ x, y });
          }
        }
      }
    }

    return range;
  }

  // Check if hero can reach position
  private canReach(hero: Hero, target: Position): boolean {
    const distance = this.manhattanDistance(hero.position, target);
    return distance <= hero.movementPoints;
  }

  // Find enemy heroes near a position
  private findNearbyEnemies(hero: Hero): Hero[] {
    const enemies: Hero[] = [];

    for (const faction of this.state.allFactions) {
      if (faction.id === this.state.faction.id) continue;

      for (const enemyHero of faction.heroes) {
        const distance = this.manhattanDistance(hero.position, enemyHero.position);
        if (distance <= hero.movementPoints * 2) {
          enemies.push(enemyHero);
        }
      }
    }

    return enemies;
  }

  // Find resource nodes near a position
  private findNearbyResources(pos: Position): ResourceNode[] {
    return this.state.worldMap.resourceNodes.filter((node) => {
      const distance = this.manhattanDistance(pos, node.position);
      return distance <= 3;
    });
  }

  // Find towns near a position
  private findNearbyTowns(pos: Position): PointOfInterest[] {
    return this.state.worldMap.pointsOfInterest.filter((poi) => {
      if (poi.type !== 'town') return false;
      const distance = this.manhattanDistance(pos, poi.position);
      return distance <= 5;
    });
  }

  // Manhattan distance
  private manhattanDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
}

// AI turn executor
export function executeAITurn(
  faction: Faction,
  worldMap: WorldMap,
  allFactions: Faction[],
  moveHero: (heroId: string, pos: Position) => boolean,
  endTurn: () => void
): void {
  const ai = new AIController({ faction, worldMap, allFactions });

  // Execute actions for each hero
  for (const hero of faction.heroes) {
    if (hero.movementPoints <= 0) continue;

    const action = ai.getBestAction();
    
    if (action && action.type === 'move' && action.target) {
      const target = action.target as Position;
      moveHero(hero.id, target);
    }
  }

  // End the AI's turn
  setTimeout(endTurn, 500);
}
