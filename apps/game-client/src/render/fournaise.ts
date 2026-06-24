import * as THREE from "three";
import { terrainAssets } from "@riw/assets";

// Props PROCEDURAUX de la zone de depart Piton de la Fournaise.
// Regles DA (docs/obsidian/09-direction-artistique.md) :
// - aucun asset Kenney / externe ici : geometrie low-poly generee ;
// - basalte sombre + scories rougeatres, palette volcan ;
// - props lies au gameplay (3 reperes d'objectif) + lisibilite, pas de semis random ;
// - tout est ancre sur le heightfield de collision (meme espace monde que le joueur).
//
// Sommet RGE ALTI verifie : 2610 m a world (65.9, -37). Cratere Dolomieu autour.

type TerrainCollisionData = {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  gridX: number;
  gridZ: number;
  heights: number[];
};

// Ancre zone (rebord nord du cratere, = spawn) et centre cratere.
const CRATER_CENTER = new THREE.Vector2(65.9, -39);
const RIM_RADIUS = 7.2;
const SCATTER_RADIUS = 16;
const SCATTER_COUNT = 26;
const RIM_ROCK_COUNT = 18;
const SCATTER_SEED = 0xf0c12a;

// Fumerolles : vapeur du volcan actif. Lisibilite zone volcanique + ambiance.
const FUMAROLE_COUNT = 5;
const FUMAROLE_RING = RIM_RADIUS * 0.72;
const FUMAROLE_SEED = 0x3b9a17;

const basaltDark = 0x2c2826;
const basaltMid = 0x403a36;
const scoriaRed = 0x6e3b2f;
const steamPale = 0xcfc9c4;
const markerInk = 0xd8c8b0;

export function addFournaiseBlockout(scene: THREE.Scene): void {
  void fetch(terrainAssets.laReunion.reliefCollision)
    .then((response) => (response.ok ? response.json() : null))
    .then((terrain: TerrainCollisionData | null) => {
      if (!terrain) {
        return;
      }

      const group = new THREE.Group();
      group.name = "Blockout_PitonFournaise";

      // 1) Anneau de rochers de basalte autour du rebord du cratere.
      for (let i = 0; i < RIM_ROCK_COUNT; i += 1) {
        const angle = (i / RIM_ROCK_COUNT) * Math.PI * 2;
        const jitter = 0.82 + (hash01(i * 13.13) * 0.4);
        const x = CRATER_CENTER.x + Math.cos(angle) * RIM_RADIUS * jitter;
        const z = CRATER_CENTER.y + Math.sin(angle) * RIM_RADIUS * jitter;
        const scale = 0.6 + hash01(i * 7.7) * 0.7;
        group.add(makeRock(x, z, terrain, scale, i % 5 === 0 ? scoriaRed : basaltDark, i));
      }

      // 2) Scories dispersees (seedees) pour la lisibilite du champ de lave.
      const rng = mulberry32(SCATTER_SEED);
      for (let i = 0; i < SCATTER_COUNT; i += 1) {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * SCATTER_RADIUS;
        const x = CRATER_CENTER.x + Math.cos(a) * r;
        const z = CRATER_CENTER.y + Math.sin(a) * r;
        // Evite de remplir le centre du cratere (creux).
        if (Math.hypot(x - CRATER_CENTER.x, z - CRATER_CENTER.y) < RIM_RADIUS * 0.55) {
          continue;
        }
        const scale = 0.28 + rng() * 0.5;
        const color = rng() < 0.25 ? scoriaRed : rng() < 0.5 ? basaltMid : basaltDark;
        group.add(makeRock(x, z, terrain, scale, color, i + 100));
      }

      // 3) Fumerolles (vapeur volcan actif), anneau interieur seede, centre evite.
      const frng = mulberry32(FUMAROLE_SEED);
      for (let i = 0; i < FUMAROLE_COUNT; i += 1) {
        const a = frng() * Math.PI * 2;
        const r = FUMAROLE_RING * (0.85 + frng() * 0.3);
        const x = CRATER_CENTER.x + Math.cos(a) * r;
        const z = CRATER_CENTER.y + Math.sin(a) * r;
        group.add(makeFumarole(x, z, terrain, 0.7 + frng() * 0.6, i + 200));
      }

      // 4) Reperes d'objectif (volumes lisibles, lies au HUD).
      // Obj 1 : rebord Dolomieu (= spawn).
      group.add(makeCairn(65.9, -35, terrain, "Rebord Dolomieu"));
      // Obj 2 : cone central (sommet).
      group.add(makeConeMarker(65.9, -37, terrain));
      // Obj 3 : point de vue Piton des Neiges (oriente nord-ouest).
      group.add(makeSightMarker(63, -33, terrain, new THREE.Vector2(-1, 1)));

      scene.add(group);
    })
    .catch((error: unknown) => {
      console.warn("Fournaise blockout generation failed", error);
    });
}

// --- Geometrie procedurale ---

function makeRock(
  x: number,
  z: number,
  terrain: TerrainCollisionData,
  scale: number,
  color: number,
  seed: number
): THREE.Mesh {
  const geometry = new THREE.IcosahedronGeometry(scale, 0);
  // Deforme legerement les sommets pour casser la regularite (look scorie).
  const pos = geometry.getAttribute("position");
  for (let i = 0; i < pos.count; i += 1) {
    const d = 0.78 + hash01(seed * 3.1 + i) * 0.44;
    pos.setXYZ(i, pos.getX(i) * d, pos.getY(i) * d * 0.85, pos.getZ(i) * d);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.98, metalness: 0.02, flatShading: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, sampleHeight(terrain, x, z) + scale * 0.45, z);
  mesh.rotation.y = hash01(seed * 1.7) * Math.PI * 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = "FournaiseRock";
  return mesh;
}

function makeCairn(x: number, z: number, terrain: TerrainCollisionData, label: string): THREE.Group {
  const g = new THREE.Group();
  g.name = `FournaiseCairn_${label}`;
  const y = sampleHeight(terrain, x, z);
  let stackY = 0;
  for (let i = 0; i < 3; i += 1) {
    const s = 0.7 - i * 0.18;
    const block = new THREE.Mesh(
      new THREE.DodecahedronGeometry(s, 0),
      new THREE.MeshStandardMaterial({ color: basaltMid, roughness: 0.95, flatShading: true })
    );
    block.position.set((hash01(i) - 0.5) * 0.18, stackY + s * 0.6, (hash01(i + 9) - 0.5) * 0.18);
    block.castShadow = true;
    g.add(block);
    stackY += s * 1.1;
  }
  g.position.set(x, y, z);
  return g;
}

function makeConeMarker(x: number, z: number, terrain: TerrainCollisionData): THREE.Group {
  const g = new THREE.Group();
  g.name = "FournaiseConeMarker";
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(2.1, 3.2, 7),
    new THREE.MeshStandardMaterial({ color: basaltDark, roughness: 0.98, flatShading: true })
  );
  cone.position.y = 1.6;
  cone.castShadow = true;
  cone.receiveShadow = true;
  g.add(cone);
  // Anneau de scorie a la base.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.22, 6, 16),
    new THREE.MeshStandardMaterial({ color: scoriaRed, roughness: 0.95, flatShading: true })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.18;
  g.add(ring);
  g.position.set(x, sampleHeight(terrain, x, z), z);
  return g;
}

function makeSightMarker(
  x: number,
  z: number,
  terrain: TerrainCollisionData,
  dir: THREE.Vector2
): THREE.Group {
  const g = new THREE.Group();
  g.name = "FournaiseSightMarker";
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 2.2, 6),
    new THREE.MeshStandardMaterial({ color: basaltMid, roughness: 0.9, flatShading: true })
  );
  post.position.y = 1.1;
  post.castShadow = true;
  g.add(post);
  // Fleche d'orientation (vers Piton des Neiges, nord-ouest).
  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.9, 5),
    new THREE.MeshStandardMaterial({ color: markerInk, roughness: 0.7, flatShading: true })
  );
  const d = dir.clone().normalize();
  arrow.position.set(d.x * 0.7, 2.0, d.y * 0.7);
  arrow.rotation.z = -Math.atan2(d.y, d.x) - Math.PI / 2;
  arrow.rotation.y = Math.atan2(d.x, d.y);
  g.add(arrow);
  g.position.set(x, sampleHeight(terrain, x, z), z);
  return g;
}

// Fumerolle : petit event basalte + bouffees de vapeur empilees (low-poly, statique).
function makeFumarole(
  x: number,
  z: number,
  terrain: TerrainCollisionData,
  scale: number,
  seed: number
): THREE.Group {
  const g = new THREE.Group();
  g.name = "FournaiseFumarole";

  // Event basalte a la base.
  const vent = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * scale, 0.34 * scale, 0.3 * scale, 6),
    new THREE.MeshStandardMaterial({ color: basaltDark, roughness: 0.98, flatShading: true })
  );
  vent.position.y = 0.15 * scale;
  vent.castShadow = true;
  g.add(vent);

  // 3 bouffees de vapeur : montent, grossissent puis se dissipent.
  let puffY = 0.4 * scale;
  for (let i = 0; i < 3; i += 1) {
    const s = (0.32 + i * 0.16) * scale;
    const puffMat = new THREE.MeshStandardMaterial({ color: steamPale, roughness: 1, flatShading: true, transparent: true, opacity: 0.5 - i * 0.12 });
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), puffMat);
    puff.position.set((hash01(seed + i) - 0.5) * 0.3 * scale, puffY, (hash01(seed + i + 5) - 0.5) * 0.3 * scale);
    g.add(puff);
    puffY += s * 1.1;
  }

  g.position.set(x, sampleHeight(terrain, x, z), z);
  return g;
}

// --- Helpers ---

// Echantillonnage bilineaire de la hauteur terrain en coordonnees monde.
function sampleHeight(terrain: TerrainCollisionData, x: number, z: number): number {
  const { bounds, gridX, gridZ, heights } = terrain;
  const u = ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * (gridX - 1);
  const v = ((z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * (gridZ - 1);
  const i0 = clampInt(Math.floor(u), 0, gridX - 1);
  const j0 = clampInt(Math.floor(v), 0, gridZ - 1);
  const i1 = clampInt(i0 + 1, 0, gridX - 1);
  const j1 = clampInt(j0 + 1, 0, gridZ - 1);
  const fx = u - i0;
  const fz = v - j0;
  const h00 = heightAt(heights, j0 * gridX + i0);
  const h10 = heightAt(heights, j0 * gridX + i1);
  const h01 = heightAt(heights, j1 * gridX + i0);
  const h11 = heightAt(heights, j1 * gridX + i1);
  const a = h00 + (h10 - h00) * fx;
  const b = h01 + (h11 - h01) * fx;
  return a + (b - a) * fz;
}

function heightAt(heights: number[], index: number): number {
  const h = heights[index];
  return typeof h === "number" && Number.isFinite(h) ? h : 0;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// RNG deterministe (scatter reproductible).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash01(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}
