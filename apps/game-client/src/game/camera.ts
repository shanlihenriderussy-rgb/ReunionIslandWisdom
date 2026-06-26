import * as THREE from "three";

// Cadrage exploration : assez haut pour lire lagon + relief sans couper dans la vegetation.
const desktopCameraOffset = new THREE.Vector3(0, 5.1, 7.4);
const mobileCameraOffset = new THREE.Vector3(0, 4.3, 5.2);
const desktopLookAtHeight = 1.35;
const mobileLookAtHeight = 1.18;

export function updateFollowCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Object3D,
  cameraYaw: number,
  delta: number,
  zoom: number
): void {
  const isPortrait = camera.aspect < 0.75;
  const cameraOffset = isPortrait ? mobileCameraOffset : desktopCameraOffset;
  const lookAtHeight = isPortrait ? mobileLookAtHeight : desktopLookAtHeight;
  // Butee basse remontee (0.58 -> 0.85) : la camera n'entre plus dans le personnage au zoom min.
  const distanceMultiplier = isPortrait ? THREE.MathUtils.lerp(0.72, 1.55, zoom) : THREE.MathUtils.lerp(0.85, 2.0, zoom);
  const rotatedOffset = cameraOffset
    .clone()
    .multiplyScalar(distanceMultiplier)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
  const targetPosition = target.position.clone().add(rotatedOffset);
  // Lerp adouci (7 -> 5.5) : moins de pompage de camera a 30 fps mobile.
  camera.position.lerp(targetPosition, Math.min(1, delta * 5.5));
  camera.lookAt(target.position.x, target.position.y + lookAtHeight, target.position.z);
}
