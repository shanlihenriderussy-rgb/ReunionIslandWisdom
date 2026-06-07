import * as THREE from "three";
import { kenneyAssets } from "@riw/assets";
import type { NetworkSnapshot } from "../network/NetworkClient";
import { attachGltf, CHARACTER_YAW_OFFSET, updateAnimationController } from "./gltf";

export type RemotePlayerView = {
  mesh: THREE.Group;
  nameTag: HTMLDivElement;
  lastPosition: THREE.Vector3;
};

const localPlayerColor = 0xf2c66d;
const remotePlayerColor = 0x6bc9b5;
const playerHeight = 0.72;
const visualRootKey = "playerVisualRoot";

export function createLocalPlayerMesh(): THREE.Group {
  const group = createPlayerMesh(localPlayerColor, true);
  attachGltf(group, kenneyAssets.characters.maleC, {
    targetHeight: playerHeight,
    yawOffset: CHARACTER_YAW_OFFSET,
    hideFallback: true,
    userDataKey: visualRootKey
  });
  return group;
}

export function syncRemotePlayers(
  scene: THREE.Scene,
  hudElement: HTMLElement,
  remotePlayers: Map<string, RemotePlayerView>,
  snapshot: NetworkSnapshot,
  localPlayerId: string | null,
  localPlayer: THREE.Group,
  delta: number
): void {
  const seen = new Set<string>();

  for (const player of snapshot.players) {
    seen.add(player.id);
    if (player.id === localPlayerId) {
      continue;
    }

    let view = remotePlayers.get(player.id);
    if (!view) {
      const mesh = createPlayerMesh(remotePlayerColor, false);
      attachGltf(mesh, kenneyAssets.characters.femaleA, {
        targetHeight: playerHeight,
        yawOffset: CHARACTER_YAW_OFFSET,
        hideFallback: true,
        userDataKey: visualRootKey
      });
      const nameTag = document.createElement("div");
      nameTag.className = "chat-line nametag";
      nameTag.textContent = player.name;
      hudElement.append(nameTag);
      view = { mesh, nameTag, lastPosition: mesh.position.clone() };
      remotePlayers.set(player.id, view);
      scene.add(mesh);
    }

    view.mesh.position.lerp(new THREE.Vector3(player.x, player.y, player.z), 0.5);
    view.mesh.rotation.y = player.yaw;
    const moved = view.mesh.position.distanceToSquared(view.lastPosition) > 0.0004;
    updatePlayerWalkAnimation(view.mesh, delta, moved);
    view.lastPosition.copy(view.mesh.position);
  }

  for (const [id, view] of remotePlayers) {
    if (seen.has(id)) {
      continue;
    }

    scene.remove(view.mesh);
    view.nameTag.remove();
    remotePlayers.delete(id);
  }
}

export function updateNameTags(
  remotePlayers: Map<string, RemotePlayerView>,
  camera: THREE.Camera,
  width: number,
  height: number
): void {
  for (const view of remotePlayers.values()) {
    const position = view.mesh.position.clone();
    position.y += 0.95;
    position.project(camera);

    const x = (position.x * 0.5 + 0.5) * width;
    const y = (-position.y * 0.5 + 0.5) * height;
    view.nameTag.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
  }
}

export function updatePlayerWalkAnimation(playerMesh: THREE.Group, delta: number, moving: boolean): void {
  if (updateAnimationController(playerMesh, delta, moving)) {
    return;
  }

  const visualRoot = getVisualRoot(playerMesh);
  const fallback = getFallbackRoot(playerMesh);
  const target = visualRoot ?? fallback;
  if (!target) {
    return;
  }

  const baseY = getBaseY(target);
  if (!moving) {
    target.position.y = THREE.MathUtils.lerp(target.position.y, baseY, 0.22);
    target.rotation.x = THREE.MathUtils.lerp(target.rotation.x, 0, 0.18);
    target.rotation.z = THREE.MathUtils.lerp(target.rotation.z, 0, 0.18);
    return;
  }

  const elapsed = performance.now() / 1000;
  const stride = Math.sin(elapsed * 13);
  target.position.y = baseY + Math.abs(stride) * 0.16;
  target.rotation.x = stride * 0.14;
  target.rotation.z = Math.sin(elapsed * 6.5) * 0.18;
}

function getVisualRoot(playerMesh: THREE.Group): THREE.Object3D | null {
  const visualRoot = playerMesh.userData[visualRootKey];
  return visualRoot instanceof THREE.Object3D ? visualRoot : null;
}

function getFallbackRoot(playerMesh: THREE.Group): THREE.Object3D | null {
  return playerMesh.children.find((child) => child.userData["fallback"] === true) ?? null;
}

function getBaseY(target: THREE.Object3D): number {
  const baseY = target.userData["baseY"];
  if (typeof baseY === "number") {
    return baseY;
  }

  target.userData["baseY"] = target.position.y;
  return target.position.y;
}

function createPlayerMesh(color: number, isLocal: boolean): THREE.Group {
  const group = new THREE.Group();
  const fallback = new THREE.Group();
  fallback.userData["fallback"] = true;
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.13, 0.3, 6, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.65 })
  );
  body.position.y = 0.34;
  body.castShadow = true;

  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0x1f2721, roughness: 0.8 })
  );
  hat.position.y = 0.66;
  hat.castShadow = true;

  fallback.add(body, hat);
  group.add(fallback);

  if (isLocal) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.018, 8, 36),
      new THREE.MeshStandardMaterial({
        color: 0xffe3a3,
        emissive: 0x4a3500,
        roughness: 0.35
      })
    );
    ring.position.y = 0.035;
    ring.rotation.x = Math.PI / 2;
    ring.userData["localMarker"] = true;

    const direction = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.18, 3),
      new THREE.MeshStandardMaterial({
        color: 0xffe3a3,
        emissive: 0x4a3500,
        roughness: 0.35
      })
    );
    direction.position.set(0, 0.055, 0.36);
    direction.rotation.x = Math.PI / 2;
    direction.userData["localMarker"] = true;

    group.add(ring, direction);
  }

  return group;
}
