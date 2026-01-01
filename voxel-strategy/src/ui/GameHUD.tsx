// Game HUD component
import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import './ui.css';

export function GameHUD() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const turn = useGameStore((state) => state.turn);
  const currentFaction = useGameStore((state) => state.currentFaction);
  const factions = useGameStore((state) => state.factions);
  const selectedHeroId = useGameStore((state) => state.selectedHeroId);
  const getHero = useGameStore((state) => state.getHero);
  const endTurn = useGameStore((state) => state.endTurn);
  
  const playerFaction = useMemo(
    () => factions.find((f) => f.id === 'player'),
    [factions]
  );
  
  const selectedHero = useMemo(
    () => (selectedHeroId ? getHero(selectedHeroId) : undefined),
    [selectedHeroId, getHero]
  );
  
  if (gamePhase !== 'world_map') {
    return null;
  }
  
  return (
    <div className="game-hud">
      {/* Top bar with resources and turn info */}
      <div className="hud-top-bar">
        <div className="resources-panel">
          <div className="resource">
            <span className="resource-icon gold">💰</span>
            <span className="resource-value">{playerFaction?.resources.gold || 0}</span>
          </div>
          <div className="resource">
            <span className="resource-icon wood">🪵</span>
            <span className="resource-value">{playerFaction?.resources.wood || 0}</span>
          </div>
          <div className="resource">
            <span className="resource-icon stone">🪨</span>
            <span className="resource-value">{playerFaction?.resources.stone || 0}</span>
          </div>
          <div className="resource">
            <span className="resource-icon crystals">💎</span>
            <span className="resource-value">{playerFaction?.resources.crystals || 0}</span>
          </div>
        </div>
        
        <div className="turn-info">
          <span className="turn-label">Turn {turn}</span>
          <span className={`faction-indicator ${currentFaction}`}>
            {currentFaction === 'player' ? 'Your Turn' : 'Enemy Turn'}
          </span>
        </div>
        
        <div className="action-buttons">
          <button
            className="end-turn-button"
            onClick={endTurn}
            disabled={currentFaction !== 'player'}
          >
            End Turn
          </button>
        </div>
      </div>
      
      {/* Hero panel */}
      {selectedHero && (
        <div className="hero-panel">
          <div className="hero-header">
            <h3>{selectedHero.name}</h3>
            <span className="hero-level">Level {selectedHero.level}</span>
          </div>
          
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-label">Movement</span>
              <span className="stat-value">
                {selectedHero.movementPoints} / {selectedHero.maxMovementPoints}
              </span>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill movement"
                  style={{
                    width: `${(selectedHero.movementPoints / selectedHero.maxMovementPoints) * 100}%`,
                  }}
                />
              </div>
            </div>
            
            <div className="stat">
              <span className="stat-label">Experience</span>
              <span className="stat-value">
                {selectedHero.experience} / {selectedHero.experienceToNext}
              </span>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill experience"
                  style={{
                    width: `${(selectedHero.experience / selectedHero.experienceToNext) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="hero-bonuses">
            <span className="bonus">⚔️ +{selectedHero.bonuses.attackBonus}</span>
            <span className="bonus">🛡️ +{selectedHero.bonuses.defenseBonus}</span>
          </div>
          
          <div className="crew-list">
            <h4>Army</h4>
            {selectedHero.crew.map((unit) => (
              <div key={unit.id} className="crew-unit">
                <span className="unit-icon">{getUnitIcon(unit.type)}</span>
                <span className="unit-name">{unit.name}</span>
                <span className="unit-count">×{unit.count}</span>
                <div className="unit-stats-mini">
                  <span title="HP">❤️ {unit.stats.hp}</span>
                  <span title="Attack">⚔️ {unit.stats.attack}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Mini-map placeholder */}
      <div className="minimap">
        <div className="minimap-content">
          <span className="minimap-label">Mini Map</span>
        </div>
      </div>
      
      {/* Keyboard shortcuts hint */}
      <div className="shortcuts-hint">
        <span>Space: End Turn</span>
        <span>Esc: Menu</span>
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
