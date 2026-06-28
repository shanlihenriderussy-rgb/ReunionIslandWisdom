import * as THREE from "three";
import { terrainAssets } from "@riw/assets";
import { buildGltfInstances, type GltfInstanceSpec } from "./gltf";
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

// Heightfield d'un chunk RGE ALTI (meme structure que collision.ts) : c'est CE relief
// qui est rendu a l'ecran et sur lequel marche le joueur. La vegetation doit s'y poser
// (sinon elle flotte : reliefCollision global != surface visible des chunks).
type ChunkHeightfieldData = {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  gridX: number;
  gridZ: number;
  heights: Array<number | null>;
};

type ChunkManifestData = {
  source?: string;
  kind?: string;
  chunks?: Array<{ heightfield?: string }>;
};

export type RuntimeCollider = {
  kind: "circle";
  x: number;
  z: number;
  radius: number;
  climbableTopY?: number;
  stepUp?: number;
};

type VegetationBatch = {
  url: string;
  materialMode: "westVegetation" | "maidoYellowFlower";
  specs: GltfInstanceSpec[];
};

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
  // Charge en parallele : silhouette/collision globale (filtrage) + heightfields de chunks
  // (placement au sol visible, identique au joueur).
  void Promise.all([
    fetch(terrainAssets.laReunion.reliefCollision)
      .then((response) => (response.ok ? (response.json() as Promise<TerrainCollisionData>) : null))
      .catch(() => null),
    loadChunkHeightfields()
  ])
    .then(([terrain, chunks]) => {
      if (!terrain) {
        return;
      }

      const group = new THREE.Group();
      group.name = "WestVegetation_SaintPaulSaintGilles";
      const colliders: RuntimeCollider[] = [];

      // 1) Filtrage + colliders (donnees, pas de draw call).
      // 2) Regroupement par URL : 1 GLB -> N InstancedMesh au lieu de N props.
      const batches = new Map<string, VegetationBatch>();
      for (const cand of generateWestVegetation()) {
        if (!accept(cand, terrain)) {
          continue;
        }
        const materialMode = cand.appearance === "maidoYellowFlower" ? "maidoYellowFlower" : "westVegetation";
        const batchKey = `${materialMode}:${cand.url}`;
        let batch = batches.get(batchKey);
        if (!batch) {
          batch = { url: cand.url, materialMode, specs: [] };
          batches.set(batchKey, batch);
        }
        const spec = instanceSpecFor(cand, terrain, chunks);
        batch.specs.push(spec);
        if (cand.colliderRadius > 0) {
          const climbableTopY = climbableTopFor(cand, spec.position.y);
          colliders.push({
            kind: "circle",
            x: cand.x,
            z: cand.z,
            radius: cand.colliderRadius,
            ...(climbableTopY === null ? {} : { climbableTopY, stepUp: 0.72 })
          });
        }
      }

      scene.add(group);
      generatedColliders = colliders;
      onColliders?.(colliders);

      // Pose instanciee (asynchrone par GLB) : ajoute les InstancedMesh au fur et a mesure.
      for (const batch of batches.values()) {
        void buildGltfInstances(batch.url, batch.specs, {
          materialMode: batch.materialMode,
          castShadow: true,
          receiveShadow: true
        })
          .then((meshes) => {
            for (const mesh of meshes) {
              group.add(mesh);
            }
          })
          .catch((error: unknown) => {
            console.warn(`West vegetation instancing failed: ${batch.url}`, error);
          });
      }
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

// Convertit un candidat en spec d'instance : meme placement que l'ancien createProp
// (sol + 0.02, tilt borne selon le type), scale/rotation portes par l'InstancedMesh.
// IMPORTANT : la hauteur sol vient des chunks (relief visible) pour ne pas flotter.
function instanceSpecFor(
  cand: VegCandidate,
  terrain: TerrainCollisionData,
  chunks: ChunkHeightfieldData[]
): GltfInstanceSpec {
  const groundY = groundHeight(terrain, chunks, cand.x, cand.z);
  return {
    position: new THREE.Vector3(cand.x, groundY + 0.02, cand.z),
    quaternion: terrainTiltQuaternion(terrain, cand.x, cand.z, maxTiltForCandidate(cand)),
    targetHeight: cand.height,
    rotationY: cand.rot
  };
}


const terrainUp = new THREE.Vector3(0, 1, 0);

function maxTiltForCandidate(cand: VegCandidate): number {
  // Rochers / barrieres : suivent franchement la pente (0.42 ~ 24°).
  if (cand.id.includes("rock") || cand.id.includes("barrier")) {
    return 0.42;
  }
  // Tapis de sol cote sentier : inclinaison reduite (0.32) pour rester lisible.
  if (cand.id.includes("ground")) {
    return 0.32;
  }
  if (cand.id.includes("bush")) {
    return 0.28;
  }
  return 0.12;
}

function climbableTopFor(cand: VegCandidate, baseY: number): number | null {
  if (!cand.id.includes("rock") && !cand.id.includes("barrier")) {
    return null;
  }
  return baseY + Math.min(0.62, Math.max(0.34, cand.height * 0.42));
}

function terrainTiltQuaternion(
  terrain: TerrainCollisionData,
  x: number,
  z: number,
  maxTiltRadians: number
): THREE.Quaternion {
  const normal = sampleNormal(terrain, x, z, 0.9);
  const angle = terrainUp.angleTo(normal);
  if (angle <= 0.0001) {
    return new THREE.Quaternion();
  }
  const limitedNormal = angle > maxTiltRadians
    ? terrainUp.clone().lerp(normal, maxTiltRadians / angle).normalize()
    : normal;
  return new THREE.Quaternion().setFromUnitVectors(terrainUp, limitedNormal);
}

function sampleNormal(terrain: TerrainCollisionData, x: number, z: number, step: number): THREE.Vector3 {
  const left = sampleHeight(terrain, x - step, z);
  const right = sampleHeight(terrain, x + step, z);
  const down = sampleHeight(terrain, x, z - step);
  const up = sampleHeight(terrain, x, z + step);
  return new THREE.Vector3(left - right, step * 2, down - up).normalize();
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

// Hauteur de sol POSE : chunks RGE ALTI (relief visible) d'abord, sinon collision globale.
// Identique a la logique joueur (collision.ts getGroundHeight) -> la vegetation ne flotte plus.
function groundHeight(
  terrain: TerrainCollisionData,
  chunks: ChunkHeightfieldData[],
  x: number,
  z: number
): number {
  for (const chunk of chunks) {
    if (!isInsideBounds(x, z, chunk.bounds)) {
      continue;
    }
    const h = sampleChunkHeight(chunk, x, z);
    if (h !== null) {
      return h;
    }
  }
  return sampleHeight(terrain, x, z);
}

function isInsideBounds(
  x: number,
  z: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
): boolean {
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
}

async function loadChunkHeightfields(): Promise<ChunkHeightfieldData[]> {
  try {
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
  } catch {
    return [];
  }
}

function sampleChunkHeight(terrain: ChunkHeightfieldData, x: number, z: number): number | null {
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
  const h00 = finiteAt(heights, z0 * gridX + x0);
  const h10 = finiteAt(heights, z0 * gridX + x1);
  const h01 = finiteAt(heights, z1 * gridX + x0);
  const h11 = finiteAt(heights, z1 * gridX + x1);
  if (h00 === null || h10 === null || h01 === null || h11 === null) {
    return null;
  }
  const hx0 = THREE.MathUtils.lerp(h00, h10, fx);
  const hx1 = THREE.MathUtils.lerp(h01, h11, fx);
  return THREE.MathUtils.lerp(hx0, hx1, fz);
}

function finiteAt(heights: ReadonlyArray<number | null>, index: number): number | null {
  const h = heights[index];
  return typeof h === "number" && Number.isFinite(h) ? h : null;
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
