import * as THREE from "three";
import { kenneyAssets } from "@riw/assets";
import { npcs } from "@riw/content";
import { npcInteractionDistance } from "@riw/shared";
import { attachGltf, CHARACTER_YAW_OFFSET, updateAnimationController } from "./gltf";

// Cible du parcours : on pose un marqueur flottant au-dessus de ce PNJ.
export const QUEST_TARGET_NPC_ID = "guide-maido";

// Hauteur PNJ alignee sur l'avatar joueur (render/players.ts playerHeight = 0.72).
// Avant : 1.7 -> PNJ geants. Les PNJ doivent faire la meme taille que le joueur.
const NPC_HEIGHT = 0.72;

// Centre social vers lequel les PNJ se tournent (coherent avec la plaza dans world.ts).
const plazaCenter = new THREE.Vector3(0, 0, 2);

export type NpcView = {
  id: string;
  name: string;
  line: string;
  mesh: THREE.Group;
  material: THREE.MeshStandardMaterial;
  marker: THREE.Object3D | null;
};

export function addNpcViews(scene: THREE.Scene): NpcView[] {
  return npcs.map((npc, index) => {
    const material = new THREE.MeshStandardMaterial({ color: 0xe05f42, roughness: 0.65 });
    const mesh = createNpcMesh(material);
    const characterUrl = npcCharacterUrls[index % npcCharacterUrls.length] ?? kenneyAssets.characters.maleA;
    attachGltf(mesh, characterUrl, {
      targetHeight: NPC_HEIGHT,
      yawOffset: CHARACTER_YAW_OFFSET,
      hideFallback: true,
      userDataKey: "npcVisualRoot"
    });
    mesh.position.set(npc.position.x, npc.position.y, npc.position.z);

    // Mise en scene : le PNJ regarde le centre de la place.
    const toCenter = plazaCenter.clone().sub(mesh.position);
    mesh.rotation.y = Math.atan2(toCenter.x, toCenter.z);

    mesh.userData["label"] = npc.name;

    let marker: THREE.Object3D | null = null;
    if (npc.id === QUEST_TARGET_NPC_ID) {
      marker = createQuestMarker();
      mesh.add(marker);
    }

    scene.add(mesh);

    return {
      id: npc.id,
      name: npc.name,
      line: npc.line,
      mesh,
      material,
      marker
    };
  });
}

const npcCharacterUrls = [
  kenneyAssets.characters.femaleB,
  kenneyAssets.characters.maleB,
  kenneyAssets.characters.femaleC,
  kenneyAssets.characters.maleC,
  kenneyAssets.characters.femaleA,
  kenneyAssets.characters.maleA
] as const;

export function findNearestNpc(playerPosition: THREE.Vector3, npcViews: NpcView[]): NpcView | null {
  let nearest: NpcView | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const npc of npcViews) {
    const distance = playerPosition.distanceTo(npc.mesh.position);
    if (distance < nearestDistance && distance <= npcInteractionDistance) {
      nearest = npc;
      nearestDistance = distance;
    }
  }

  return nearest;
}

export function updateNpcHighlight(npcViews: NpcView[], activeNpcId: string | null): void {
  for (const npc of npcViews) {
    const active = npc.id === activeNpcId;
    npc.material.color.setHex(active ? 0xffd36b : 0xe05f42);
    npc.material.emissive.setHex(active ? 0x332000 : 0x000000);
  }
}

// Animation idle des PNJ : clip GLB "idle" si dispo, sinon respiration procedurale sur place.
// Evite la T-pose figee. moving = false en permanence (PNJ statiques pour l'instant).
export function updateNpcIdle(npcViews: NpcView[], delta: number, elapsed: number): void {
  for (let i = 0; i < npcViews.length; i += 1) {
    const npc = npcViews[i];
    if (!npc) {
      continue;
    }
    if (updateAnimationController(npc.mesh, delta, false)) {
      continue;
    }
    // Fallback procedural : leger balancement vertical + inclinaison, dephase par PNJ.
    const root = npc.mesh.userData["npcVisualRoot"];
    if (!(root instanceof THREE.Object3D)) {
      continue;
    }
    const baseY = typeof root.userData["baseY"] === "number" ? (root.userData["baseY"] as number) : (root.userData["baseY"] = root.position.y, root.position.y);
    const phase = elapsed * 1.6 + i * 0.9;
    root.position.y = baseY + Math.sin(phase) * 0.03;
    root.rotation.z = Math.sin(phase * 0.5) * 0.025;
  }
}

// Anime le marqueur de quete (flottement + rotation).
export function updateNpcMarkers(npcViews: NpcView[], elapsed: number): void {
  for (const npc of npcViews) {
    const marker = npc.marker;
    if (!marker || !marker.visible) {
      continue;
    }
    const base = (marker.userData["baseY"] as number | undefined) ?? marker.position.y;
    marker.position.y = base + Math.sin(elapsed * 2.4) * 0.18;
    marker.rotation.y = elapsed * 1.6;
  }
}

function createQuestMarker(): THREE.Object3D {
  const group = new THREE.Group();
  group.position.y = 2.6;
  group.userData["baseY"] = 2.6;

  const material = new THREE.MeshStandardMaterial({
    color: 0xffd24a,
    emissive: 0x6a4e00,
    roughness: 0.35
  });

  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.7, 5), material);
  arrow.rotation.x = Math.PI; // pointe vers le bas
  arrow.castShadow = false;

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 8, 20), material);
  ring.position.y = 0.45;
  ring.rotation.x = Math.PI / 2;

  group.add(arrow, ring);
  return group;
}

function createNpcMesh(material: THREE.MeshStandardMaterial): THREE.Group {
  const group = new THREE.Group();
  const fallback = new THREE.Group();
  fallback.userData["fallback"] = true;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.76, 6, 12), material);
  body.position.y = 0.9;
  body.castShadow = true;

  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.035, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xffe3a3, roughness: 0.35 })
  );
  marker.position.y = 0.05;
  marker.rotation.x = Math.PI / 2;

  fallback.add(body);
  group.add(fallback, marker);
  return group;
}
