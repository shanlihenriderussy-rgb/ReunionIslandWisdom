import * as THREE from "three";
import { terrainAssets } from "@riw/assets";
import type { WalkableSurface } from "../game/collision";

// Embarcadere generique (jetee blockout) ancre au littoral est, pres de (65, 33).
// Demande explicite Shan 2026-06-28. Pas de personnage, pas d'asset externe :
// geometrie procedurale low-poly (pieux + tablier + ponton en T), style DA tropical.
// Collision runtime : tablier + ponton sont declares comme surfaces marchables.

type CoastPoint = { x: number; z: number };
type CoastPlacement = { point: CoastPoint; forward: CoastPoint };
export type WalkableSurfaceSink = (surfaces: readonly WalkableSurface[]) => void;

type TerrainCollisionData = {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  gridX: number;
  gridZ: number;
  heights: number[];
  outline: CoastPoint[];
};

// Ancre cote terre : la jetee part de la cote la plus proche de ce point.
const EMBARCADERE_ANCHOR: CoastPoint = { x: 65, z: 33 };

const DECK_TOP_Y = 0.8; // m : se raccorde a la berge (terrain ~0.83) et file au-dessus du plan ocean (-0.38)
const DECK_LENGTH = 18; // m vers le large
const DECK_WIDTH = 3.2;
const DECK_THICKNESS = 0.18;
const PILE_RADIUS = 0.16;
const PILE_BOTTOM_Y = -0.7; // s'enfonce sous le plan ocean
const HEAD_WIDTH = 6.5; // largeur du ponton en T
const HEAD_DEPTH = 4;

const deckColor = 0xb07f4c;
const headColor = 0xa9763f;
const pileColor = 0x6e4a2a;
const railColor = 0x835432;
const postColor = 0x5a3c22;

export function addEmbarcadere(scene: THREE.Scene, onWalkableSurfaces: WalkableSurfaceSink = () => {}): void {
  void fetch(terrainAssets.laReunion.reliefCollision)
    .then((response) => (response.ok ? response.json() : null))
    .then((terrain: TerrainCollisionData | null) => {
      if (!terrain || !Array.isArray(terrain.outline) || terrain.outline.length < 3) {
        return;
      }
      const placement = anchorToCoast(terrain, EMBARCADERE_ANCHOR);
      scene.add(buildEmbarcadere(placement));
      onWalkableSurfaces(createEmbarcadereWalkableSurfaces(placement));
    })
    .catch((error: unknown) => {
      console.warn("Embarcadere generation failed", error);
    });
}

function buildEmbarcadere({ point, forward }: CoastPlacement): THREE.Group {
  const group = new THREE.Group();
  group.name = "Embarcadere_Generic";
  group.position.set(point.x, 0, point.z);
  // Repere local : +Z = vers le large, +X = lateral.
  group.rotation.y = Math.atan2(forward.x, forward.z);

  const deckMat = new THREE.MeshStandardMaterial({ color: deckColor, roughness: 0.82, metalness: 0 });
  const headMat = new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.82, metalness: 0 });
  const pileMat = new THREE.MeshStandardMaterial({ color: pileColor, roughness: 0.9, metalness: 0 });
  const railMat = new THREE.MeshStandardMaterial({ color: railColor, roughness: 0.85, metalness: 0 });
  const postMat = new THREE.MeshStandardMaterial({ color: postColor, roughness: 0.88, metalness: 0 });

  // Tablier principal (part ~1 m dans la terre, file vers le large).
  const deck = new THREE.Mesh(new THREE.BoxGeometry(DECK_WIDTH, DECK_THICKNESS, DECK_LENGTH), deckMat);
  deck.position.set(0, DECK_TOP_Y, DECK_LENGTH / 2 - 1);
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // Ponton en T au bout (debarcadere).
  const head = new THREE.Mesh(new THREE.BoxGeometry(HEAD_WIDTH, DECK_THICKNESS, HEAD_DEPTH), headMat);
  head.position.set(0, DECK_TOP_Y, DECK_LENGTH - 1);
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  // Pieux du tablier.
  const pileTop = DECK_TOP_Y - DECK_THICKNESS / 2;
  for (const z of [0, 3, 6, 9, 12, 15]) {
    for (const x of [-DECK_WIDTH / 2 + 0.3, DECK_WIDTH / 2 - 0.3]) {
      group.add(makePile(x, z, pileTop, pileMat));
    }
  }
  // Pieux du ponton en T (4 coins).
  for (const z of [DECK_LENGTH - 1 - HEAD_DEPTH / 2 + 0.5, DECK_LENGTH - 1 + HEAD_DEPTH / 2 - 0.5]) {
    for (const x of [-HEAD_WIDTH / 2 + 0.5, HEAD_WIDTH / 2 - 0.5]) {
      group.add(makePile(x, z, pileTop, pileMat));
    }
  }

  // Bittes d'amarrage aux coins large du ponton.
  for (const x of [-HEAD_WIDTH / 2 + 0.5, HEAD_WIDTH / 2 - 0.5]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1, 8), postMat);
    post.position.set(x, DECK_TOP_Y + 0.5, DECK_LENGTH - 1 + HEAD_DEPTH / 2 - 0.5);
    post.castShadow = true;
    group.add(post);
  }

  // Garde-corps lateraux du tablier (du bord terre jusqu'avant le ponton).
  const railLength = DECK_LENGTH - 4;
  const railZ = railLength / 2 - 1;
  for (const x of [-DECK_WIDTH / 2 + 0.1, DECK_WIDTH / 2 - 0.1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, railLength), railMat);
    rail.position.set(x, DECK_TOP_Y + 0.42, railZ);
    rail.castShadow = true;
    group.add(rail);
  }

  return group;
}

function createEmbarcadereWalkableSurfaces({ point, forward }: CoastPlacement): WalkableSurface[] {
  const yaw = Math.atan2(forward.x, forward.z);
  const deckCenter = localToWorld(point, forward, 0, DECK_LENGTH / 2 - 1);
  const headCenter = localToWorld(point, forward, 0, DECK_LENGTH - 1);
  const topY = DECK_TOP_Y + DECK_THICKNESS / 2;

  return [
    {
      kind: "rect",
      id: "embarcadere-deck",
      x: deckCenter.x,
      z: deckCenter.z,
      width: DECK_WIDTH - 0.45,
      depth: DECK_LENGTH,
      yaw,
      topY
    },
    {
      kind: "rect",
      id: "embarcadere-head",
      x: headCenter.x,
      z: headCenter.z,
      width: HEAD_WIDTH - 0.4,
      depth: HEAD_DEPTH - 0.25,
      yaw,
      topY
    }
  ];
}

function localToWorld(origin: CoastPoint, forward: CoastPoint, localX: number, localZ: number): CoastPoint {
  const side = { x: forward.z, z: -forward.x };
  return {
    x: origin.x + side.x * localX + forward.x * localZ,
    z: origin.z + side.z * localX + forward.z * localZ
  };
}

function makePile(x: number, z: number, topY: number, material: THREE.Material): THREE.Mesh {
  const height = topY - PILE_BOTTOM_Y;
  const pile = new THREE.Mesh(new THREE.CylinderGeometry(PILE_RADIUS, PILE_RADIUS, height, 8), material);
  pile.position.set(x, PILE_BOTTOM_Y + height / 2, z);
  pile.castShadow = true;
  pile.receiveShadow = true;
  return pile;
}

// Trouve la cote la plus proche de l'ancre + la normale unitaire vers le large.
function anchorToCoast(
  terrain: TerrainCollisionData,
  anchor: CoastPoint
): { point: CoastPoint; forward: CoastPoint } {
  const { outline } = terrain;
  let bestIndex = 0;
  let bestDist = Infinity;
  let bestX = anchor.x;
  let bestZ = anchor.z;
  for (let i = 0; i < outline.length; i += 1) {
    const a = outline[i];
    const b = outline[(i + 1) % outline.length];
    if (!a || !b) {
      continue;
    }
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const len2 = abx * abx + abz * abz || 1e-9;
    let t = ((anchor.x - a.x) * abx + (anchor.z - a.z) * abz) / len2;
    t = THREE.MathUtils.clamp(t, 0, 1);
    const qx = a.x + abx * t;
    const qz = a.z + abz * t;
    const dx = anchor.x - qx;
    const dz = anchor.z - qz;
    const dist = dx * dx + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
      bestX = qx;
      bestZ = qz;
    }
  }

  const a = outline[bestIndex];
  const b = outline[(bestIndex + 1) % outline.length];
  let tx = (b?.x ?? bestX) - (a?.x ?? bestX);
  let tz = (b?.z ?? bestZ) - (a?.z ?? bestZ);
  const tl = Math.hypot(tx, tz) || 1;
  tx /= tl;
  tz /= tl;
  // Deux normales possibles ; on garde celle qui pointe hors de l'ile (cote ocean).
  const n1 = { x: -tz, z: tx };
  const n2 = { x: tz, z: -tx };
  const probe = 2.5;
  const out1 = !pointInPolygon(bestX + n1.x * probe, bestZ + n1.z * probe, outline);
  const forward = out1 ? n1 : n2;

  return { point: { x: bestX, z: bestZ }, forward };
}

function pointInPolygon(x: number, z: number, polygon: readonly CoastPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if (!a || !b) {
      continue;
    }
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}
