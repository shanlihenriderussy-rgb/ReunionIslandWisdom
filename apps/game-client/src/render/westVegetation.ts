import * as THREE from "three";
import { terrainAssets } from "@riw/assets";
import { attachGltf } from "./gltf";
import {
  generateWestVegetation,
  WEST_PATH_CENTERLINE,
  type VegCandidate
} from "../world/westVegetation";

type Point2 = { x: number; z: number };

type TerrainCollisionData = {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  gridX: number;
  gridZ: number;
  outline: Point2[];
  heights: number[];
};

export type RuntimeCollider = { kind: "circle"; x: number; z: number; radius: number };

// Niveau mer (coherent world.ts) : on ne pose rien sous cette hauteur de terrain.
const MIN_GROUND_Y = -0.2;
// Pente max marchable pour poser un prop (rejette falaises verticales).
const MAX_SLOPE = 0.85;

// Colliders generes au runtime, ingere par WorldCollision apres pose.
let generatedColliders: RuntimeCollider[] = [];

export function getWestVegetationColliders(): RuntimeCollider[] {
  return generatedColliders;
}

export function addWestVegetation(
  scene: THREE.Scene,
  onColliders?: (colliders: RuntimeCollider[]) => void
): void {
  void fetch(terrainAssets.laReunion.reliefCollision)
    .then((response) => (response.ok ? response.json() : null))
    .then((terrain: TerrainCollisionData | null) => {
      if (!terrain) {
        return;
      }

      const group = new THREE.Group();
      group.name = "WestVegetation_SaintPaulSaintGilles";
      const colliders: RuntimeCollider[] = [];

      for (const cand of generateWestVegetation()) {
        if (!accept(cand, terrain)) {
          continue;
        }
        group.add(createProp(cand, terrain));
        if (cand.colliderRadius > 0) {
          colliders.push({ kind: "circle", x: cand.x, z: cand.z, radius: cand.colliderRadius });
        }
      }

      scene.add(group);
      generatedColliders = colliders;
      onColliders?.(colliders);
    })
    .catch((error: unknown) => {
      console.warn("West vegetation layer failed", error);
    });
}

// Filtres : dans l'ile, hors eau, pente OK, hors corridor de chemin.
function accept(cand: VegCandidate, terrain: TerrainCollisionData): boolean {
  if (!pointInPolygon(cand.x, cand.z, terrain.outline)) {
    return false;
  }
  const y = sampleHeight(terrain, cand.x, cand.z);
  if (y < MIN_GROUND_Y) {
    return false; // dans/au bord de l'eau
  }
  if (cand.pathClearance > 0) {
    if (slopeAt(terrain, cand.x, cand.z) > MAX_SLOPE) {
      return false; // pente trop raide
    }
    if (distanceToPath(cand.x, cand.z) < cand.pathClearance) {
      return false; // garde le chemin praticable
    }
  }
  return true;
}

function createProp(cand: VegCandidate, terrain: TerrainCollisionData): THREE.Group {
  const parent = new THREE.Group();
  parent.name = cand.id;
  parent.position.set(cand.x, sampleHeight(terrain, cand.x, cand.z) + 0.02, cand.z);
  attachGltf(parent, cand.url, {
    name: cand.id,
    targetHeight: cand.height,
    rotationY: cand.rot,
    castShadow: true,
    receiveShadow: true
  });
  return parent;
}

function distanceToPath(x: number, z: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < WEST_PATH_CENTERLINE.length - 1; i += 1) {
    const a = WEST_PATH_CENTERLINE[i];
    const b = WEST_PATH_CENTERLINE[i + 1];
    if (!a || !b) {
      continue;
    }
    best = Math.min(best, distanceToSegment(x, z, a.x, a.z, b.x, b.z));
  }
  return best;
}

function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  const t = lenSq > 0 ? THREE.MathUtils.clamp(((px - ax) * dx + (pz - az) * dz) / lenSq, 0, 1) : 0;
  const cx = ax + dx * t;
  const cz = az + dz * t;
  return Math.hypot(px - cx, pz - cz);
}

// Pente locale approx : ecart de hauteur sur +-1 unite.
function slopeAt(terrain: TerrainCollisionData, x: number, z: number): number {
  const h = sampleHeight(terrain, x, z);
  const hx = Math.abs(sampleHeight(terrain, x + 1, z) - h);
  const hz = Math.abs(sampleHeight(terrain, x, z + 1) - h);
  return Math.max(hx, hz);
}

function sampleHeight(terrain: TerrainCollisionData, x: number, z: number): number {
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

function pointInPolygon(x: number, z: number, polygon: readonly Point2[]): boolean {
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
