import { kenneyAssets } from "@riw/assets";
import { WEST_BLOCKOUT_PATH, WEST_BLOCKOUT_BOUNDARY_MARKERS } from "./westBlockout";

// Generateur de vegetation SEEDE et DETERMINISTE pour la zone ouest Saint-Paul / Saint-Gilles.
// Decisions Shan (2026-06-06) : repartir de zero, densite luxuriante, barrieres naturelles,
// ancrage auto sur le heightfield (fait au rendu), colliders serres sur la base reelle.
//
// Ce module ne produit que des CANDIDATS (data pure). Le rendu (render/westVegetation.ts)
// echantillonne la hauteur terrain, filtre eau/pente/corridor, pose et pousse les colliders.

export type VegCandidate = {
  id: string;
  url: string;
  x: number;
  z: number;
  height: number; // hauteur cible du modele (unites monde)
  rot: number;
  colliderRadius: number; // base reelle serree (tronc/rocher), pas l'emprise visuelle
  // Corridor: distance min au chemin sous laquelle on rejette (garde le chemin praticable).
  pathClearance: number;
};

// Espece = gabarit. colliderRadius volontairement serre sur la base physique.
type Species = {
  urls: readonly string[];
  minH: number;
  maxH: number;
  collider: number;
  pathClearance: number;
};

type SpeciesKey = keyof typeof SPECIES;
type VegetationBand = "coast" | "maidoMid" | "maidoRim";

const SPECIES = {
  // Canopee : grands palmiers/arbres. Tronc fin -> collider serre.
  canopy: {
    urls: [
      kenneyAssets.pirate.palmDetailedStraight,
      kenneyAssets.pirate.palmBend,
      kenneyAssets.pirate.palmStraight,
      kenneyAssets.nature.palmDetailedTall,
      kenneyAssets.nature.treePalm,
      kenneyAssets.nature.treeDetailed
    ],
    minH: 3.4,
    maxH: 5.2,
    collider: 0.28,
    pathClearance: 1.6
  },
  // Sous-bois : buissons. Petit collider.
  bush: {
    urls: [kenneyAssets.nature.plantBush, kenneyAssets.nature.plantBushLarge],
    minH: 0.7,
    maxH: 1.2,
    collider: 0.22,
    pathClearance: 1.1
  },
  // Tapis : herbes/fleurs. Collider tres serre (on les frole sans blocage notable).
  ground: {
    urls: [
      kenneyAssets.nature.grassLarge,
      kenneyAssets.nature.grassLeafsLarge,
      kenneyAssets.nature.flowerRedA
    ],
    minH: 0.42,
    maxH: 0.78,
    collider: 0.14,
    pathClearance: 0.7
  },
  // Rochers cotiers : emprise = leur largeur reelle.
  rock: {
    urls: [
      kenneyAssets.pirate.rocksSandA,
      kenneyAssets.pirate.rocksSandB,
      kenneyAssets.pirate.rocksSandC
    ],
    minH: 1.1,
    maxH: 1.8,
    collider: 0.75,
    pathClearance: 1.4
  },
  // Mi-hauteur Maido : plus de vegetation de hauts, moins de palmiers/plage.
  uplandTree: {
    urls: [kenneyAssets.nature.treeDetailed, kenneyAssets.survival.tree, kenneyAssets.survival.treeTall],
    minH: 2.4,
    maxH: 3.8,
    collider: 0.28,
    pathClearance: 1.45
  },
  uplandBush: {
    urls: [kenneyAssets.nature.plantBush, kenneyAssets.nature.plantBushLarge],
    minH: 0.8,
    maxH: 1.45,
    collider: 0.24,
    pathClearance: 1.05
  },
  uplandGround: {
    urls: [kenneyAssets.nature.grassLarge, kenneyAssets.nature.grassLeafsLarge],
    minH: 0.48,
    maxH: 0.86,
    collider: 0.12,
    pathClearance: 0.72
  },
  uplandRock: {
    urls: [
      kenneyAssets.survival.rockA,
      kenneyAssets.survival.rockB,
      kenneyAssets.survival.rockC,
      kenneyAssets.survival.rockFlatGrass
    ],
    minH: 0.9,
    maxH: 1.55,
    collider: 0.58,
    pathClearance: 1.35
  }
} as const satisfies Record<string, Species>;

// PRNG deterministe (mulberry32) : meme seed => meme foret.
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

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)] as T;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getVegetationBand(x: number, z: number): VegetationBand {
  if (x >= -46 && z >= -5) {
    return "maidoRim";
  }
  if (x >= -56 && z >= -24) {
    return "maidoMid";
  }
  return "coast";
}

function pickSpeciesKey(rng: () => number, band: VegetationBand, nearPath: boolean): SpeciesKey {
  const roll = rng();

  if (band === "maidoRim") {
    if (nearPath) {
      return roll < 0.58 ? "uplandGround" : roll < 0.88 ? "uplandBush" : "uplandRock";
    }
    return roll < 0.34 ? "uplandBush" : roll < 0.62 ? "uplandRock" : roll < 0.82 ? "uplandGround" : "uplandTree";
  }

  if (band === "maidoMid") {
    if (nearPath) {
      return roll < 0.48 ? "uplandGround" : roll < 0.82 ? "uplandBush" : "uplandRock";
    }
    return roll < 0.34 ? "uplandBush" : roll < 0.56 ? "uplandTree" : roll < 0.82 ? "uplandRock" : "uplandGround";
  }

  if (nearPath) {
    return roll < 0.6 ? "ground" : "bush";
  }
  return roll < 0.45 ? "canopy" : roll < 0.72 ? "bush" : roll < 0.9 ? "ground" : "rock";
}

export const WEST_VEGETATION_SEED = 97431;

// Densite "luxuriante" : nombre de tentatives de pose par metre de chemin, par cote.
const SAMPLES_PER_UNIT = 0.9;
const SIDE_OFFSET_MIN = 2.2;
const SIDE_OFFSET_MAX = 13.0;

export function generateWestVegetation(seed: number = WEST_VEGETATION_SEED): VegCandidate[] {
  const rng = mulberry32(seed);
  const out: VegCandidate[] = [];
  let counter = 0;

  for (let s = 0; s < WEST_BLOCKOUT_PATH.length - 1; s += 1) {
    const a = WEST_BLOCKOUT_PATH[s];
    const b = WEST_BLOCKOUT_PATH[s + 1];
    if (!a || !b) {
      continue;
    }
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const segLen = Math.hypot(dx, dz);
    const tx = dx / segLen;
    const tz = dz / segLen;
    // Normale au segment (perpendiculaire) pour deporter de part et d'autre.
    const nx = -tz;
    const nz = tx;

    const samples = Math.max(1, Math.floor(segLen * SAMPLES_PER_UNIT));
    for (let i = 0; i < samples; i += 1) {
      const t = (i + rng()) / samples;
      const baseX = a.x + dx * t;
      const baseZ = a.z + dz * t;
      const band = getVegetationBand(baseX, baseZ);

      // Deux cotes du chemin, densite luxuriante => 1 a 2 props par cote et par sample.
      for (const side of [-1, 1] as const) {
        const clusterCount = band === "maidoRim" ? 1 : 1 + Math.floor(rng() * 2);
        for (let c = 0; c < clusterCount; c += 1) {
          const offset = lerp(SIDE_OFFSET_MIN, SIDE_OFFSET_MAX, rng() * rng());
          const jitterX = (rng() - 0.5) * 1.6;
          const jitterZ = (rng() - 0.5) * 1.6;
          const x = baseX + nx * side * offset + jitterX;
          const z = baseZ + nz * side * offset + jitterZ;

          // Choix d'espece selon l'eloignement du chemin + etage de vegetation.
          const near = offset < 5;
          const key = pickSpeciesKey(rng, band, near);
          const sp = SPECIES[key];
          counter += 1;
          out.push({
            id: `westveg-${key}-${counter}`,
            url: pick(rng, sp.urls),
            x: Number(x.toFixed(2)),
            z: Number(z.toFixed(2)),
            height: Number(lerp(sp.minH, sp.maxH, rng()).toFixed(2)),
            rot: Number((rng() * Math.PI * 2).toFixed(3)),
            colliderRadius: sp.collider,
            pathClearance: sp.pathClearance
          });
        }
      }
    }
  }

  // Barrieres naturelles : gros rochers/falaises collisionnes sur les marqueurs de bord.
  // Forment une frontiere LISIBLE (cote mer, ravine, montee hauts).
  for (let i = 0; i < WEST_BLOCKOUT_BOUNDARY_MARKERS.length; i += 1) {
    const m = WEST_BLOCKOUT_BOUNDARY_MARKERS[i];
    if (!m) {
      continue;
    }
    const big = rng() < 0.5;
    out.push({
      id: `westveg-barrier-${i}`,
      url: big ? kenneyAssets.pirate.rocksSandC : kenneyAssets.pirate.rocksSandB,
      x: m.x,
      z: m.z,
      height: big ? 1.8 : 1.25,
      rot: Number((rng() * Math.PI * 2).toFixed(3)),
      colliderRadius: big ? 1.05 : 0.78,
      pathClearance: 0 // barriere : pas de corridor, c'est une limite voulue
    });
  }

  return out;
}

// Centerline du chemin, pour rejeter ce qui tomberait dans le corridor praticable.
export const WEST_PATH_CENTERLINE = WEST_BLOCKOUT_PATH.map((p) => ({ x: p.x, z: p.z }));
