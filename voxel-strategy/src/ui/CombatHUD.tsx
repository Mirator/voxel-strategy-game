// Combat HUD component
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import './ui.css';

export function CombatHUD() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const combatState = useGameStore((state) => state.combatState);
  const executeCombatAction = useGameStore((state) => state.executeCombatAction);
  const runAutoBattle = useGameStore((state) => state.runAutoBattle);
  const endCombat = useGameStore((state) => state.endCombat);
  
  const [selectedAction, setSelectedAction] = useState<'move' | 'attack' | 'defend' | null>(null);
  
  if (gamePhase !== 'combat' || !combatState) {
    return null;
  }
  
  const {
    attacker,
    defender,
    attackerUnits,
    defenderUnits,
    turnOrder,
    currentUnitIndex,
    combatLog,
  } = combatState;
  
  const currentUnit = turnOrder[currentUnitIndex];
  const isPlayerTurn = attackerUnits.some((u) => u.id === currentUnit?.id);
  
  const handleAction = (action: 'move' | 'attack' | 'defend' | 'wait') => {
    if (!currentUnit) return;
    
    if (action === 'defend') {
      executeCombatAction({
        type: 'defend',
        sourceUnit: currentUnit.id,
      });
    } else if (action === 'wait') {
      executeCombatAction({
        type: 'wait',
        sourceUnit: currentUnit.id,
      });
    } else {
      setSelectedAction(action);
    }
  };
  
  const handleAutoBattle = () => {
    const result = runAutoBattle();
    if (result) {
      endCombat(result);
    }
  };
  
  const handleRetreat = () => {
    // Retreat counts as a loss
    endCombat({
      winner: 'defender',
      attackerLosses: [],
      defenderLosses: [],
      experienceGained: 0,
      resourcesLooted: { gold: 0, wood: 0, stone: 0, crystals: 0 },
    });
  };
  
  // Check for combat end
  const isCombatOver = attackerUnits.length === 0 || defenderUnits.length === 0;
  
  if (isCombatOver) {
    const winner = attackerUnits.length > 0 ? 'attacker' : 'defender';
    return (
      <div className="combat-hud">
        <div className="combat-result-overlay">
          <h2>{winner === 'attacker' ? 'Victory!' : 'Defeat!'}</h2>
          <p>{winner === 'attacker' ? 'You have won the battle!' : 'Your army has been defeated.'}</p>
          <button
            className="continue-button"
            onClick={() =>
              endCombat({
                winner,
                attackerLosses: [],
                defenderLosses: [],
                experienceGained: winner === 'attacker' ? 100 : 0,
                resourcesLooted:
                  winner === 'attacker'
                    ? { gold: 200, wood: 50, stone: 30, crystals: 10 }
                    : { gold: 0, wood: 0, stone: 0, crystals: 0 },
              })
            }
          >
            Continue
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="combat-hud">
      {/* Combat header */}
      <div className="combat-header">
        <div className="combatant attacker">
          <h3>{attacker.name}</h3>
          <span className="unit-count">{attackerUnits.length} units</span>
        </div>
        <span className="vs">VS</span>
        <div className="combatant defender">
          <h3>{'name' in defender ? defender.name : 'Enemy'}</h3>
          <span className="unit-count">{defenderUnits.length} units</span>
        </div>
      </div>
      
      {/* Current unit info */}
      {currentUnit && (
        <div className="current-unit-panel">
          <h4>Current Unit: {currentUnit.name}</h4>
          <div className="current-unit-stats">
            <span>❤️ {currentUnit.stats.hp}/{currentUnit.stats.maxHp}</span>
            <span>⚔️ {currentUnit.stats.attack}</span>
            <span>🛡️ {currentUnit.stats.defense}</span>
            <span>💨 {currentUnit.stats.speed}</span>
            <span>🎯 Range: {currentUnit.stats.range}</span>
            <span>×{currentUnit.count}</span>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      {isPlayerTurn && currentUnit && !currentUnit.hasActed && (
        <div className="combat-actions">
          <button
            className={`action-button ${selectedAction === 'move' ? 'selected' : ''}`}
            onClick={() => handleAction('move')}
          >
            🚶 Move
          </button>
          <button
            className={`action-button ${selectedAction === 'attack' ? 'selected' : ''}`}
            onClick={() => handleAction('attack')}
          >
            ⚔️ Attack
          </button>
          <button className="action-button" onClick={() => handleAction('defend')}>
            🛡️ Defend
          </button>
          <button className="action-button" onClick={() => handleAction('wait')}>
            ⏳ Wait
          </button>
        </div>
      )}
      
      {/* Quick actions */}
      <div className="combat-quick-actions">
        <button className="quick-action-button" onClick={handleAutoBattle}>
          ⚡ Auto-Battle
        </button>
        <button className="quick-action-button retreat" onClick={handleRetreat}>
          🏃 Retreat
        </button>
      </div>
      
      {/* Turn order */}
      <div className="turn-order-panel">
        <h4>Turn Order</h4>
        <div className="turn-order-list">
          {turnOrder.slice(0, 8).map((unit, index) => (
            <div
              key={unit.id}
              className={`turn-order-unit ${index === currentUnitIndex ? 'current' : ''} ${
                attackerUnits.includes(unit) ? 'friendly' : 'enemy'
              }`}
            >
              <span className="unit-icon">{getUnitIcon(unit.type)}</span>
              <span className="unit-speed">{unit.stats.speed}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Combat log */}
      <div className="combat-log">
        <h4>Combat Log</h4>
        <div className="log-entries">
          {combatLog.slice(-5).map((entry, index) => (
            <div key={index} className="log-entry">
              {entry.message}
            </div>
          ))}
        </div>
      </div>
      
      {/* Army panels */}
      <div className="army-panels">
        <div className="army-panel attacker">
          <h4>Your Army</h4>
          {attackerUnits.map((unit) => (
            <div key={unit.id} className="army-unit">
              <span className="unit-icon">{getUnitIcon(unit.type)}</span>
              <span className="unit-name">{unit.name}</span>
              <span className="unit-hp">
                ❤️ {unit.stats.hp}/{unit.stats.maxHp}
              </span>
              <span className="unit-count">×{unit.count}</span>
            </div>
          ))}
        </div>
        
        <div className="army-panel defender">
          <h4>Enemy Army</h4>
          {defenderUnits.map((unit) => (
            <div key={unit.id} className="army-unit">
              <span className="unit-icon">{getUnitIcon(unit.type)}</span>
              <span className="unit-name">{unit.name}</span>
              <span className="unit-hp">
                ❤️ {unit.stats.hp}/{unit.stats.maxHp}
              </span>
              <span className="unit-count">×{unit.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getUnitIcon(type: string): string {
  switch (type) {
    case 'warrior':
      return '⚔️';
    case 'archer':
      return '🏹';
    case 'cavalry':
      return '🐴';
    case 'mage':
      return '🔮';
    case 'healer':
      return '💚';
    default:
      return '👤';
  }
}
