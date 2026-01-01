// Voxel-based terrain rendering
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TerrainType, Tile } from '../../core/types';

interface VoxelTerrainProps {
  tiles: Tile[][];
  visibleRange: { minX: number; maxX: number; minY: number; maxY: number };
  highlightedTiles?: { x: number; y: number }[];
}

const TERRAIN_COLORS: Record<TerrainType, string> = {
  grass: '#4a8f4a',
  water: '#4a7fbf',
  mountain: '#8b7355',
  forest: '#2d5a2d',
  desert: '#d4a84b',
  road: '#9b8b7a',
};

const TERRAIN_HEIGHTS: Record<TerrainType, number> = {
  grass: 0.3,
  water: 0.1,
  mountain: 1.5,
  forest: 0.4,
  desert: 0.25,
  road: 0.2,
};

export function VoxelTerrain({
  tiles,
  visibleRange,
  highlightedTiles = [],
}: VoxelTerrainProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const highlightRef = useRef<THREE.InstancedMesh>(null);
  
  // Create geometry for voxel blocks
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  
  // Calculate visible tiles
  const visibleTiles = useMemo(() => {
    const result: { tile: Tile; x: number; y: number }[] = [];
    
    for (let y = visibleRange.minY; y <= visibleRange.maxY; y++) {
      for (let x = visibleRange.minX; x <= visibleRange.maxX; x++) {
        if (tiles[y]?.[x]) {
          result.push({ tile: tiles[y][x], x, y });
        }
      }
    }
    
    return result;
  }, [tiles, visibleRange]);

  // Create instanced mesh data
  const { matrices, colors } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    
    for (const { tile, x, y } of visibleTiles) {
      const matrix = new THREE.Matrix4();
      const height = TERRAIN_HEIGHTS[tile.terrain] + tile.elevation * 0.5;
      
      matrix.setPosition(x, height / 2, y);
      matrix.scale(new THREE.Vector3(1, height, 1));
      
      matrices.push(matrix);
      colors.push(new THREE.Color(TERRAIN_COLORS[tile.terrain]));
    }
    
    return { matrices, colors };
  }, [visibleTiles]);

  // Update instanced mesh
  useEffect(() => {
    if (!meshRef.current) return;
    
    const mesh = meshRef.current;
    
    matrices.forEach((matrix, i) => {
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, colors[i]);
    });
    
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [matrices, colors]);

  // Highlight tiles
  const highlightMatrices = useMemo(() => {
    return highlightedTiles.map(({ x, y }) => {
      const tile = tiles[y]?.[x];
      if (!tile) return null;
      
      const matrix = new THREE.Matrix4();
      const height = TERRAIN_HEIGHTS[tile.terrain] + tile.elevation * 0.5;
      
      matrix.setPosition(x, height + 0.1, y);
      matrix.scale(new THREE.Vector3(1.05, 0.1, 1.05));
      
      return matrix;
    }).filter(Boolean) as THREE.Matrix4[];
  }, [highlightedTiles, tiles]);

  // Animate highlights
  useFrame(({ clock }) => {
    if (highlightRef.current && highlightMatrices.length > 0) {
      const pulse = 0.5 + Math.sin(clock.elapsedTime * 4) * 0.5;
      
      highlightMatrices.forEach((matrix, i) => {
        highlightRef.current!.setMatrixAt(i, matrix);
        highlightRef.current!.setColorAt(
          i,
          new THREE.Color(0.3, 0.8, 0.3).multiplyScalar(pulse)
        );
      });
      
      highlightRef.current.instanceMatrix.needsUpdate = true;
      if (highlightRef.current.instanceColor) {
        highlightRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      {/* Main terrain */}
      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined, visibleTiles.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial vertexColors />
      </instancedMesh>
      
      {/* Highlighted tiles */}
      {highlightMatrices.length > 0 && (
        <instancedMesh
          ref={highlightRef}
          args={[geometry, undefined, highlightMatrices.length]}
        >
          <meshBasicMaterial transparent opacity={0.6} />
        </instancedMesh>
      )}
      
      {/* Water plane */}
      <mesh position={[tiles[0]?.length / 2 || 0, 0.15, tiles.length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[tiles[0]?.length || 64, tiles.length || 64]} />
        <meshStandardMaterial
          color="#4a7fbf"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Simple deterministic hash for consistent tree placement
function seededRandom(x: number, y: number, i: number): number {
  const hash = Math.sin(x * 12.9898 + y * 78.233 + i * 37.719) * 43758.5453;
  return hash - Math.floor(hash);
}

// Decoration generation for forests and other terrain features
export function TerrainDecorations({
  tiles,
  visibleRange,
}: {
  tiles: Tile[][];
  visibleRange: { minX: number; maxX: number; minY: number; maxY: number };
}) {

  // Calculate forest positions
  const forestPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    
    for (let y = visibleRange.minY; y <= visibleRange.maxY; y++) {
      for (let x = visibleRange.minX; x <= visibleRange.maxX; x++) {
        const tile = tiles[y]?.[x];
        if (tile?.terrain === 'forest') {
          // Multiple trees per tile (deterministic based on position)
          const treeCount = 2 + Math.floor(seededRandom(x, y, 0) * 2);
          for (let i = 0; i < treeCount; i++) {
            const offsetX = (seededRandom(x, y, i * 2 + 1) - 0.5) * 0.8;
            const offsetZ = (seededRandom(x, y, i * 2 + 2) - 0.5) * 0.8;
            const height = TERRAIN_HEIGHTS.forest + tile.elevation * 0.5;
            positions.push(new THREE.Vector3(x + offsetX, height, y + offsetZ));
          }
        }
      }
    }
    
    return positions;
  }, [tiles, visibleRange]);

  return (
    <group>
      {forestPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Trunk */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.15, 0.5, 0.15]} />
            <meshStandardMaterial color="#5d4037" />
          </mesh>
          {/* Foliage layers */}
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[0.5, 0.35, 0.5]} />
            <meshStandardMaterial color="#2e7d32" />
          </mesh>
          <mesh position={[0, 1.0, 0]} castShadow>
            <boxGeometry args={[0.35, 0.25, 0.35]} />
            <meshStandardMaterial color="#388e3c" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Mountain peaks decoration
export function MountainDecorations({
  tiles,
  visibleRange,
}: {
  tiles: Tile[][];
  visibleRange: { minX: number; maxX: number; minY: number; maxY: number };
}) {
  const mountainPositions = useMemo(() => {
    const positions: { pos: THREE.Vector3; scale: number }[] = [];
    
    for (let y = visibleRange.minY; y <= visibleRange.maxY; y++) {
      for (let x = visibleRange.minX; x <= visibleRange.maxX; x++) {
        const tile = tiles[y]?.[x];
        if (tile?.terrain === 'mountain') {
          const height = TERRAIN_HEIGHTS.mountain + tile.elevation * 0.5;
          const scale = 0.5 + tile.elevation * 0.5;
          positions.push({
            pos: new THREE.Vector3(x, height, y),
            scale,
          });
        }
      }
    }
    
    return positions;
  }, [tiles, visibleRange]);

  return (
    <group>
      {mountainPositions.map((item, i) => (
        <group key={i} position={item.pos}>
          {/* Snow cap */}
          <mesh position={[0, item.scale * 0.5, 0]} castShadow>
            <boxGeometry args={[0.4 * item.scale, 0.3 * item.scale, 0.4 * item.scale]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Peak */}
          <mesh position={[0, item.scale * 0.2, 0]} castShadow>
            <boxGeometry args={[0.6 * item.scale, 0.4 * item.scale, 0.6 * item.scale]} />
            <meshStandardMaterial color="#9e9e9e" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
