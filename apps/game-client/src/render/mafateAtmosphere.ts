import * as THREE from "three";
import { terrainAssets } from "@riw/assets";

const MAFATE_CENTER = new THREE.Vector3(-36, 9.9, 8);

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

export function addMafateHighlandAtmosphere(scene: THREE.Scene): void {
  const group = new THREE.Group();
  group.name = "MafateHighlandAtmosphere";

  group.add(createLowMistLayer());
  group.add(createHeavyCloudBanks());
  void addDarkHighlandBosquets(group);

  scene.add(group);
}

function createLowMistLayer(): THREE.Group {
  const group = new THREE.Group();
  group.name = "MafateLowMist";

  const patches = [
    { x: -26, y: 11.8, z: 22, sx: 18, sz: 4.8, rot: -0.24, opacity: 0.08 },
    { x: -14, y: 13.4, z: 24, sx: 24, sz: 5.8, rot: -0.42, opacity: 0.1 },
    { x: -50, y: 10.2, z: 14, sx: 16, sz: 4.2, rot: 0.2, opacity: 0.08 },
    { x: 0, y: 15.2, z: 14, sx: 24, sz: 5.2, rot: 0.12, opacity: 0.07 }
  ] as const;

  for (const patch of patches) {
    group.add(createMistPatch(patch.x, patch.y, patch.z, patch.sx, patch.sz, patch.rot, patch.opacity));
  }

  return group;
}

function createMistPatch(
  x: number,
  y: number,
  z: number,
  width: number,
  depth: number,
  rotationY: number,
  opacity: number
): THREE.Group {
  const group = new THREE.Group();
  group.name = "MafateMistPatch";
  group.position.set(x, y, z);
  group.rotation.y = rotationY;

  const geometry = new THREE.DodecahedronGeometry(1, 0);
  const material = new THREE.MeshBasicMaterial({
    color: 0xc7d3d8,
    transparent: true,
    opacity,
    depthWrite: false
  });
  const blobs = [
    { x: -0.42, z: -0.1, sx: 0.42, sz: 0.72 },
    { x: -0.12, z: 0.08, sx: 0.52, sz: 0.92 },
    { x: 0.22, z: -0.04, sx: 0.5, sz: 0.78 },
    { x: 0.52, z: 0.14, sx: 0.34, sz: 0.58 }
  ] as const;

  for (const blob of blobs) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.position.set(blob.x * width, 0, blob.z * depth);
    mesh.scale.set(blob.sx * width, 0.12, blob.sz * depth);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.renderOrder = 1;
    group.add(mesh);
  }

  return group;
}

function createHeavyCloudBanks(): THREE.Group {
  const group = new THREE.Group();
  group.name = "MafateHeavyCloudBanks";

  const banks = [
    { x: -52, y: 21, z: 28, scale: 4.6, tone: 0xb8c5cf, opacity: 0.64 },
    { x: -28, y: 25, z: 34, scale: 5.2, tone: 0xd2dde4, opacity: 0.58 },
    { x: 2, y: 23, z: 18, scale: 4.8, tone: 0xaebcc7, opacity: 0.52 },
    { x: -58, y: 18, z: -10, scale: 3.8, tone: 0xc4d0d7, opacity: 0.42 }
  ] as const;

  for (const bank of banks) {
    group.add(createCloudBank(bank.x, bank.y, bank.z, bank.scale, bank.tone, bank.opacity));
  }

  return group;
}

function createCloudBank(
  x: number,
  y: number,
  z: number,
  scale: number,
  tone: number,
  opacity: number
): THREE.Group {
  const group = new THREE.Group();
  group.name = "MafateCloudBank";
  group.position.set(x, y, z);
  group.scale.setScalar(scale);

  const geometry = new THREE.DodecahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({
    color: tone,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity,
    depthWrite: false
  });

  const blobs = [
    { x: -1.6, y: -0.12, z: 0.08, sx: 1.5, sy: 0.48, sz: 0.72 },
    { x: -0.7, y: 0.12, z: 0.0, sx: 1.7, sy: 0.62, sz: 0.82 },
    { x: 0.35, y: 0.02, z: -0.04, sx: 1.9, sy: 0.58, sz: 0.78 },
    { x: 1.35, y: -0.08, z: 0.05, sx: 1.45, sy: 0.46, sz: 0.68 }
  ] as const;

  for (const blob of blobs) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.position.set(blob.x, blob.y, blob.z);
    mesh.scale.set(blob.sx, blob.sy, blob.sz);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
  }

  return group;
}

async function addDarkHighlandBosquets(parent: THREE.Group): Promise<void> {
  const group = new THREE.Group();
  group.name = "MafateDarkHighlandBosquets";
  const chunks = await loadChunkHeightfields();

  const bosquets = [
    { x: -55.5, z: 8.5, scale: 0.5, rot: 0.25 },
    { x: -45.8, z: 16.2, scale: 0.46, rot: -0.5 },
    { x: -26.5, z: 18.8, scale: 0.42, rot: 0.8 },
    { x: -55.2, z: -12.8, scale: 0.38, rot: -0.2 }
  ] as const;

  for (const item of bosquets) {
    const bosquet = createWindBentBosquet(item.scale);
    bosquet.position.set(item.x, groundHeight(chunks, item.x, item.z) + 0.04, item.z);
    bosquet.rotation.y = item.rot;
    group.add(bosquet);
  }

  parent.add(group);
}

function createWindBentBosquet(scale: number): THREE.Group {
  const group = new THREE.Group();
  group.name = "MafateWindBentBosquet";
  group.scale.setScalar(scale);

  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b2b24,
    roughness: 0.95,
    metalness: 0
  });
  const crownMaterial = new THREE.MeshStandardMaterial({
    color: 0x17312a,
    roughness: 1,
    metalness: 0,
    emissive: 0x07120f,
    emissiveIntensity: 0.08
  });

  const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.2, 1, 5);
  const crownGeometry = new THREE.DodecahedronGeometry(1, 0);
  const stems = [
    { x: -0.42, z: 0.0, h: 1.2, lean: -0.26, crown: 0.82 },
    { x: 0.05, z: 0.2, h: 1.55, lean: -0.18, crown: 1.05 },
    { x: 0.48, z: -0.12, h: 1.05, lean: -0.34, crown: 0.72 }
  ] as const;

  for (const stem of stems) {
    const stemGroup = new THREE.Group();
    stemGroup.position.set(stem.x, 0, stem.z);
    stemGroup.rotation.z = stem.lean;
    group.add(stemGroup);

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = stem.h * 0.5;
    trunk.scale.y = stem.h;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    stemGroup.add(trunk);

    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.set(stem.x + stem.lean * 1.1, stem.h + 0.42, stem.z);
    crown.scale.set(stem.crown * 1.25, stem.crown * 0.68, stem.crown * 0.92);
    crown.rotation.z = stem.lean * 0.8;
    crown.castShadow = true;
    crown.receiveShadow = true;
    group.add(crown);
  }

  return group;
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

    const chunks = await Promise.all(
      (manifest.chunks ?? []).map(async (entry) => {
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

function groundHeight(chunks: readonly ChunkHeightfieldData[], x: number, z: number): number {
  for (const chunk of chunks) {
    if (!isInsideBounds(x, z, chunk.bounds)) {
      continue;
    }
    const height = sampleHeight(chunk, x, z);
    if (height !== null) {
      return height;
    }
  }
  return MAFATE_CENTER.y;
}

function isInsideBounds(
  x: number,
  z: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
): boolean {
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
}

function sampleHeight(terrain: ChunkHeightfieldData, x: number, z: number): number | null {
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
