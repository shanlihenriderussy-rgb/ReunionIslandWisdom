import * as THREE from "three";
import { terrainAssets } from "@riw/assets";
import { WEST_BLOCKOUT_COLLIDERS } from "../world/westBlockout";

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
  heights: number[];
};

type CircleCollider = {
  kind: "circle";
  x: number;
  z: number;
  radius: number;
};

const playerRadius = 0.22;
const defaultBounds = {
  minX: -77.5,
  maxX: 77.5,
  minZ: -69.4,
  maxZ: 69.4
};

export class WorldCollision {
  private terrain: TerrainCollisionData | null = null;
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
        return;
      }
      this.terrain = (await response.json()) as TerrainCollisionData;
    } catch (error) {
      console.warn("Terrain collision load failed", error);
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
    const terrain = this.terrain;
    if (!terrain) {
      return 0;
    }

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

    const h00 = heights[z0 * gridX + x0] ?? 0;
    const h10 = heights[z0 * gridX + x1] ?? h00;
    const h01 = heights[z1 * gridX + x0] ?? h00;
    const h11 = heights[z1 * gridX + x1] ?? h00;
    const hx0 = THREE.MathUtils.lerp(h00, h10, fx);
    const hx1 = THREE.MathUtils.lerp(h01, h11, fx);
    return THREE.MathUtils.lerp(hx0, hx1, fz);
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
