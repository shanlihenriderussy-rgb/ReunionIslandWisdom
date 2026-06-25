import * as THREE from "three";
import { terrainAssets } from "@riw/assets";
import { loadGltfGroup } from "../render/gltf";

// Streamer terrain par chunks (ADR-005, voir docs/obsidian/20-systeme-jeu-zones.md).
// Source obligatoire : IGN RGE ALTI D974. Refuse tout manifeste STL fallback.
// Visuel uniquement : la collision reste globale (lareunion-relief-collision.json, deja RGE ALTI).
// Charge un anneau de chunks autour du joueur, decharge hors rayon (avec hysteresis).

const REQUIRED_SOURCE = "IGN RGE ALTI D974";
const RELIEF_MESH_NAME = "LaReunionReliefMap";

type ChunkEntry = {
  index: number;
  cx: number;
  cz: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  file: string;
  triangles?: number;
};

type ChunkManifest = {
  source: string;
  kind: string;
  chunkCountX: number;
  chunkCountZ: number;
  chunks: ChunkEntry[];
};

type LoadedChunk = {
  group: THREE.Group;
  disposed: boolean;
};

export type ChunkStreamerOptions = {
  // Rayon d'anneau en chunks (1 => 3x3). Defaut 1.
  radius?: number;
  // Chargements simultanes max. Defaut 2.
  maxConcurrent?: number;
};

export interface ChunkStreamer {
  // true si un manifeste RGE ALTI valide a ete charge et le streaming est actif.
  readonly active: boolean;
  init(): Promise<boolean>;
  update(playerPos: THREE.Vector3, options?: { mapView?: boolean }): void;
  dispose(): void;
}

export function createChunkStreamer(
  scene: THREE.Scene,
  options: ChunkStreamerOptions = {}
): ChunkStreamer {
  const radius = options.radius ?? 1;
  const maxConcurrent = options.maxConcurrent ?? 2;

  let manifest: ChunkManifest | null = null;
  let active = false;
  const byKey = new Map<string, ChunkEntry>();
  const loaded = new Map<string, LoadedChunk>();
  const loading = new Set<string>();
  const queue: ChunkEntry[] = [];
  let lastChunkKey: string | null = null;

  function key(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  function chunkAt(pos: THREE.Vector3): { cx: number; cz: number } | null {
    if (!manifest) {
      return null;
    }
    // On retrouve le chunk dont les bounds contiennent la position.
    for (const chunk of manifest.chunks) {
      const b = chunk.bounds;
      if (pos.x >= b.minX && pos.x <= b.maxX && pos.z >= b.minZ && pos.z <= b.maxZ) {
        return { cx: chunk.cx, cz: chunk.cz };
      }
    }
    return null;
  }

  function removeMonolithicRelief(): void {
    const mesh = scene.getObjectByName(RELIEF_MESH_NAME);
    if (mesh) {
      scene.remove(mesh);
      disposeObject(mesh);
    }
  }

  function enqueue(chunk: ChunkEntry): void {
    if ((chunk.triangles ?? 1) <= 0) {
      return;
    }
    const k = key(chunk.cx, chunk.cz);
    if (loaded.has(k) || loading.has(k) || queue.some((c) => key(c.cx, c.cz) === k)) {
      return;
    }
    queue.push(chunk);
  }

  function pump(): void {
    while (loading.size < maxConcurrent && queue.length > 0) {
      const chunk = queue.shift();
      if (!chunk) {
        break;
      }
      const k = key(chunk.cx, chunk.cz);
      if (loaded.has(k) || loading.has(k)) {
        continue;
      }
      loading.add(k);
      void loadGltfGroup(chunk.file)
        .then(({ scene: model }) => {
          loading.delete(k);
          // Le chunk a pu etre marque hors-rayon entre-temps.
          if (!active) {
            disposeObject(model);
            return;
          }
          model.name = `Chunk_${k}`;
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              applyTerrainChunkMaterial(child);
              child.castShadow = false;
              child.receiveShadow = true;
            }
          });
          scene.add(model);
          loaded.set(k, { group: model, disposed: false });
        })
        .catch((error: unknown) => {
          loading.delete(k);
          console.warn(`Chunk load failed: ${chunk.file}`, error);
        });
    }
  }

  function unloadOutside(cx: number, cz: number): void {
    // Hysteresis : on garde radius+1 pour eviter le yoyo en bordure.
    const keep = radius + 1;
    for (const [k, chunk] of loaded) {
      const [lx, lz] = k.split(",").map(Number);
      if (Math.abs((lx ?? 0) - cx) > keep || Math.abs((lz ?? 0) - cz) > keep) {
        scene.remove(chunk.group);
        disposeObject(chunk.group);
        chunk.disposed = true;
        loaded.delete(k);
      }
    }
  }

  return {
    get active() {
      return active;
    },

    async init(): Promise<boolean> {
      try {
        const response = await fetch(terrainAssets.laReunion.chunkManifest);
        if (!response.ok) {
          return false;
        }
        const data = (await response.json()) as ChunkManifest;
        // GATE : on refuse tout manifeste qui n'est pas RGE ALTI (cf. note prereq streamer).
        if (data.source !== REQUIRED_SOURCE || data.kind !== "terrain-stream-manifest") {
          console.warn(
            `ChunkStreamer desactive : source manifeste "${data.source}" != "${REQUIRED_SOURCE}". Terrain monolithique conserve.`
          );
          return false;
        }
        manifest = data;
        for (const chunk of data.chunks) {
          byKey.set(key(chunk.cx, chunk.cz), chunk);
        }
        active = true;
        removeMonolithicRelief();
        return true;
      } catch (error) {
        console.warn("ChunkStreamer init failed", error);
        return false;
      }
    },

    update(playerPos: THREE.Vector3, updateOptions: { mapView?: boolean } = {}): void {
      if (!active || !manifest) {
        return;
      }
      removeMonolithicRelief();
      if (updateOptions.mapView) {
        lastChunkKey = "map";
        for (const chunk of manifest.chunks) {
          enqueue(chunk);
        }
        pump();
        return;
      }
      const current = chunkAt(playerPos);
      if (!current) {
        return;
      }
      const k = key(current.cx, current.cz);
      if (k !== lastChunkKey) {
        lastChunkKey = k;
        // (Re)calcule l'anneau a charger.
        for (let dz = -radius; dz <= radius; dz += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            const chunk = byKey.get(key(current.cx + dx, current.cz + dz));
            if (chunk) {
              enqueue(chunk);
            }
          }
        }
        unloadOutside(current.cx, current.cz);
      }
      pump();
    },

    dispose(): void {
      active = false;
      queue.length = 0;
      loading.clear();
      for (const chunk of loaded.values()) {
        scene.remove(chunk.group);
        disposeObject(chunk.group);
      }
      loaded.clear();
      byKey.clear();
      manifest = null;
    }
  };
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        material.dispose();
      }
    }
  });
}

function applyTerrainChunkMaterial(mesh: THREE.Mesh): void {
  const hasVertexColors = mesh.geometry.getAttribute("color") !== undefined;
  mesh.material = new THREE.MeshStandardMaterial({
    color: hasVertexColors ? 0xffffff : 0x74a85a,
    vertexColors: hasVertexColors,
    roughness: 0.98,
    metalness: 0,
    emissive: 0x294722,
    emissiveIntensity: 0.055,
    flatShading: false,
    side: THREE.DoubleSide
  });
  mesh.material.needsUpdate = true;
}
