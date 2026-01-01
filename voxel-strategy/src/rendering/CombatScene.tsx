// 3D Combat scene
import { Suspense, useMemo, useCallback, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import type { CombatUnit, Position } from '../core/types';

// Combat grid cell
function GridCell({
  position,
  isHighlighted,
  isSelected,
  onClick,
}: {
  position: Position;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current && isHighlighted) {
      const pulse = 0.5 + Math.sin(clock.elapsedTime * 4) * 0.3;
      (meshRef.current.material as THREE.MeshStandardMaterial).opacity = pulse;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position.x - 3.5, 0.01, position.y - 2.5]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <planeGeometry args={[0.95, 0.95]} />
      <meshStandardMaterial
        color={isSelected ? '#ffeb3b' : isHighlighted ? '#4caf50' : '#78909c'}
        transparent
        opacity={isSelected ? 0.8 : isHighlighted ? 0.6 : 0.3}
      />
    </mesh>
  );
}

// Combat unit visualization
function CombatUnitMesh({
  unit,
  isAttacker,
  isCurrentTurn,
  isSelected,
  onClick,
}: {
  unit: CombatUnit;
  isAttacker: boolean;
  isCurrentTurn: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const color = isAttacker ? '#4a90d9' : '#d94a4a';
  
  useFrame(({ clock }) => {
    if (groupRef.current && isCurrentTurn) {
      groupRef.current.position.y = 0.3 + Math.sin(clock.elapsedTime * 4) * 0.1;
    }
  });

  // Health bar
  const healthPercent = unit.stats.hp / unit.stats.maxHp;

  return (
    <group
      ref={groupRef}
      position={[
        unit.combatPosition.x - 3.5,
        0.3,
        unit.combatPosition.y - 2.5,
      ]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 16]} />
          <meshBasicMaterial color="#ffeb3b" side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Current turn indicator */}
      {isCurrentTurn && (
        <mesh position={[0, 0.8, 0]}>
          <coneGeometry args={[0.1, 0.2, 4]} />
          <meshBasicMaterial color="#ffeb3b" />
        </mesh>
      )}
      
      {/* Unit body based on type */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        <meshStandardMaterial color="#ffb74d" />
      </mesh>
      
      {/* Weapon based on unit type */}
      {unit.type === 'warrior' && (
        <mesh position={[0.3, 0.3, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
          <meshStandardMaterial color="#9e9e9e" />
        </mesh>
      )}
      {unit.type === 'archer' && (
        <mesh position={[0.25, 0.3, 0]} castShadow>
          <boxGeometry args={[0.05, 0.4, 0.02]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      )}
      {unit.type === 'mage' && (
        <mesh position={[0.25, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
          <meshStandardMaterial color="#9c27b0" />
        </mesh>
      )}
      
      {/* Stack count */}
      <Text
        position={[0, -0.15, 0.3]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {unit.count}
      </Text>
      
      {/* Health bar */}
      <group position={[0, 0.75, 0]}>
        <mesh>
          <planeGeometry args={[0.4, 0.08]} />
          <meshBasicMaterial color="#424242" />
        </mesh>
        <mesh position={[(healthPercent - 1) * 0.2, 0, 0.01]}>
          <planeGeometry args={[0.38 * healthPercent, 0.06]} />
          <meshBasicMaterial color={healthPercent > 0.5 ? '#4caf50' : healthPercent > 0.25 ? '#ff9800' : '#f44336'} />
        </mesh>
      </group>
      
      {/* Defending indicator */}
      {unit.isDefending && (
        <mesh position={[0, 0.3, 0.25]}>
          <boxGeometry args={[0.3, 0.35, 0.05]} />
          <meshStandardMaterial color="#795548" />
        </mesh>
      )}
    </group>
  );
}

// Combat grid
function CombatGrid({
  gridWidth,
  gridHeight,
  highlightedCells,
  selectedCell,
  onCellClick,
}: {
  gridWidth: number;
  gridHeight: number;
  highlightedCells: Position[];
  selectedCell?: Position;
  onCellClick: (pos: Position) => void;
}) {
  const cells = useMemo(() => {
    const result: Position[] = [];
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        result.push({ x, y });
      }
    }
    return result;
  }, [gridWidth, gridHeight]);

  return (
    <group>
      {/* Grid floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[gridWidth, gridHeight]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      
      {/* Grid lines */}
      {cells.map((pos) => (
        <GridCell
          key={`${pos.x}-${pos.y}`}
          position={pos}
          isHighlighted={highlightedCells.some(
            (h) => h.x === pos.x && h.y === pos.y
          )}
          isSelected={selectedCell?.x === pos.x && selectedCell?.y === pos.y}
          onClick={() => onCellClick(pos)}
        />
      ))}
    </group>
  );
}

// Combat scene content
function CombatContent() {
  const combatState = useGameStore((state) => state.combatState);
  const executeCombatAction = useGameStore((state) => state.executeCombatAction);
  
  const [selectedUnit, setSelectedUnit] = useState<CombatUnit | null>(null);
  const [targetMode, setTargetMode] = useState<'move' | 'attack' | null>(null);
  
  if (!combatState) return null;
  
  const { attackerUnits, defenderUnits, turnOrder, currentUnitIndex, gridWidth, gridHeight } = combatState;
  const currentUnit = turnOrder[currentUnitIndex];
  const isCurrentUnitAttacker = attackerUnits.includes(currentUnit);
  
  // Calculate valid move/attack positions
  const validMovePositions = useMemo(() => {
    if (!selectedUnit || targetMode !== 'move') return [];
    
    const positions: Position[] = [];
    const range = selectedUnit.stats.speed;
    
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= range) {
          const newX = selectedUnit.combatPosition.x + dx;
          const newY = selectedUnit.combatPosition.y + dy;
          
          if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
            // Check if cell is occupied
            const occupied = [...attackerUnits, ...defenderUnits].some(
              (u) => u.combatPosition.x === newX && u.combatPosition.y === newY
            );
            if (!occupied) {
              positions.push({ x: newX, y: newY });
            }
          }
        }
      }
    }
    
    return positions;
  }, [selectedUnit, targetMode, attackerUnits, defenderUnits, gridWidth, gridHeight]);
  
  // Calculate valid attack targets
  const validAttackTargets = useMemo(() => {
    if (!selectedUnit || targetMode !== 'attack') return [];
    
    const enemies = isCurrentUnitAttacker ? defenderUnits : attackerUnits;
    const range = selectedUnit.stats.range;
    
    return enemies.filter((enemy) => {
      const dx = Math.abs(enemy.combatPosition.x - selectedUnit.combatPosition.x);
      const dy = Math.abs(enemy.combatPosition.y - selectedUnit.combatPosition.y);
      return dx + dy <= range;
    });
  }, [selectedUnit, targetMode, isCurrentUnitAttacker, attackerUnits, defenderUnits]);
  
  const handleCellClick = useCallback(
    (pos: Position) => {
      if (selectedUnit && targetMode === 'move') {
        const isValid = validMovePositions.some(
          (p) => p.x === pos.x && p.y === pos.y
        );
        if (isValid) {
          executeCombatAction({
            type: 'move',
            sourceUnit: selectedUnit.id,
            targetPosition: pos,
          });
          setSelectedUnit(null);
          setTargetMode(null);
        }
      }
    },
    [selectedUnit, targetMode, validMovePositions, executeCombatAction]
  );
  
  const handleUnitClick = useCallback(
    (unit: CombatUnit) => {
      if (targetMode === 'attack' && selectedUnit) {
        const isValidTarget = validAttackTargets.some((t) => t.id === unit.id);
        if (isValidTarget) {
          executeCombatAction({
            type: 'attack',
            sourceUnit: selectedUnit.id,
            targetUnit: unit.id,
          });
          setSelectedUnit(null);
          setTargetMode(null);
          return;
        }
      }
      
      // Select unit if it's the current turn unit
      if (unit.id === currentUnit?.id && !unit.hasActed) {
        setSelectedUnit(unit);
        setTargetMode(null);
      }
    },
    [targetMode, selectedUnit, validAttackTargets, currentUnit, executeCombatAction]
  );

  return (
    <>
      {/* Combat grid */}
      <CombatGrid
        gridWidth={gridWidth}
        gridHeight={gridHeight}
        highlightedCells={validMovePositions}
        selectedCell={selectedUnit?.combatPosition}
        onCellClick={handleCellClick}
      />
      
      {/* Attacker units */}
      {attackerUnits.map((unit) => (
        <CombatUnitMesh
          key={unit.id}
          unit={unit}
          isAttacker={true}
          isCurrentTurn={unit.id === currentUnit?.id}
          isSelected={selectedUnit?.id === unit.id}
          onClick={() => handleUnitClick(unit)}
        />
      ))}
      
      {/* Defender units */}
      {defenderUnits.map((unit) => (
        <CombatUnitMesh
          key={unit.id}
          unit={unit}
          isAttacker={false}
          isCurrentTurn={unit.id === currentUnit?.id}
          isSelected={selectedUnit?.id === unit.id}
          onClick={() => handleUnitClick(unit)}
        />
      ))}
      
      {/* Battlefield decorations */}
      <group position={[-5, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.3, 1, 0.3]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.8, 0.1, 0.1]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      </group>
      
      <group position={[5, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.3, 1, 0.3]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.8, 0.1, 0.1]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      </group>
    </>
  );
}

// Combat scene component
export function CombatScene() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  
  if (gamePhase !== 'combat') {
    return null;
  }
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        shadows
        camera={{ position: [0, 10, 12], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          
          {/* Background */}
          <color attach="background" args={['#1a1a2e']} />
          
          {/* Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={8}
            maxDistance={25}
          />
          
          {/* Combat content */}
          <CombatContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
