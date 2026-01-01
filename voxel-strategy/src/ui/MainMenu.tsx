// Main menu component
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import './ui.css';

export function MainMenu() {
  const initGame = useGameStore((state) => state.initGame);
  const gamePhase = useGameStore((state) => state.gamePhase);
  
  const [seed, setSeed] = useState('');
  const [mapSize, setMapSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  
  if (gamePhase !== 'menu') {
    return null;
  }
  
  const handleStartGame = () => {
    const sizes = {
      small: { width: 32, height: 32 },
      medium: { width: 64, height: 64 },
      large: { width: 96, height: 96 },
    };
    
    initGame({
      mapWidth: sizes[mapSize].width,
      mapHeight: sizes[mapSize].height,
      seed: seed || Date.now().toString(),
      difficulty,
    });
  };
  
  return (
    <div className="main-menu">
      <div className="menu-container">
        <h1 className="game-title">Voxel Conquest</h1>
        <p className="game-subtitle">A Turn-Based Strategy Game</p>
        
        <div className="menu-options">
          <div className="option-group">
            <label htmlFor="seed">World Seed (optional)</label>
            <input
              id="seed"
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter seed or leave empty for random"
            />
          </div>
          
          <div className="option-group">
            <label htmlFor="mapSize">Map Size</label>
            <select
              id="mapSize"
              value={mapSize}
              onChange={(e) => setMapSize(e.target.value as 'small' | 'medium' | 'large')}
            >
              <option value="small">Small (32x32)</option>
              <option value="medium">Medium (64x64)</option>
              <option value="large">Large (96x96)</option>
            </select>
          </div>
          
          <div className="option-group">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'normal' | 'hard')}
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <button className="start-button" onClick={handleStartGame}>
            Start New Game
          </button>
        </div>
        
        <div className="game-info">
          <h3>How to Play</h3>
          <ul>
            <li>Click on your hero to select them</li>
            <li>Green tiles show where you can move</li>
            <li>Visit towns to recruit units and resupply</li>
            <li>Attack enemy camps to gain resources</li>
            <li>Conquer all towns to achieve victory!</li>
          </ul>
        </div>
        
        <div className="controls-info">
          <h3>Controls</h3>
          <ul>
            <li><strong>Left Click:</strong> Select / Move</li>
            <li><strong>Right Drag:</strong> Rotate camera</li>
            <li><strong>Scroll:</strong> Zoom in/out</li>
            <li><strong>Middle Drag:</strong> Pan camera</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
