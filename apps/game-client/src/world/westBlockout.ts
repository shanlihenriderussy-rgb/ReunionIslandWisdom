export type BlockoutPoint = {
  x: number;
  z: number;
  label: string;
};

export type BlockoutMarker = BlockoutPoint & {
  id: string;
  color: number;
};

export type BlockoutCollider = {
  kind: "circle";
  x: number;
  z: number;
  radius: number;
};

export const WEST_BLOCKOUT_SPAWN = {
  x: -78,
  y: 1.38,
  z: 6,
  yaw: -0.45
} as const;

export const WEST_BLOCKOUT_PATH = [
  { x: -83, z: 21, label: "Belvedere lagon" },
  { x: -80, z: 16, label: "Entree nord plage" },
  { x: -77, z: 7, label: "Spawn Saint-Paul" },
  { x: -73, z: -4, label: "Snack / marche" },
  { x: -70, z: -16, label: "Chauffeur Car Jaune" },
  { x: -66, z: -28, label: "Ravine basse" },
  { x: -60, z: -36, label: "Sortie sud Saint-Gilles" },
  { x: -60, z: -32, label: "Entree ravine des hauts" },
  { x: -58, z: -28, label: "Montee ravine" },
  { x: -54, z: -24, label: "Lacet des hauts" },
  { x: -54, z: -20, label: "Epaule des remparts" },
  { x: -52, z: -16, label: "Traverse montagne" },
  { x: -50, z: -12, label: "Rampe du Maido" },
  { x: -50, z: -8, label: "Sentier belvedere" },
  { x: -46, z: -4, label: "Crete ouest" },
  { x: -44, z: 0, label: "Approche Maido" },
  { x: -40, z: 4, label: "Rempart Mafate" },
  { x: -36, z: 8, label: "Point de vue Maido / Mafate" }
] as const satisfies readonly BlockoutPoint[];

export const WEST_BLOCKOUT_QUEST_MARKERS = [
  { id: "lagon-lookout", label: "Lire le lagon", x: -83, z: 21, color: 0x31c6d4 },
  { id: "snack-start", label: "Depart snack", x: -78, z: 6, color: 0xf2c66d },
  { id: "car-jaune-stop", label: "Car Jaune", x: -70, z: -16, color: 0xf4c430 },
  { id: "ravine-gate", label: "Limite ravine", x: -66, z: -28, color: 0x67c26f },
  { id: "south-exit", label: "Sortie sud", x: -60, z: -36, color: 0xe05f42 },
  { id: "maido-viewpoint", label: "Maido -> Mafate", x: -36, z: 8, color: 0x8fd06a }
] as const satisfies readonly BlockoutMarker[];

export const WEST_BLOCKOUT_BOUNDARY_MARKERS = [
  { id: "coast-rock-01", label: "Limite cote", x: -84, z: 13, color: 0x4d5048 },
  { id: "coast-rock-02", label: "Limite cote", x: -82, z: 8, color: 0x4d5048 },
  { id: "coast-rock-03", label: "Limite cote", x: -76, z: -10, color: 0x4d5048 },
  { id: "ravine-rock-01", label: "Limite ravine", x: -64, z: -8, color: 0x3e7140 },
  { id: "ravine-rock-02", label: "Limite ravine", x: -62, z: -18, color: 0x3e7140 },
  { id: "ravine-rock-03", label: "Limite ravine", x: -58, z: -29, color: 0x3e7140 },
  { id: "ridge-rock-01", label: "Montee hauts", x: -54, z: -25, color: 0x6d6a5d },
  { id: "ridge-rock-02", label: "Montee hauts", x: -55, z: -35, color: 0x6d6a5d }
] as const satisfies readonly BlockoutMarker[];

export const WEST_BLOCKOUT_COLLIDERS = WEST_BLOCKOUT_BOUNDARY_MARKERS.map((marker) => ({
  kind: "circle",
  x: marker.x,
  z: marker.z,
  radius: 1.05
})) satisfies BlockoutCollider[];

// --- Progression le long du sentier ouest (pur, sans rendu ni DOM) ---
// Base pour la boucle exploration et l'affichage "lieu actuel".

function segmentLength(a: BlockoutPoint, b: BlockoutPoint): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.hypot(dx, dz);
}

/** Longueur totale du sentier principal jusqu'au point de vue Maido / Mafate, en unites monde. */
export const WEST_BLOCKOUT_PATH_LENGTH = WEST_BLOCKOUT_PATH.reduce(
  (total, point, index) =>
    index === 0 ? 0 : total + segmentLength(WEST_BLOCKOUT_PATH[index - 1]!, point),
  0
);

export type PathProgress = {
  /** Index du segment le plus proche (0 = premier segment). */
  segmentIndex: number;
  /** Position normalisee dans le segment, 0..1. */
  t: number;
  /** Distance parcourue depuis le depart, en unites monde. */
  distanceAlong: number;
  /** Progression totale normalisee, 0 (depart) -> 1 (point de vue Maido / Mafate). */
  normalized: number;
  /** Distance laterale au sentier, en unites monde. */
  lateral: number;
  /** Label du point de depart du segment le plus proche. */
  label: string;
};

/**
 * Projette une position (x, z) sur le sentier ouest et renvoie sa progression.
 * Utilise une projection point-segment classique, segment par segment.
 */
export function getNearestPathProgress(x: number, z: number): PathProgress {
  let best: PathProgress = {
    segmentIndex: 0,
    t: 0,
    distanceAlong: 0,
    normalized: 0,
    lateral: Number.POSITIVE_INFINITY,
    label: WEST_BLOCKOUT_PATH[0]!.label
  };

  let cumulative = 0;
  for (let index = 0; index < WEST_BLOCKOUT_PATH.length - 1; index += 1) {
    const a = WEST_BLOCKOUT_PATH[index]!;
    const b = WEST_BLOCKOUT_PATH[index + 1]!;
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const lenSq = abx * abx + abz * abz;
    const t = lenSq === 0 ? 0 : Math.min(1, Math.max(0, ((x - a.x) * abx + (z - a.z) * abz) / lenSq));
    const projX = a.x + abx * t;
    const projZ = a.z + abz * t;
    const lateral = Math.hypot(x - projX, z - projZ);

    if (lateral < best.lateral) {
      const segLen = Math.sqrt(lenSq);
      const distanceAlong = cumulative + segLen * t;
      best = {
        segmentIndex: index,
        t,
        distanceAlong,
        normalized:
          WEST_BLOCKOUT_PATH_LENGTH === 0 ? 0 : distanceAlong / WEST_BLOCKOUT_PATH_LENGTH,
        lateral,
        label: a.label
      };
    }
    cumulative += Math.sqrt(lenSq);
  }

  return best;
}

/**
 * Largeur consideree comme "sur le sentier", en unites monde (de part et d'autre).
 * Au-dela, la progression `normalized` reste calculee mais n'est plus significative.
 */
export const WEST_BLOCKOUT_PATH_HALF_WIDTH = 3.5;

/**
 * Indique si une position (x, z) est assez proche du sentier pour que la
 * progression soit fiable. Evite d'afficher un "lieu actuel" quand le joueur
 * s'eloigne du trace. Pur, sans rendu ni DOM.
 */
export function isOnWestPath(
  x: number,
  z: number,
  halfWidth: number = WEST_BLOCKOUT_PATH_HALF_WIDTH
): boolean {
  return getNearestPathProgress(x, z).lateral <= halfWidth;
}
