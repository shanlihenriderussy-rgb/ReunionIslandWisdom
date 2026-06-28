import * as THREE from "three";
import type { NetworkSnapshot } from "../network/NetworkClient";
import { sfx } from "../audio/sfx";

// Rendu des cibles PvE (combat). Procedural basalte/scorie volcanique
// (pas de GLB personnage : respect regle assets + DA Fournaise).
// Le serveur reste autoritaire ; ce module n'affiche que l'etat recu + le feedback de coup.

export type CombatantView = {
  mesh: THREE.Group;
  ember: THREE.MeshStandardMaterial;
  healthFill: THREE.Mesh;
  healthBar: THREE.Group;
  lastHealth: number;
  lastAlive: boolean;
  hitFlashUntil: number;
  deadAnimUntil: number;
};

const basaltColor = 0x2b2622;
const emberColor = 0xff5a2a;
const healthFull = new THREE.Color(0x6fcf5f);
const healthLow = new THREE.Color(0xe2473a);
const barWidth = 0.8;
const barY = 1.05;
const hitFlashMs = 130;
const deathAnimMs = 260;

export function syncCombatants(
  scene: THREE.Scene,
  views: Map<string, CombatantView>,
  snapshot: NetworkSnapshot,
  sampleGroundY: (x: number, z: number) => number,
  camera: THREE.Camera
): void {
  const now = performance.now();
  const seen = new Set<string>();

  for (const target of snapshot.combatants) {
    seen.add(target.id);

    let view = views.get(target.id);
    const isNew = !view;
    if (!view) {
      view = createCombatantView();
      views.set(target.id, view);
      scene.add(view.mesh);
      view.lastHealth = target.health;
      view.lastAlive = target.alive;
    }

    view.mesh.position.set(target.x, sampleGroundY(target.x, target.z), target.z);

    // Transitions (jamais sur la frame de creation) -> feedback + son.
    if (!isNew) {
      if (target.alive && target.health < view.lastHealth) {
        view.hitFlashUntil = now + hitFlashMs;
        sfx.hit();
      }
      if (!target.alive && view.lastAlive) {
        view.deadAnimUntil = now + deathAnimMs;
        sfx.kill();
      }
    }
    view.lastHealth = target.health;
    view.lastAlive = target.alive;

    const ratio = target.maxHealth > 0 ? THREE.MathUtils.clamp(target.health / target.maxHealth, 0, 1) : 0;

    // Cible morte : courte anim (gonfle + s'efface) puis masquage.
    if (!target.alive) {
      view.healthBar.visible = false;
      if (now < view.deadAnimUntil) {
        const k = (view.deadAnimUntil - now) / deathAnimMs; // 1 -> 0
        view.mesh.visible = true;
        view.mesh.scale.setScalar(1 + (1 - k) * 0.5);
        view.ember.emissiveIntensity = 0.9 * k;
        view.ember.opacity = Math.max(0.05, k);
      } else {
        view.mesh.visible = false;
      }
      continue;
    }

    // Cible vivante.
    view.mesh.visible = true;
    view.ember.opacity = 1;
    const flash = Math.max(0, (view.hitFlashUntil - now) / hitFlashMs); // 1 -> 0
    view.mesh.scale.setScalar(1 + flash * 0.18);
    view.ember.emissiveIntensity = flash > 0 ? 0.6 + 0.8 * flash : 0.25 + 0.75 * ratio;

    // Barre de vie : visible seulement vivante et entamee, orientee camera.
    const showBar = ratio < 1;
    view.healthBar.visible = showBar;
    if (showBar) {
      view.healthFill.scale.x = Math.max(0.001, ratio);
      view.healthFill.position.x = -(barWidth / 2) * (1 - ratio);
      (view.healthFill.material as THREE.MeshBasicMaterial).color.copy(healthLow).lerp(healthFull, ratio);
      view.healthBar.quaternion.copy(camera.quaternion);
    }
  }

  for (const [id, view] of views) {
    if (seen.has(id)) {
      continue;
    }
    scene.remove(view.mesh);
    disposeView(view);
    views.delete(id);
  }
}

export function disposeCombatants(scene: THREE.Scene, views: Map<string, CombatantView>): void {
  for (const view of views.values()) {
    scene.remove(view.mesh);
    disposeView(view);
  }
  views.clear();
}

function createCombatantView(): CombatantView {
  const mesh = new THREE.Group();

  const ember = new THREE.MeshStandardMaterial({
    color: basaltColor,
    emissive: emberColor,
    emissiveIntensity: 1,
    roughness: 0.85,
    flatShading: true,
    transparent: true,
    opacity: 1
  });
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0), ember);
  body.position.y = 0.36;
  body.castShadow = true;

  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.34, 5), ember);
  crown.position.y = 0.74;
  crown.castShadow = true;

  mesh.add(body, crown);

  // Barre de vie (fond + remplissage), ancree a gauche pour se vider vers la droite.
  const healthBar = new THREE.Group();
  healthBar.position.y = barY;
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x14110f, depthTest: false, transparent: true, opacity: 0.85 });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(barWidth + 0.08, 0.14), bgMat);
  bg.renderOrder = 998;
  const fillMat = new THREE.MeshBasicMaterial({ color: healthFull.clone(), depthTest: false });
  const healthFill = new THREE.Mesh(new THREE.PlaneGeometry(barWidth, 0.1), fillMat);
  healthFill.renderOrder = 999;
  healthBar.add(bg, healthFill);
  healthBar.visible = false;

  mesh.add(healthBar);

  return { mesh, ember, healthFill, healthBar, lastHealth: 0, lastAlive: true, hitFlashUntil: 0, deadAnimUntil: 0 };
}

function disposeView(view: CombatantView): void {
  view.mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) {
        material.forEach((m) => m.dispose());
      } else {
        material.dispose();
      }
    }
  });
}
