import * as THREE from "three";
import { terrainAssets } from "@riw/assets";
import { isOnWestPath, WEST_BLOCKOUT_COLLIDERS, WEST_BLOCKOUT_WALKABLE_SURFACES } from "../world/westBlockout";

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
  climbableTopY?: number;
  stepUp?: number;
};

export type WalkableSurface = {
  kind: "rect";
  id?: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  yaw?: number;
  topY: number;
  blocksSides?: boolean;
  stepUp?: number;
};

type MoveResolveOptions = {
  airborne?: boolean;
  currentY?: number;
};

const playerRadius = 0.22;
const westPlayableMinHeight = 0.12;
const westPlayableHalfWidth = 5.5;
const maxGroundStepUp = 0.58;
const maxGroundStepDown = 1.15;
const airborneGroundClearance = 0.12;
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
  private readonly walkableSurfaces: WalkableSurface[] = [...WEST_BLOCKOUT_WALKABLE_SURFACES];

  constructor() {
    void this.loadTerrain();
  }

  // Ingere les colliders de props generes (vegetation ouest) une fois poses au sol.
  addColliders(colliders: readonly CircleCollider[]): void {
    this.solids.push(...colliders);
  }

  // Surfaces portees par des meshes visuels : pontons, plateformes blockout.
  addWalkableSurfaces(surfaces: readonly WalkableSurface[]): void {
    this.walkableSurfaces.push(...surfaces);
  }

  resolveMove(previous: THREE.Vector3, proposed: THREE.Vector3, options: MoveResolveOptions = {}): THREE.Vector3 {
    const resolved = proposed.clone();

    if (!this.canOccupyTerrain(previous, resolved, options)) {
      const xOnly = new THREE.Vector3(proposed.x, previous.y, previous.z);
      const zOnly = new THREE.Vector3(previous.x, previous.y, proposed.z);

      if (this.canOccupyTerrain(previous, xOnly, options)) {
        resolved.copy(xOnly);
      } else if (this.canOccupyTerrain(previous, zOnly, options)) {
        resolved.copy(zOnly);
      } else {
        resolved.copy(previous);
      }
    }

    this.resolveSolidCollisions(previous, resolved, options);
    if (!this.canOccupyTerrain(previous, resolved, options)) {
      resolved.copy(previous);
    }

    if (!options.airborne) {
      resolved.y = this.getGroundHeight(resolved.x, resolved.z);
    }
    return resolved;
  }

  snapToGround(position: THREE.Vector3): void {
    position.y = this.getGroundHeight(position.x, position.z);
  }

  // Hauteur de sol en (x, z) — pour ancrer des entites non joueur (cibles combat, marqueurs).
  sampleGround(x: number, z: number): number {
    return this.getGroundHeight(x, z);
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
    if (this.getWalkableSurfaceHeight(x, z) !== null) {
      return true;
    }

    const terrain = this.terrain;
    if (!terrain) {
      return isInsideBounds(x, z, defaultBounds);
    }

    return isInsideBounds(x, z, terrain.bounds) && pointInPolygon(x, z, terrain.outline);
  }

  private canOccupyTerrain(previous: THREE.Vector3, candidate: THREE.Vector3, options: MoveResolveOptions): boolean {
    if (!this.isWalkable(candidate.x, candidate.z)) {
      return false;
    }

    // Le heightfield devient un obstacle : on accepte les petites marches, pas les falaises.
    const previousGround = this.getGroundHeight(previous.x, previous.z);
    const candidateGround = this.getGroundHeight(candidate.x, candidate.z);
    const stepUpLimit = this.getStepUpLimit(candidate.x, candidate.z);
    if (options.airborne) {
      const horizontalDistance = Math.hypot(candidate.x - previous.x, candidate.z - previous.z);
      if (horizontalDistance < 0.0001) {
        return true;
      }
      const currentY = options.currentY ?? candidate.y;
      return candidateGround <= previousGround + stepUpLimit || currentY + airborneGroundClearance >= candidateGround;
    }

    const deltaY = candidateGround - previousGround;
    if (deltaY > stepUpLimit) {
      return false;
    }
    if (deltaY < -maxGroundStepDown) {
      return false;
    }
    return true;
  }

  private getGroundHeight(x: number, z: number): number {
    const surfaceHeight = this.getWalkableSurfaceHeight(x, z);
    const chunkHeight = this.getChunkGroundHeight(x, z);
    if (chunkHeight !== null) {
      return surfaceHeight === null ? chunkHeight : Math.max(chunkHeight, surfaceHeight);
    }

    const terrain = this.terrain;
    if (!terrain) {
      return surfaceHeight ?? 0;
    }

    const height = sampleHeight(terrain, x, z) ?? 0;
    const terrainHeight = isOnWestPath(x, z, westPlayableHalfWidth) ? Math.max(height, westPlayableMinHeight) : height;
    return surfaceHeight === null ? terrainHeight : Math.max(terrainHeight, surfaceHeight);
  }

  private getWalkableSurfaceHeight(x: number, z: number): number | null {
    let topY: number | null = null;
    for (const surface of this.walkableSurfaces) {
      if (!pointInWalkableSurface(x, z, surface)) {
        continue;
      }
      topY = topY === null ? surface.topY : Math.max(topY, surface.topY);
    }
    for (const solid of this.solids) {
      if (solid.climbableTopY === undefined || !pointInClimbableCircle(x, z, solid)) {
        continue;
      }
      topY = topY === null ? solid.climbableTopY : Math.max(topY, solid.climbableTopY);
    }
    return topY;
  }

  private getStepUpLimit(x: number, z: number): number {
    let limit = maxGroundStepUp;
    for (const surface of this.walkableSurfaces) {
      if (surface.stepUp === undefined || !pointInWalkableSurface(x, z, surface)) {
        continue;
      }
      limit = Math.max(limit, surface.stepUp);
    }
    for (const solid of this.solids) {
      if (solid.stepUp === undefined || !pointInClimbableCircle(x, z, solid)) {
        continue;
      }
      limit = Math.max(limit, solid.stepUp);
    }
    return limit;
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

  private resolveSolidCollisions(previous: THREE.Vector3, position: THREE.Vector3, options: MoveResolveOptions): void {
    for (let pass = 0; pass < 4; pass += 1) {
      for (const surface of this.walkableSurfaces) {
        if (!surface.blocksSides || canClimbSurface(previous, position, surface, options, this.canOccupyTerrain.bind(this))) {
          continue;
        }
        resolveWalkableRectSide(position, surface);
      }
      for (const solid of this.solids) {
        if (solid.climbableTopY !== undefined && pointInClimbableCircle(position.x, position.z, solid)) {
          continue;
        }
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

function canClimbSurface(
  previous: THREE.Vector3,
  position: THREE.Vector3,
  surface: WalkableSurface,
  options: MoveResolveOptions,
  canOccupyTerrain: (previous: THREE.Vector3, candidate: THREE.Vector3, options: MoveResolveOptions) => boolean
): boolean {
  return pointInWalkableSurface(position.x, position.z, surface) && canOccupyTerrain(previous, position, options);
}

function resolveWalkableRectSide(position: THREE.Vector3, surface: WalkableSurface): void {
  const local = toWalkableSurfaceLocal(position.x, position.z, surface);
  const halfWidth = surface.width / 2 + playerRadius;
  const halfDepth = surface.depth / 2 + playerRadius;
  if (Math.abs(local.x) >= halfWidth || Math.abs(local.z) >= halfDepth) {
    return;
  }

  const pushX = halfWidth - Math.abs(local.x);
  const pushZ = halfDepth - Math.abs(local.z);
  if (pushX < pushZ) {
    local.x = local.x >= 0 ? halfWidth : -halfWidth;
  } else {
    local.z = local.z >= 0 ? halfDepth : -halfDepth;
  }

  const world = fromWalkableSurfaceLocal(local.x, local.z, surface);
  position.x = world.x;
  position.z = world.z;
}

function pointInWalkableSurface(x: number, z: number, surface: WalkableSurface): boolean {
  const local = toWalkableSurfaceLocal(x, z, surface);
  return Math.abs(local.x) <= surface.width / 2 && Math.abs(local.z) <= surface.depth / 2;
}

function pointInClimbableCircle(x: number, z: number, solid: CircleCollider): boolean {
  return Math.hypot(x - solid.x, z - solid.z) <= solid.radius;
}

function toWalkableSurfaceLocal(x: number, z: number, surface: WalkableSurface): Point2 {
  const yaw = surface.yaw ?? 0;
  const dx = x - surface.x;
  const dz = z - surface.z;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return {
    x: dx * cos - dz * sin,
    z: dx * sin + dz * cos
  };
}

function fromWalkableSurfaceLocal(localX: number, localZ: number, surface: WalkableSurface): Point2 {
  const yaw = surface.yaw ?? 0;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return {
    x: surface.x + localX * cos + localZ * sin,
    z: surface.z - localX * sin + localZ * cos
  };
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
