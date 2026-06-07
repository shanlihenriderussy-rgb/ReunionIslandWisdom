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

// Niveau de la mer : noie les cotes (terrain qui plonge sous 0), laisse le hub au sec.
const seaLevel = -0.38;
const beachY = 0.055;

export function configureWorld(scene: THREE.Scene, onColliders: ColliderSink = () => {}): void {
  // Palette DA : voir docs/obsidian/09-direction-artistique.md
  // Cible visuelle : moodboard low-poly tropical, couleurs franches, ombres douces.
  scene.fog = new THREE.Fog(0xb9dcef, 145, 360);
  scene.background = new THREE.Color(0x9ed3f2);

  // Ciel tropical + rebond végétation sol.
  const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x5f8e44, 1.78);
  scene.add(hemi);

  // Soleil fin de matinée — chaud, légèrement plus intense.
  const sun = new THREE.DirectionalLight(0xffe2a5, 3.45);
  sun.position.set(22, 32, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  // Lagon tropical réunionnais — turquoise chaud.
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(520, 520),
    new THREE.MeshStandardMaterial({
      color: 0x19aeca,
      roughness: 0.58,
      metalness: 0.02,
      emissive: 0x073c45,
      emissiveIntensity: 0.12
    })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = seaLevel;
  ocean.receiveShadow = true;
  scene.add(ocean);

  addLaReunionVectorMap(scene);
  addWestBlockout(scene);
  // Decor non-prop conserve : snack, panneaux, lagon, ecume, nuages.
  addWestMoodboardScenic(scene);
  // Vegetation luxuriante generee (seedee, ancree sol, corridor chemin, colliders serres).
  // Remplace l'ancien semis worldObjects (supprime). Colliders remontes a la collision.
  addWestVegetation(scene, onColliders);
  // Props procéduraux zone de départ volcan (basalte/scories + reperes objectif).
  addFournaiseBlockout(scene);
  addBiomeDebugOverlays(scene);
}

// Silhouette reelle OSM + relief STL, generes dans tools/build-lareunion-relief-map.mjs.
function addLaReunionVectorMap(scene: THREE.Scene): void {
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
