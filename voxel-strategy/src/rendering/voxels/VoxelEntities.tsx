// Voxel entities: Heroes, units, POIs
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Hero, PointOfInterest, ResourceNode, FactionId } from '../../core/types';

const FACTION_COLORS: Record<FactionId, string> = {
  player: '#4a90d9',
  enemy_1: '#d94a4a',
  enemy_2: '#9b59b6',
  neutral: '#95a5a6',
};

interface VoxelHeroProps {
  hero: Hero;
  isSelected: boolean;
  onClick?: () => void;
}

export function VoxelHero({ hero, isSelected, onClick }: VoxelHeroProps) {
  const groupRef = useRef<THREE.Group>(null);
  const selectionRingRef = useRef<THREE.Mesh>(null);
  
  // Animate the hero
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Gentle bobbing animation
      groupRef.current.position.y = 0.3 + Math.sin(clock.elapsedTime * 2) * 0.05;
    }
    
    if (selectionRingRef.current && isSelected) {
      selectionRingRef.current.rotation.y = clock.elapsedTime;
    }
  });

  const color = FACTION_COLORS[hero.factionId];

  return (
    <group
      ref={groupRef}
      position={[hero.position.x, 0.3, hero.position.y]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Selection ring */}
      {isSelected && (
        <mesh ref={selectionRingRef} position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 16]} />
          <meshBasicMaterial color="#ffeb3b" side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#ffb74d" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.08, 0.68, 0.14]}>
        <boxGeometry args={[0.06, 0.06, 0.04]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.08, 0.68, 0.14]}>
        <boxGeometry args={[0.06, 0.06, 0.04]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Arms */}
      <mesh position={[0.28, 0.25, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, 0.15]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.28, 0.25, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, 0.15]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[0.1, -0.15, 0]} castShadow>
        <boxGeometry args={[0.15, 0.3, 0.15]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[-0.1, -0.15, 0]} castShadow>
        <boxGeometry args={[0.15, 0.3, 0.15]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      
      {/* Cape */}
      <mesh position={[0, 0.25, -0.2]} castShadow>
        <boxGeometry args={[0.35, 0.6, 0.05]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7)} />
      </mesh>
      
      {/* Hero level indicator */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
    </group>
  );
}

interface VoxelTownProps {
  town: PointOfInterest;
  onClick?: () => void;
}

export function VoxelTown({ town, onClick }: VoxelTownProps) {
  const groupRef = useRef<THREE.Group>(null);
  const color = FACTION_COLORS[town.factionId];

  return (
    <group
      ref={groupRef}
      position={[town.position.x, 0.3, town.position.y]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Main building */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.7, 0.8, 0.7]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.8, 0.2, 0.8]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      
      {/* Tower */}
      <mesh position={[0.3, 0.7, 0.3]} castShadow>
        <boxGeometry args={[0.25, 1.0, 0.25]} />
        <meshStandardMaterial color="#9e9e9e" />
      </mesh>
      <mesh position={[0.3, 1.25, 0.3]} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshStandardMaterial color="#757575" />
      </mesh>
      
      {/* Flag */}
      <mesh position={[0.3, 1.5, 0.35]}>
        <boxGeometry args={[0.02, 0.4, 0.02]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0.3, 1.6, 0.45]}>
        <boxGeometry args={[0.02, 0.15, 0.15]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Door */}
      <mesh position={[0, 0.2, 0.36]}>
        <boxGeometry args={[0.2, 0.35, 0.02]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      
      {/* Windows */}
      <mesh position={[0.2, 0.5, 0.36]}>
        <boxGeometry args={[0.12, 0.12, 0.02]} />
        <meshStandardMaterial color="#ffeb3b" emissive="#ffeb3b" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.2, 0.5, 0.36]}>
        <boxGeometry args={[0.12, 0.12, 0.02]} />
        <meshStandardMaterial color="#ffeb3b" emissive="#ffeb3b" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

interface VoxelEnemyCampProps {
  camp: PointOfInterest;
  onClick?: () => void;
}

export function VoxelEnemyCamp({ camp, onClick }: VoxelEnemyCampProps) {
  const fireRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (fireRef.current) {
      fireRef.current.scale.y = 1 + Math.sin(clock.elapsedTime * 10) * 0.2;
    }
  });

  return (
    <group
      position={[camp.position.x, 0.3, camp.position.y]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Tent 1 */}
      <mesh position={[-0.2, 0.25, 0]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.5]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh position={[-0.2, 0.55, 0]} castShadow rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.35, 0.35, 0.55]} />
        <meshStandardMaterial color="#a0522d" />
      </mesh>
      
      {/* Tent 2 */}
      <mesh position={[0.25, 0.2, 0.2]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.4]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      {/* Campfire */}
      <group position={[0, 0, -0.2]}>
        {/* Logs */}
        <mesh position={[0, 0.05, 0]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.3, 0.08, 0.08]} />
          <meshStandardMaterial color="#5d4037" />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[0, -Math.PI / 4, 0]}>
          <boxGeometry args={[0.3, 0.08, 0.08]} />
          <meshStandardMaterial color="#5d4037" />
        </mesh>
        
        {/* Fire */}
        <mesh ref={fireRef} position={[0, 0.2, 0]}>
          <boxGeometry args={[0.15, 0.25, 0.15]} />
          <meshStandardMaterial
            color="#ff5722"
            emissive="#ff5722"
            emissiveIntensity={0.8}
          />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.08, 0.15, 0.08]} />
          <meshStandardMaterial
            color="#ffeb3b"
            emissive="#ffeb3b"
            emissiveIntensity={1}
          />
        </mesh>
      </group>
      
      {/* Skull decoration */}
      <mesh position={[0.4, 0.15, -0.3]}>
        <boxGeometry args={[0.12, 0.12, 0.1]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </group>
  );
}

interface VoxelResourceNodeProps {
  node: ResourceNode;
  onClick?: () => void;
}

export function VoxelResourceNode({ node, onClick }: VoxelResourceNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.5;
    }
  });

  const getResourceVisual = () => {
    switch (node.resourceType) {
      case 'gold':
        return {
          color: '#ffd700',
          emissive: '#ffd700',
          shape: 'octahedron' as const,
        };
      case 'wood':
        return {
          color: '#8b4513',
          emissive: '#000000',
          shape: 'box' as const,
        };
      case 'stone':
        return {
          color: '#757575',
          emissive: '#000000',
          shape: 'box' as const,
        };
      case 'crystals':
        return {
          color: '#9c27b0',
          emissive: '#9c27b0',
          shape: 'octahedron' as const,
        };
    }
  };

  const visual = getResourceVisual();

  return (
    <group
      position={[node.position.x, 0.5, node.position.y]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Base */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.1, 8]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      
      {/* Resource visual */}
      <mesh ref={meshRef} position={[0, 0.2, 0]} castShadow>
        {visual.shape === 'octahedron' ? (
          <octahedronGeometry args={[0.25]} />
        ) : (
          <boxGeometry args={[0.3, 0.3, 0.3]} />
        )}
        <meshStandardMaterial
          color={visual.color}
          emissive={visual.emissive}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Ownership indicator */}
      {node.isOwned && (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial
            color={node.ownedBy ? FACTION_COLORS[node.ownedBy] : '#ffffff'}
          />
        </mesh>
      )}
    </group>
  );
}

interface VoxelNeutralEncounterProps {
  poi: PointOfInterest;
  onClick?: () => void;
}

export function VoxelNeutralEncounter({ poi, onClick }: VoxelNeutralEncounterProps) {
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.1);
    }
  });

  return (
    <group
      position={[poi.position.x, 0.3, poi.position.y]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Stone pillar */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.25, 0.6, 0.25]} />
        <meshStandardMaterial color="#78909c" />
      </mesh>
      
      {/* Top decoration */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.35, 0.1, 0.35]} />
        <meshStandardMaterial color="#607d8b" />
      </mesh>
      
      {/* Glowing orb */}
      <mesh ref={glowRef} position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color="#00bcd4"
          emissive="#00bcd4"
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* Question mark particles */}
      {!poi.isDiscovered && (
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.08, 0.2, 0.08]} />
          <meshBasicMaterial color="#ffeb3b" />
        </mesh>
      )}
    </group>
  );
}
