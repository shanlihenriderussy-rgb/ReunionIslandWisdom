import * as THREE from "three";

const cameraOffset = new THREE.Vector3(0, 4.8, 7.2);
const lookAtHeight = 1.28;

export function updateFollowCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Object3D,
  cameraYaw: number,
  delta: number,
  zoom: number
): void {
  const distanceMultiplier = THREE.MathUtils.lerp(0.58, 2.25, zoom);
  const rotatedOffset = cameraOffset
    .clone()
    .multiplyScalar(distanceMultiplier)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
  const targetPosition = target.position.clone().add(rotatedOffset);
  camera.position.lerp(targetPosition, Math.min(1, delta * 7));
  camera.lookAt(target.position.x, target.position.y + lookAtHeight, target.position.z);
}
