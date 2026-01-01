// Main 3D game scene
import { Suspense, useMemo, useCallback, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { VoxelTerrain, TerrainDecorations, MountainDecorations } from './voxels/VoxelTerrain';
import {
  VoxelHero,
  VoxelTown,
  VoxelEnemyCamp,
  VoxelResourceNode,
  VoxelNeutralEncounter,
} from './voxels/VoxelEntities';

// Camera controller that follows selected hero
function CameraController() {
  const { camera } = useThree();
  const selectedHeroId = useGameStore((state) => state.selectedHeroId);
  const getHero = useGameStore((state) => state.getHero);
  const targetRef = useRef(new THREE.Vector3());
  
  useFrame(() => {
    if (selectedHeroId) {
      const hero = getHero(selectedHeroId);
      if (hero) {
        targetRef.current.lerp(
          new THREE.Vector3(hero.position.x, 5, hero.position.y + 10),
          0.02
        );
        camera.position.lerp(targetRef.current, 0.05);
        camera.lookAt(hero.position.x, 0, hero.position.y);
      }
    }
  });
  
  return null;
}

// Ground plane for raycasting
function GroundPlane({ width, height }: { width: number; height: number }) {
  const moveHero = useGameStore((state) => state.moveHero);
  const selectedHeroId = useGameStore((state) => state.selectedHeroId);
  const getHero = useGameStore((state) => state.getHero);
  const canMoveTo = useGameStore((state) => state.canMoveTo);
  const currentFaction = useGameStore((state) => state.currentFaction);
  
  const handleClick = useCallback(
    (event: any) => {
      event.stopPropagation();
      
      if (!selectedHeroId) return;
      
      const hero = getHero(selectedHeroId);
      if (!hero || hero.factionId !== currentFaction) return;
      
      const point = event.point;
      const tileX = Math.floor(point.x + 0.5);
      const tileY = Math.floor(point.z + 0.5);
      
      if (canMoveTo(selectedHeroId, { x: tileX, y: tileY })) {
        moveHero(selectedHeroId, { x: tileX, y: tileY });
      }
    },
    [selectedHeroId, getHero, currentFaction, canMoveTo, moveHero]
  );
  
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[width / 2, 0, height / 2]}
      onClick={handleClick}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

// World map content
function WorldMapContent() {
  const worldMap = useGameStore((state) => state.worldMap);
  const factions = useGameStore((state) => state.factions);
  const selectedHeroId = useGameStore((state) => state.selectedHeroId);
  const selectHero = useGameStore((state) => state.selectHero);
  const getMovementRange = useGameStore((state) => state.getMovementRange);
  const enterTown = useGameStore((state) => state.enterTown);
  const startCombat = useGameStore((state) => state.startCombat);
  
  // Calculate visible range based on camera (simplified to full map for now)
  const visibleRange = useMemo(
    () => ({
      minX: 0,
      maxX: worldMap.width - 1,
      minY: 0,
      maxY: worldMap.height - 1,
    }),
    [worldMap.width, worldMap.height]
  );
  
  // Get movement range for selected hero
  const movementRange = useMemo(() => {
    if (!selectedHeroId) return [];
    return getMovementRange(selectedHeroId);
  }, [selectedHeroId, getMovementRange]);
  
  // Get all heroes
  const allHeroes = useMemo(
    () => factions.flatMap((f) => f.heroes),
    [factions]
  );
  
  // Filter POIs by type
  const towns = useMemo(
    () => worldMap.pointsOfInterest.filter((poi) => poi.type === 'town'),
    [worldMap.pointsOfInterest]
  );
  
  const enemyCamps = useMemo(
    () => worldMap.pointsOfInterest.filter((poi) => poi.type === 'enemy_camp'),
    [worldMap.pointsOfInterest]
  );
  
  const neutralEncounters = useMemo(
    () => worldMap.pointsOfInterest.filter((poi) => poi.type === 'neutral_encounter'),
    [worldMap.pointsOfInterest]
  );
  
  if (worldMap.tiles.length === 0) {
    return null;
  }
  
  return (
    <>
      {/* Ground for click detection */}
      <GroundPlane width={worldMap.width} height={worldMap.height} />
      
      {/* Terrain */}
      <VoxelTerrain
        tiles={worldMap.tiles}
        visibleRange={visibleRange}
        highlightedTiles={movementRange}
      />
      
      {/* Decorations */}
      <TerrainDecorations tiles={worldMap.tiles} visibleRange={visibleRange} />
      <MountainDecorations tiles={worldMap.tiles} visibleRange={visibleRange} />
      
      {/* Towns */}
      {towns.map((town) => (
        <VoxelTown
          key={town.id}
          town={town}
          onClick={() => enterTown(town.id)}
        />
      ))}
      
      {/* Enemy camps */}
      {enemyCamps.map((camp) => (
        <VoxelEnemyCamp
          key={camp.id}
          camp={camp}
          onClick={() => {
            if (selectedHeroId && camp.garrison?.length) {
              startCombat(selectedHeroId, camp);
            }
          }}
        />
      ))}
      
      {/* Resource nodes */}
      {worldMap.resourceNodes.map((node) => (
        <VoxelResourceNode key={node.id} node={node} />
      ))}
      
      {/* Neutral encounters */}
      {neutralEncounters.map((poi) => (
        <VoxelNeutralEncounter key={poi.id} poi={poi} />
      ))}
      
      {/* Heroes */}
      {allHeroes.map((hero) => (
        <VoxelHero
          key={hero.id}
          hero={hero}
          isSelected={hero.id === selectedHeroId}
          onClick={() => selectHero(hero.id)}
        />
      ))}
    </>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" />
    </mesh>
  );
}

// Main game scene component
export function GameScene() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  
  if (gamePhase === 'menu') {
    return null;
  }
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        shadows
        camera={{ position: [30, 30, 30], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[50, 50, 25]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={200}
            shadow-camera-left={-100}
            shadow-camera-right={100}
            shadow-camera-top={100}
            shadow-camera-bottom={-100}
          />
          
          {/* Sky */}
          <Sky
            distance={450000}
            sunPosition={[100, 50, 100]}
            inclination={0.5}
            azimuth={0.25}
          />
          
          {/* Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.5}
            minDistance={10}
            maxDistance={100}
          />
          
          {/* Camera follow */}
          <CameraController />
          
          {/* World content */}
          <WorldMapContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
