// Main App component
import { useEffect, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { GameScene } from './rendering/GameScene';
import { CombatScene } from './rendering/CombatScene';
import { MainMenu } from './ui/MainMenu';
import { GameHUD } from './ui/GameHUD';
import { CombatHUD } from './ui/CombatHUD';
import { TownInterface } from './ui/TownInterface';
import './App.css';

function App() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const endTurn = useGameStore((state) => state.endTurn);
  const currentFaction = useGameStore((state) => state.currentFaction);
  
  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (gamePhase === 'world_map' && currentFaction === 'player') {
        if (event.code === 'Space') {
          event.preventDefault();
          endTurn();
        }
      }
    },
    [gamePhase, currentFaction, endTurn]
  );
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return (
    <div className="app">
      {/* 3D Scenes */}
      <GameScene />
      <CombatScene />
      
      {/* UI Overlays */}
      <MainMenu />
      <GameHUD />
      <CombatHUD />
      <TownInterface />
    </div>
  );
}

export default App;
