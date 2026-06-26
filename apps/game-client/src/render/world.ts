import * as THREE from "three";
import { terrainAssets } from "@riw/assets";
import { WORLD_BIOMES } from "../world/biomes";
import { loadGltfGroup } from "./gltf";
import { addWestBlockout } from "./westBlockout";
import { addWestMoodboardScenic } from "./westScenic";
import { addWestVegetation, type RuntimeCollider } from "./westVegetation";
import { addFournaiseBlockout } from "./fournaise";

// Callback de remontee des colliders props generes (vers WorldCollision).
export type ColliderSink = (colliders: readonly RuntimeCollider[]) => void;

type ZoneVisualMode = "west" | "fournaise" | "all";

// Niveau de la mer : noie les cotes (terrain qui plonge sous 0), laisse le hub au sec.
const seaLevel = -0.38;
const beachY = 0.055;

export function configureWorld(scene: THREE.Scene, onColliders: ColliderSink = () => {}): void {
  const visualMode = getZoneVisualMode();

  // Palette DA : voir docs/obsidian/09-direction-artistique.md
  // Cible visuelle : moodboard low-poly tropical, couleurs franches, ombres douces.
  scene.fog = new THREE.Fog(0xb9dcef, 145, 360);
  scene.background = new THREE.Color(0x9ed3f2);

  // Ciel tropical + rebond végétation sol (ground adouci pour ne pas verdir les plages).
  const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x4f7c39, 1.78);
  scene.add(hemi);

  // Soleil fin de matinée — chaud. Intensité abaissée (3.45 -> 2.9) : moins plat, ombres plus lisibles.
  const sun = new THREE.DirectionalLight(0xffe2a5, 2.9);
  sun.position.set(22, 32, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006; // réduit le bruit/acné d'ombre sur le relief
  scene.add(sun);

  // Lagon tropical réunionnais — bicolore proche/large (moodboard B1) :
  // turquoise lagon près de l'origine -> bleu profond au large, via vertex colors.
  // Pas de normalMap (aucun asset texture licencié dispo — cf. CLAUDE.md assets).
  const oceanGeometry = new THREE.PlaneGeometry(520, 520, 32, 32);
  applyOceanGradient(oceanGeometry);
  const ocean = new THREE.Mesh(
    oceanGeometry,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.5,
      metalness: 0.04,
      emissive: 0x062f38,
      emissiveIntensity: 0.1
    })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = seaLevel;
  ocean.receiveShadow = true;
  scene.add(ocean);

  addLaReunionVectorMap(scene);
  if (visualMode === "west" || visualMode === "all") {
    addWestBlockout(scene);
    // Decor non-prop conserve : snack, panneaux, lagon, ecume, nuages.
    addWestMoodboardScenic(scene);
    // Vegetation luxuriante generee (seedee, ancree sol, corridor chemin, colliders serres).
    // Remplace l'ancien semis worldObjects (supprime). Colliders remontes a la collision.
    addWestVegetation(scene, onColliders);
  }
  if (visualMode === "fournaise" || visualMode === "all") {
    // Props proceduraux zone volcan. Hors build ouest par defaut pour eviter deux DA visibles.
    addFournaiseBlockout(scene);
  }
  addBiomeDebugOverlays(scene);
}

function getZoneVisualMode(): ZoneVisualMode {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("visualZone");
  if (requested === "fournaise" || requested === "all") {
    return requested;
  }
  return "west";
}

// Bicolore océan : lagon turquoise près de l'origine, bleu profond au large.
// La distance radiale est invariante par la rotation -PI/2 du plan : on calcule
// donc le gradient dans l'espace local (x,y) du PlaneGeometry avant rotation.
const oceanLagoon = new THREE.Color(0x60d4d1);
const oceanDeep = new THREE.Color(0x0e6e84);
const OCEAN_GRADIENT_RADIUS = 230; // m : rayon où l'on atteint le bleu profond

function applyOceanGradient(geometry: THREE.PlaneGeometry): void {
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i += 1) {
    const px = position.getX(i);
    const py = position.getY(i);
    const r = Math.min(1, Math.hypot(px, py) / OCEAN_GRADIENT_RADIUS);
    // r*r : garde un large coeur lagon près de la côte, transition serrée au large.
    color.copy(oceanLagoon).lerp(oceanDeep, r * r);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
}

// Terrain monolithique (GLB 18 Mo). N'est charge QUE si le streaming par chunks
// RGE ALTI n'est pas disponible : sinon on evite le fetch+parse inutile (le streamer
// fournit le relief et retirerait ce mesh de toute facon). Cf. ADR-005 + backlog perf.
function addLaReunionVectorMap(scene: THREE.Scene): void {
  void shouldUseChunkStreaming()
    .then((streaming) => {
      if (streaming) {
        console.info("Terrain monolithique ignore : streaming RGE ALTI actif.");
        return;
      }
      loadMonolithicRelief(scene);
    })
    .catch(() => {
      // En cas d'echec de la sonde manifeste, on retombe sur le terrain monolithique.
      loadMonolithicRelief(scene);
    });
}

// Sonde legere : le manifeste de chunks (~38 ko) est-il un manifeste de streaming RGE ALTI valide ?
async function shouldUseChunkStreaming(): Promise<boolean> {
  try {
    const response = await fetch(terrainAssets.laReunion.chunkManifest);
    if (!response.ok) {
      return false;
    }
    const data = (await response.json()) as { source?: string; kind?: string };
    return data.source === "IGN RGE ALTI D974" && data.kind === "terrain-stream-manifest";
  } catch {
    return false;
  }
}

// Silhouette reelle OSM + relief STL, generes dans tools/build-lareunion-relief-map.mjs.
function loadMonolithicRelief(scene: THREE.Scene): void {
  void loadGltfGroup(terrainAssets.laReunion.reliefMap)
    .then(({ scene: model }) => {
      model.name = "LaReunionReliefMap";
      removeYellowDebugMaterials(model);
      applyMoodboardTerrainMaterials(model);
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = false;
          child.receiveShadow = true;
        }
      });
      scene.add(model);
    })
    .catch((error: unknown) => {
      console.warn(`GLB terrain load failed: ${terrainAssets.laReunion.reliefMap}`, error);
    });
}

function removeYellowDebugMaterials(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (isYellowDebugMaterial(material)) {
        material.transparent = true;
        material.opacity = 0;
        material.depthWrite = false;
        material.needsUpdate = true;
      }
    }
    if (materials.length > 0 && materials.every((material) => isYellowDebugMaterial(material))) {
      child.visible = false;
    }
  });
}

function isYellowDebugMaterial(material: THREE.Material): boolean {
  if (!(material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial)) {
    return false;
  }
  const color = material.color;
  return color.r > 0.72 && color.g > 0.5 && color.b < 0.28;
}

function applyMoodboardTerrainMaterials(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial)) {
        continue;
      }
      const color = material.color;
      const isVegetation = color.g >= color.r && color.g >= color.b;
      const isRock = color.r < 0.38 && color.g < 0.42 && color.b < 0.42;
      if (isVegetation) {
        color.setHex(0x6fa150);
      } else if (isRock) {
        color.setHex(0x3f4442);
      }
      material.needsUpdate = true;
    }
  });
}

function addBiomeDebugOverlays(scene: THREE.Scene): void {
  if (!new URLSearchParams(window.location.search).has("biomeDebug")) {
    return;
  }

  for (const biome of WORLD_BIOMES) {
    const marker = new THREE.Mesh(
      new THREE.CircleGeometry(biome.radius, 48),
      new THREE.MeshBasicMaterial({
        color: biome.debugColor,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    marker.name = `BiomeDebug_${biome.id}`;
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(biome.center.x, beachY + 0.028, biome.center.y);
    marker.renderOrder = 1;
    scene.add(marker);
  }
}
