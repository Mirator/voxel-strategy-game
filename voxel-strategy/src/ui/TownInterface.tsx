// Town interface component
import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Town, UnitRecruitOption } from '../core/types';
import { UNIT_TEMPLATES } from '../core/types';
import './ui.css';

export function TownInterface() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const worldMap = useGameStore((state) => state.worldMap);
  const selectedHeroId = useGameStore((state) => state.selectedHeroId);
  const getHero = useGameStore((state) => state.getHero);
  const getFaction = useGameStore((state) => state.getFaction);
  const recruitUnit = useGameStore((state) => state.recruitUnit);
  const leaveTown = useGameStore((state) => state.leaveTown);
  
  const [recruitCounts, setRecruitCounts] = useState<Record<string, number>>({});
  
  const selectedHero = useMemo(
    () => (selectedHeroId ? getHero(selectedHeroId) : undefined),
    [selectedHeroId, getHero]
  );
  
  const currentTown = useMemo(() => {
    if (!selectedHero) return undefined;
    
    return worldMap.pointsOfInterest.find(
      (poi) =>
        poi.type === 'town' &&
        poi.position.x === selectedHero.position.x &&
        poi.position.y === selectedHero.position.y
    ) as Town | undefined;
  }, [selectedHero, worldMap.pointsOfInterest]);
  
  const playerFaction = useMemo(
    () => getFaction('player'),
    [getFaction]
  );
  
  if (gamePhase !== 'town' || !currentTown || !selectedHero) {
    return null;
  }
  
  const handleRecruitCountChange = (unitType: string, delta: number) => {
    setRecruitCounts((prev) => ({
      ...prev,
      [unitType]: Math.max(0, (prev[unitType] || 0) + delta),
    }));
  };
  
  const handleRecruit = (option: UnitRecruitOption) => {
    const count = recruitCounts[option.unitType] || 0;
    if (count > 0) {
      const success = recruitUnit(currentTown.id, option.unitType, count);
      if (success) {
        setRecruitCounts((prev) => ({
          ...prev,
          [option.unitType]: 0,
        }));
      }
    }
  };
  
  const canAfford = (option: UnitRecruitOption, count: number): boolean => {
    if (!playerFaction || count <= 0) return false;
    
    return (
      playerFaction.resources.gold >= option.cost.gold * count &&
      playerFaction.resources.wood >= option.cost.wood * count &&
      playerFaction.resources.stone >= option.cost.stone * count &&
      playerFaction.resources.crystals >= option.cost.crystals * count &&
      option.available >= count
    );
  };
  
  return (
    <div className="town-interface">
      <div className="town-overlay">
        <div className="town-panel">
          {/* Header */}
          <div className="town-header">
            <h2>🏰 {currentTown.name}</h2>
            <button className="close-button" onClick={leaveTown}>
              ✕
            </button>
          </div>
          
          {/* Town resources */}
          <div className="town-resources">
            <h3>Your Resources</h3>
            <div className="resource-list">
              <span className="resource">💰 {playerFaction?.resources.gold || 0}</span>
              <span className="resource">🪵 {playerFaction?.resources.wood || 0}</span>
              <span className="resource">🪨 {playerFaction?.resources.stone || 0}</span>
              <span className="resource">💎 {playerFaction?.resources.crystals || 0}</span>
            </div>
          </div>
          
          {/* Recruit section */}
          <div className="recruit-section">
            <h3>Recruit Units</h3>
            <div className="recruit-list">
              {currentTown.recruitPool.map((option) => {
                const template = UNIT_TEMPLATES[option.unitType];
                const count = recruitCounts[option.unitType] || 0;
                const totalCost = {
                  gold: option.cost.gold * count,
                  wood: option.cost.wood * count,
                  stone: option.cost.stone * count,
                  crystals: option.cost.crystals * count,
                };
                const affordable = canAfford(option, count);
                
                return (
                  <div key={option.unitType} className="recruit-item">
                    <div className="unit-info">
                      <span className="unit-icon">{getUnitIcon(option.unitType)}</span>
                      <div className="unit-details">
                        <span className="unit-name">{template.name}</span>
                        <span className="unit-available">
                          Available: {option.available}
                        </span>
                      </div>
                    </div>
                    
                    <div className="unit-stats">
                      <span title="HP">❤️ {template.stats.maxHp}</span>
                      <span title="Attack">⚔️ {template.stats.attack}</span>
                      <span title="Defense">🛡️ {template.stats.defense}</span>
                      <span title="Speed">💨 {template.stats.speed}</span>
                    </div>
                    
                    <div className="unit-cost">
                      <span className="cost-label">Cost per unit:</span>
                      <div className="cost-values">
                        {option.cost.gold > 0 && <span>💰 {option.cost.gold}</span>}
                        {option.cost.wood > 0 && <span>🪵 {option.cost.wood}</span>}
                        {option.cost.stone > 0 && <span>🪨 {option.cost.stone}</span>}
                        {option.cost.crystals > 0 && <span>💎 {option.cost.crystals}</span>}
                      </div>
                    </div>
                    
                    <div className="recruit-controls">
                      <button
                        className="count-button"
                        onClick={() => handleRecruitCountChange(option.unitType, -1)}
                        disabled={count <= 0}
                      >
                        -
                      </button>
                      <span className="recruit-count">{count}</span>
                      <button
                        className="count-button"
                        onClick={() => handleRecruitCountChange(option.unitType, 1)}
                        disabled={count >= option.available}
                      >
                        +
                      </button>
                      <button
                        className="recruit-button"
                        onClick={() => handleRecruit(option)}
                        disabled={!affordable || count <= 0}
                      >
                        Recruit
                        {count > 0 && (
                          <span className="total-cost">
                            ({totalCost.gold > 0 && `💰${totalCost.gold}`}
                            {totalCost.crystals > 0 && ` 💎${totalCost.crystals}`})
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Current army */}
          <div className="army-section">
            <h3>Your Army</h3>
            <div className="army-list">
              {selectedHero.crew.length === 0 ? (
                <p className="empty-army">No units in your army</p>
              ) : (
                selectedHero.crew.map((unit) => (
                  <div key={unit.id} className="army-unit">
                    <span className="unit-icon">{getUnitIcon(unit.type)}</span>
                    <span className="unit-name">{unit.name}</span>
                    <span className="unit-count">×{unit.count}</span>
                    <div className="unit-stats-inline">
                      <span>❤️ {unit.stats.hp}</span>
                      <span>⚔️ {unit.stats.attack}</span>
                      <span>🛡️ {unit.stats.defense}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Buildings placeholder */}
          <div className="buildings-section">
            <h3>Buildings</h3>
            <div className="buildings-list">
              <div className="building-item">
                <span className="building-icon">🏠</span>
                <span className="building-name">Town Hall</span>
                <span className="building-level">Level 1</span>
              </div>
              <div className="building-item">
                <span className="building-icon">⚔️</span>
                <span className="building-name">Barracks</span>
                <span className="building-level">Level 1</span>
              </div>
              <div className="building-item locked">
                <span className="building-icon">🏰</span>
                <span className="building-name">Castle</span>
                <span className="building-status">Locked</span>
              </div>
            </div>
          </div>
          
          {/* Leave button */}
          <div className="town-actions">
            <button className="leave-button" onClick={leaveTown}>
              Leave Town
            </button>
          </div>
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
