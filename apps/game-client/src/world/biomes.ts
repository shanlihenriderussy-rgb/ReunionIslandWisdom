import * as THREE from "three";

export type BiomeId =
  | "saint-paul-saint-gilles"
  | "route-littoral"
  | "saint-denis"
  | "piton-neiges"
  | "mafate"
  | "salazie"
  | "cilaos"
  | "plaine-palmistes"
  | "fournaise"
  | "sud-sauvage";

export type BiomeDefinition = {
  id: BiomeId;
  label: string;
  center: Readonly<THREE.Vector2>;
  radius: number;
  debugColor: number;
  reference: string;
  reliefAnchor: string;
};

const mapCoordScale = 220 / 155;
const scaled = (value: number): number => Number((value * mapCoordScale).toFixed(2));

export const WORLD_BIOMES = [
  {
    id: "saint-paul-saint-gilles",
    label: "Saint-Paul / Saint-Gilles",
    center: new THREE.Vector2(scaled(-64), scaled(-6)),
    radius: scaled(21),
    debugColor: 0xd8bd73,
    reference: "B1 - littoral ouest, lagon, sable, zone de depart",
    reliefAnchor: "cote ouest basse, entre Saint-Paul et Saint-Gilles-les-Bains"
  },
  {
    id: "route-littoral",
    label: "Route du Littoral",
    center: new THREE.Vector2(scaled(-36), scaled(43)),
    radius: scaled(15),
    debugColor: 0x5d6a73,
    reference: "B7 - axe cotier, falaises, ocean",
    reliefAnchor: "nord-ouest, entre Le Port et Saint-Denis"
  },
  {
    id: "saint-denis",
    label: "Saint-Denis",
    center: new THREE.Vector2(scaled(3), scaled(54)),
    radius: scaled(14),
    debugColor: 0xc7895b,
    reference: "B6 - hub urbain creole",
    reliefAnchor: "cote nord, zone urbaine basse"
  },
  {
    id: "piton-neiges",
    label: "Piton des Neiges",
    center: new THREE.Vector2(scaled(0), scaled(1)),
    radius: scaled(15),
    debugColor: 0x7a8161,
    reference: "B0/B3/B5 - massif central, cretes, depart des cirques",
    reliefAnchor: "haut massif central-nord-ouest, sommet principal de l'ile"
  },
  {
    id: "mafate",
    label: "Cirque de Mafate",
    center: new THREE.Vector2(scaled(-22), scaled(16)),
    radius: scaled(17),
    debugColor: 0x49653b,
    reference: "B3 - montagne isolee, sentiers, ravines",
    reliefAnchor: "cirque nord-ouest du massif central, sous Piton des Neiges"
  },
  {
    id: "salazie",
    label: "Cirque de Salazie",
    center: new THREE.Vector2(scaled(16), scaled(25)),
    radius: scaled(17),
    debugColor: 0x2f7d66,
    reference: "B4 - eau, cascades, vegetation humide",
    reliefAnchor: "cirque nord-est interieur, vers Hell-Bourg"
  },
  {
    id: "cilaos",
    label: "Cirque de Cilaos",
    center: new THREE.Vector2(scaled(-13), scaled(-16)),
    radius: scaled(17),
    debugColor: 0x6f7d4a,
    reference: "B5 - thermes, village, relief montagneux",
    reliefAnchor: "cirque sud du massif central"
  },
  {
    id: "plaine-palmistes",
    label: "Plaine des Palmistes",
    center: new THREE.Vector2(scaled(28), scaled(4)),
    radius: scaled(15),
    debugColor: 0x6aa35a,
    reference: "B0/B4 - couloir vegetal entre massifs",
    reliefAnchor: "est interieur, entre Piton des Neiges et Fournaise"
  },
  {
    id: "fournaise",
    label: "Piton de la Fournaise",
    // Recentre sur le sommet RGE ALTI verifie (2610 m a world 65.9 / -37).
    center: new THREE.Vector2(scaled(46.5), scaled(-26.1)),
    radius: scaled(24),
    debugColor: 0x403735,
    reference: "B2 - volcan actif, basalte, scories",
    reliefAnchor: "sud-est, Enclos Fouque / Champ de lave"
  },
  {
    id: "sud-sauvage",
    label: "Sud Sauvage",
    center: new THREE.Vector2(scaled(8), scaled(-50)),
    radius: scaled(18),
    debugColor: 0x1f6f5d,
    reference: "B0 - cote humide, falaises vegetales",
    reliefAnchor: "sud / sud-est, Saint-Joseph a Saint-Philippe"
  }
] as const satisfies readonly BiomeDefinition[];

export function getBiomeAtPosition(position: THREE.Vector3): BiomeDefinition {
  let closest: BiomeDefinition = WORLD_BIOMES[0];
  let closestScore = Number.POSITIVE_INFINITY;

  for (const biome of WORLD_BIOMES) {
    const distance = biome.center.distanceTo(new THREE.Vector2(position.x, position.z));
    const score = distance / biome.radius;
    if (score < closestScore) {
      closest = biome;
      closestScore = score;
    }
  }

  return closest;
}
