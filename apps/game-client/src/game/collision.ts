import * as THREE from "three";
import { terrainAssets } from "@riw/assets";
import { isOnWestPath, WEST_BLOCKOUT_COLLIDERS } from "../world/westBlockout";

type Point2 = {
  x: number;
  z: number;
};

type TerrainCollisionData = {
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  gridX: number;
  gridZ: number;
  outline: Point2[];
  heights: Array<number | null>;
};

type ChunkHeightfieldData = {
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  gridX: number;
  gridZ: number;
  heights: Array<number | null>;
};

type ChunkManifestData = {
  source?: string;
  kind?: string;
  chunks?: Array<{ heightfield?: string }>;
};

type CircleCollider = {
  kind: "circle";
  x: number;
  z: number;
  radius: number;
};

const playerRadius = 0.22;
const westPlayableMinHeight = 0.12;
const westPlayableHalfWidth = 5.5;
const defaultBounds = {
  minX: -77.5,
  maxX: 77.5,
  minZ: -69.4,
  maxZ: 69.4
};

export class WorldCollision {
  private terrain: TerrainCollisionData | null = null;
  private chunkTerrains: ChunkHeightfieldData[] = [];
  // Barrieres de blockout (limites de zone) + colliders props injectes au runtime
  // par le generateur de vegetation (render/westVegetation.ts).
  private readonly solids: CircleCollider[] = [...WEST_BLOCKOUT_COLLIDERS];

  constructor() {
    void this.loadTerrain();
  }

  // Ingere les colliders de props generes (vegetation ouest) une fois poses au sol.
  addColliders(colliders: readonly CircleCollider[]): void {
    this.solids.push(...colliders);
  }

  resolveMove(previous: THREE.Vector3, proposed: THREE.Vector3): THREE.Vector3 {
    const resolved = proposed.clone();

    if (!this.isWalkable(resolved.x, resolved.z)) {
      const xOnly = new THREE.Vector3(proposed.x, previous.y, previous.z);
      const zOnly = new THREE.Vector3(previous.x, previous.y, proposed.z);

      if (this.isWalkable(xOnly.x, xOnly.z)) {
        resolved.copy(xOnly);
      } else if (this.isWalkable(zOnly.x, zOnly.z)) {
        resolved.copy(zOnly);
      } else {
        resolved.copy(previous);
      }
    }

    this.resolveSolidCollisions(resolved);
    if (!this.isWalkable(resolved.x, resolved.z)) {
      resolved.copy(previous);
    }

    resolved.y = this.getGroundHeight(resolved.x, resolved.z);
    return resolved;
  }

  snapToGround(position: THREE.Vector3): void {
    position.y = this.getGroundHeight(position.x, position.z);
  }

  private async loadTerrain(): Promise<void> {
    try {
      const response = await fetch(terrainAssets.laReunion.reliefCollision);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this.terrain = (await response.json()) as TerrainCollisionData;
    } catch (error) {
      console.warn("Terrain collision load failed", error);
    }

    try {
      this.chunkTerrains = await loadChunkHeightfields();
    } catch (error) {
      console.warn("Terrain chunk collision load failed", error);
    }
  }

  private isWalkable(x: number, z: number): boolean {
    const terrain = this.terrain;
    if (!terrain) {
      return isInsideBounds(x, z, defaultBounds);
    }

    return isInsideBounds(x, z, terrain.bounds) && pointInPolygon(x, z, terrain.outline);
  }

  private getGroundHeight(x: number, z: number): number {
    const chunkHeight = this.getChunkGroundHeight(x, z);
    if (chunkHeight !== null) {
      return chunkHeight;
    }

    const terrain = this.terrain;
    if (!terrain) {
      return 0;
    }

    const height = sampleHeight(terrain, x, z) ?? 0;
    return isOnWestPath(x, z, westPlayableHalfWidth) ? Math.max(height, westPlayableMinHeight) : height;
  }

  private getChunkGroundHeight(x: number, z: number): number | null {
    for (const chunk of this.chunkTerrains) {
      if (!isInsideBounds(x, z, chunk.bounds)) {
        continue;
      }
      const height = sampleHeight(chunk, x, z);
      if (height !== null) {
        return height;
      }
    }
    return null;
  }

  private resolveSolidCollisions(position: THREE.Vector3): void {
    for (let pass = 0; pass < 4; pass += 1) {
      for (const solid of this.solids) {
        resolveCircle(position, solid);
      }
    }
  }
}

function resolveCircle(position: THREE.Vector3, solid: CircleCollider): void {
  const dx = position.x - solid.x;
  const dz = position.z - solid.z;
  const minDistance = playerRadius + solid.radius;
  const distance = Math.hypot(dx, dz);
  if (distance >= minDistance) {
    return;
  }

  const nx = distance > 0.0001 ? dx / distance : 1;
  const nz = distance > 0.0001 ? dz / distance : 0;
  position.x = solid.x + nx * minDistance;
  position.z = solid.z + nz * minDistance;
}

function isInsideBounds(
  x: number,
  z: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
): boolean {
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
}

function pointInPolygon(x: number, z: number, polygon: Point2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if (!a || !b) {
      continue;
    }

    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

async function loadChunkHeightfields(): Promise<ChunkHeightfieldData[]> {
  const response = await fetch(terrainAssets.laReunion.chunkManifest);
  if (!response.ok) {
    return [];
  }
  const manifest = (await response.json()) as ChunkManifestData;
  if (manifest.source !== "IGN RGE ALTI D974" || manifest.kind !== "terrain-stream-manifest") {
    return [];
  }

  const entries = manifest.chunks ?? [];
  const chunks = await Promise.all(
    entries.map(async (entry) => {
      if (!entry.heightfield) {
        return null;
      }
      const chunkResponse = await fetch(entry.heightfield);
      if (!chunkResponse.ok) {
        return null;
      }
      return (await chunkResponse.json()) as ChunkHeightfieldData;
    })
  );
  return chunks.filter((chunk): chunk is ChunkHeightfieldData => chunk !== null);
}

function sampleHeight(
  terrain: Pick<ChunkHeightfieldData, "bounds" | "gridX" | "gridZ" | "heights">,
  x: number,
  z: number
): number | null {
  const { bounds, gridX, gridZ, heights } = terrain;
  const tx = THREE.MathUtils.clamp((x - bounds.minX) / (bounds.maxX - bounds.minX), 0, 1);
  const tz = THREE.MathUtils.clamp((z - bounds.minZ) / (bounds.maxZ - bounds.minZ), 0, 1);
  const gx = tx * (gridX - 1);
  const gz = tz * (gridZ - 1);
  const x0 = Math.floor(gx);
  const z0 = Math.floor(gz);
  const x1 = Math.min(gridX - 1, x0 + 1);
  const z1 = Math.min(gridZ - 1, z0 + 1);
  const fx = gx - x0;
  const fz = gz - z0;

  const h00 = finiteHeightAt(heights, z0 * gridX + x0);
  const h10 = finiteHeightAt(heights, z0 * gridX + x1);
  const h01 = finiteHeightAt(heights, z1 * gridX + x0);
  const h11 = finiteHeightAt(heights, z1 * gridX + x1);
  if (h00 === null || h10 === null || h01 === null || h11 === null) {
    return null;
  }

  const hx0 = THREE.MathUtils.lerp(h00, h10, fx);
  const hx1 = THREE.MathUtils.lerp(h01, h11, fx);
  return THREE.MathUtils.lerp(hx0, hx1, fz);
}

function finiteHeightAt(heights: ReadonlyArray<number | null>, index: number): number | null {
  const height = heights[index];
  return typeof height === "number" && Number.isFinite(height) ? height : null;
}
