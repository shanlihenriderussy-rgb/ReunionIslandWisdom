import * as THREE from "three";
import { terrainAssets } from "@riw/assets";
import { WORLD_BIOMES, type BiomeId } from "../world/biomes";
import type { WalkableSurface } from "../game/collision";
import type { RuntimeCollider } from "./westVegetation";

export type BiomeScenicMode = "all" | BiomeId;

type Point2 = { x: number; z: number };

type TerrainCollisionData = {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  gridX: number;
  gridZ: number;
  outline?: Point2[];
  heights: Array<number | null>;
};

type BiomeScene = {
  id: BiomeId;
  radius: number;
  material: THREE.Material;
  accent: THREE.Material;
  build: (terrain: TerrainCollisionData, group: THREE.Group) => void;
  colliders?: (terrain: TerrainCollisionData) => RuntimeCollider[];
};

type BiomeConnection = {
  id: string;
  kind: "road" | "trail" | "boardwalk";
  from: BiomeId;
  to: BiomeId;
  points: readonly Point2[];
};

const matAsphalt = new THREE.MeshStandardMaterial({ color: 0x2d3030, roughness: 0.9, metalness: 0 });
const matTrail = new THREE.MeshStandardMaterial({ color: 0xb89056, roughness: 0.94, metalness: 0 });
const matBoardwalk = new THREE.MeshStandardMaterial({ color: 0x8b5a32, roughness: 0.86, metalness: 0 });
const matBasalt = new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: 0.96, metalness: 0 });
const matConcrete = new THREE.MeshStandardMaterial({ color: 0xc4956a, roughness: 0.9, metalness: 0 });
const matCreoleWall = new THREE.MeshStandardMaterial({ color: 0xf5e6d0, roughness: 0.9, metalness: 0 });
const matCreoleRoof = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.86, metalness: 0 });
const matGreen = new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.92, metalness: 0 });
const matGreenLight = new THREE.MeshStandardMaterial({ color: 0x7dbe5c, roughness: 0.9, metalness: 0 });
const matWater = new THREE.MeshStandardMaterial({
  color: 0x60d4d1,
  roughness: 0.5,
  metalness: 0,
  transparent: true,
  opacity: 0.72
});
const matMist = new THREE.MeshBasicMaterial({ color: 0xd4eef4, transparent: true, opacity: 0.28, depthWrite: false });
const matYellow = new THREE.MeshStandardMaterial({ color: 0xf4c430, roughness: 0.82, metalness: 0 });
const matVolcanic = new THREE.MeshStandardMaterial({ color: 0x403735, roughness: 0.96, metalness: 0 });

const pathSampleSpacing = 1.25;
const walkableSurfaceSpacing = 2.75;

export function addIslandBiomeBlockouts(
  scene: THREE.Scene,
  onColliders: (colliders: readonly RuntimeCollider[]) => void = () => {},
  onWalkableSurfaces: (surfaces: readonly WalkableSurface[]) => void = () => {},
  mode: BiomeScenicMode = "all"
): void {
  void fetch(terrainAssets.laReunion.reliefCollision)
    .then((response) => (response.ok ? response.json() : null))
    .then((terrain: TerrainCollisionData | null) => {
      if (!terrain) {
        return;
      }

      const group = new THREE.Group();
      group.name = mode === "all" ? "BiomeScenic_AllCleanV1" : `BiomeScenic_${mode}`;

      const selected = selectedBiomeIds(mode);
      const connections = selectedConnections(mode, selected);
      const colliders: RuntimeCollider[] = [];
      const surfaces: WalkableSurface[] = [];

      addConnectionNetwork(terrain, group, connections);
      surfaces.push(...createConnectionSurfaces(terrain, connections));

      for (const sceneDef of biomeScenes) {
        if (!selected.has(sceneDef.id)) {
          continue;
        }
        const layer = new THREE.Group();
        layer.name = `Biome_${sceneDef.id}_CleanSlice`;
        const center = biomeCenter(sceneDef.id);
        layer.add(createDrapedDisc(`Biome_${sceneDef.id}_Footprint`, center, sceneDef.radius, sceneDef.material, terrain, 0.1));
        layer.add(createBiomeBeacon(sceneDef.id, center, sceneDef.accent, terrain));
        sceneDef.build(terrain, layer);
        group.add(layer);
        colliders.push(...(sceneDef.colliders?.(terrain) ?? []));
        surfaces.push(createBiomeFootprintSurface(sceneDef.id, center, sceneDef.radius, terrain));
      }

      scene.add(group);
      onColliders(colliders);
      onWalkableSurfaces(surfaces);
    })
    .catch((error: unknown) => {
      console.warn("Clean biome scenic generation failed", error);
    });
}

const biomeCenter = (id: BiomeId): Point2 => {
  const biome = WORLD_BIOMES.find((entry) => entry.id === id);
  return { x: biome?.center.x ?? 0, z: biome?.center.y ?? 0 };
};

const west = biomeCenter("saint-paul-saint-gilles");
const route = biomeCenter("route-littoral");
const saintDenis = biomeCenter("saint-denis");
const pitonNeiges = biomeCenter("piton-neiges");
const mafate = biomeCenter("mafate");
const salazie = biomeCenter("salazie");
const cilaos = biomeCenter("cilaos");
const palmistes = biomeCenter("plaine-palmistes");
const fournaise = biomeCenter("fournaise");
const sud = biomeCenter("sud-sauvage");

const playableBiomeIds: readonly BiomeId[] = [
  "route-littoral",
  "saint-denis",
  "piton-neiges",
  "mafate",
  "salazie",
  "cilaos",
  "plaine-palmistes",
  "sud-sauvage"
];

const biomeConnections: readonly BiomeConnection[] = [
  {
    id: "west-route-littoral",
    kind: "road",
    from: "saint-paul-saint-gilles",
    to: "route-littoral",
    points: [west, { x: -78, z: 10 }, { x: -67, z: 34 }, route]
  },
  {
    id: "route-saint-denis",
    kind: "road",
    from: "route-littoral",
    to: "saint-denis",
    points: [route, { x: -42, z: 63 }, { x: -18, z: 69 }, saintDenis]
  },
  {
    id: "saint-denis-salazie",
    kind: "trail",
    from: "saint-denis",
    to: "salazie",
    points: [saintDenis, { x: 8, z: 61 }, { x: 15, z: 48 }, salazie]
  },
  {
    id: "salazie-palmistes",
    kind: "boardwalk",
    from: "salazie",
    to: "plaine-palmistes",
    points: [salazie, { x: 31, z: 26 }, { x: 42, z: 15 }, palmistes]
  },
  {
    id: "palmistes-fournaise",
    kind: "trail",
    from: "plaine-palmistes",
    to: "fournaise",
    points: [palmistes, { x: 55, z: -6 }, { x: 67, z: -22 }, fournaise]
  },
  {
    id: "west-mafate",
    kind: "trail",
    from: "saint-paul-saint-gilles",
    to: "mafate",
    points: [west, { x: -79, z: 6 }, { x: -55, z: 17 }, mafate]
  },
  {
    id: "mafate-piton-neiges",
    kind: "trail",
    from: "mafate",
    to: "piton-neiges",
    points: [mafate, { x: -25, z: 29 }, { x: -11, z: 16 }, pitonNeiges]
  },
  {
    id: "piton-neiges-cilaos",
    kind: "trail",
    from: "piton-neiges",
    to: "cilaos",
    points: [pitonNeiges, { x: -8, z: -3 }, { x: -17, z: -13 }, cilaos]
  },
  {
    id: "cilaos-sud",
    kind: "trail",
    from: "cilaos",
    to: "sud-sauvage",
    points: [cilaos, { x: -7, z: -39 }, { x: 4, z: -57 }, sud]
  },
  {
    id: "sud-fournaise",
    kind: "trail",
    from: "sud-sauvage",
    to: "fournaise",
    points: [sud, { x: 34, z: -63 }, { x: 57, z: -51 }, fournaise]
  },
  {
    id: "salazie-piton-neiges",
    kind: "trail",
    from: "salazie",
    to: "piton-neiges",
    points: [salazie, { x: 10, z: 27 }, { x: 2, z: 16 }, pitonNeiges]
  }
];

const biomeScenes: readonly BiomeScene[] = [
  {
    id: "route-littoral",
    radius: 4.2,
    material: transparentMaterial(0x5d6a73, 0.34),
    accent: matYellow,
    build: (terrain, group) => {
      group.add(createLocalRoute(route, terrain));
      group.add(createBasaltLine(route.x - 1.4, route.z + 1.4, 5, 1.25, terrain));
    }
  },
  {
    id: "saint-denis",
    radius: 4.4,
    material: transparentMaterial(0xc7895b, 0.35),
    accent: matCreoleRoof,
    build: (terrain, group) => {
      group.add(createDrapedDisc("Biome_SaintDenis_Plaza", saintDenis, 2.15, matConcrete, terrain, 0.16));
      group.add(createCreoleRoofline(saintDenis.x - 1.4, saintDenis.z + 1.6, 0.18, terrain));
      group.add(createCreoleRoofline(saintDenis.x + 1.5, saintDenis.z + 1.3, -0.18, terrain));
      group.add(createPalmPair(saintDenis.x, saintDenis.z - 2.3, terrain));
    }
  },
  {
    id: "piton-neiges",
    radius: 3.7,
    material: transparentMaterial(0x7a8161, 0.33),
    accent: matBasalt,
    build: (terrain, group) => {
      group.add(createCairn("Biome_PitonNeiges_Cairn", pitonNeiges, 1.05, terrain));
      group.add(createContourSteps(pitonNeiges, 3, terrain));
    },
    colliders: (terrain) => [
      {
        kind: "circle",
        x: pitonNeiges.x,
        z: pitonNeiges.z,
        radius: 1.05,
        climbableTopY: sampleHeight(terrain, pitonNeiges.x, pitonNeiges.z) + 0.96,
        stepUp: 0.72
      }
    ]
  },
  {
    id: "mafate",
    radius: 4.1,
    material: transparentMaterial(0x49653b, 0.34),
    accent: matBoardwalk,
    build: (terrain, group) => {
      group.add(createShortBridge("Biome_Mafate_RavineBridge", mafate.x - 0.7, mafate.z + 0.4, -0.62, terrain));
      group.add(createIlet("Biome_Mafate_Ilet", mafate.x + 1.5, mafate.z - 1.4, terrain));
    }
  },
  {
    id: "salazie",
    radius: 4.3,
    material: transparentMaterial(0x2f7d66, 0.34),
    accent: matWater,
    build: (terrain, group) => {
      group.add(createWaterRibbon("Biome_Salazie_Waterline", salazie.x - 2.6, salazie.z + 0.2, 5.8, -0.48, terrain));
      group.add(createMistDiscs("Biome_Salazie_Mist", salazie, terrain));
      group.add(createFernArc(salazie.x + 1.5, salazie.z - 1.8, terrain));
    }
  },
  {
    id: "cilaos",
    radius: 4,
    material: transparentMaterial(0x6f7d4a, 0.34),
    accent: matWater,
    build: (terrain, group) => {
      group.add(createDrapedDisc("Biome_Cilaos_ThermalBasin", cilaos, 1.4, matWater, terrain, 0.14));
      group.add(createContourSteps({ x: cilaos.x - 1.9, z: cilaos.z + 0.6 }, 4, terrain));
      group.add(createSteam(cilaos.x + 1.2, cilaos.z - 0.7, terrain));
    }
  },
  {
    id: "plaine-palmistes",
    radius: 4,
    material: transparentMaterial(0x6aa35a, 0.34),
    accent: matGreenLight,
    build: (terrain, group) => {
      group.add(createShortBridge("Biome_Palmistes_Boardwalk", palmistes.x, palmistes.z + 0.8, 0.74, terrain));
      group.add(createFernArc(palmistes.x - 1.7, palmistes.z - 1.4, terrain));
      group.add(createMistDiscs("Biome_Palmistes_Mist", palmistes, terrain));
    }
  },
  {
    id: "sud-sauvage",
    radius: 4.3,
    material: transparentMaterial(0x1f6f5d, 0.34),
    accent: matBasalt,
    build: (terrain, group) => {
      group.add(createBasaltLine(sud.x - 1.8, sud.z + 0.2, 6, 1.1, terrain));
      group.add(createWaterRibbon("Biome_SudSauvage_Surf", sud.x + 1.5, sud.z - 1, 5.2, 0.28, terrain));
      group.add(createCreoleRoofline(sud.x + 2.2, sud.z + 1.6, -0.5, terrain));
    },
    colliders: (terrain) => [
      {
        kind: "circle",
        x: sud.x - 2.4,
        z: sud.z + 0.4,
        radius: 0.95,
        climbableTopY: sampleHeight(terrain, sud.x - 2.4, sud.z + 0.4) + 0.62,
        stepUp: 0.72
      }
    ]
  }
];

function selectedBiomeIds(mode: BiomeScenicMode): Set<BiomeId> {
  if (mode === "all") {
    return new Set(playableBiomeIds);
  }
  if (playableBiomeIds.includes(mode)) {
    return new Set([mode]);
  }
  return new Set();
}

function selectedConnections(mode: BiomeScenicMode, selected: ReadonlySet<BiomeId>): BiomeConnection[] {
  if (mode === "all") {
    return [...biomeConnections];
  }
  return biomeConnections.filter((connection) => selected.has(connection.from) || selected.has(connection.to));
}

function addConnectionNetwork(
  terrain: TerrainCollisionData,
  group: THREE.Group,
  connections: readonly BiomeConnection[]
): void {
  const network = new THREE.Group();
  network.name = "BiomeConnectionNetwork_CleanGrade";
  for (const connection of connections) {
    const centers = terrainAwarePath(connection, terrain);
    network.add(createConnectionRibbon(connection, centers, terrain));
    if (connection.kind === "trail") {
      network.add(createSparseEdgeStones(connection.id, centers, terrain));
    }
  }
  group.add(network);
}

function createConnectionSurfaces(
  terrain: TerrainCollisionData,
  connections: readonly BiomeConnection[]
): WalkableSurface[] {
  const surfaces: WalkableSurface[] = [];
  for (const connection of connections) {
    const centers = terrainAwarePath(connection, terrain);
    const stride = Math.max(1, Math.round(walkableSurfaceSpacing / pathSampleSpacing));
    for (let i = 0; i < centers.length - stride; i += stride) {
      const a = centers[i];
      const b = centers[Math.min(centers.length - 1, i + stride)];
      if (!a || !b) {
        continue;
      }
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const length = Math.hypot(dx, dz);
      if (length < 0.2) {
        continue;
      }
      const x = (a.x + b.x) / 2;
      const z = (a.z + b.z) / 2;
      surfaces.push({
        kind: "rect",
        id: `biome-v1-link-${connection.id}-${i}`,
        x,
        z,
        width: connectionWidth(connection),
        depth: length + 0.2,
        yaw: Math.atan2(dx, dz),
        topY: sampleHeight(terrain, x, z) + pathLift(connection),
        stepUp: connection.kind === "road" ? 0.72 : 0.62
      });
    }
  }
  return surfaces;
}

function terrainAwarePath(connection: BiomeConnection, terrain: TerrainCollisionData): Point2[] {
  const dense = densifyPath(connection.points, pathSampleSpacing);
  const maxOffset = connection.kind === "road" ? 3.5 : 5.5;
  let relaxed = dense;
  for (let pass = 0; pass < 3; pass += 1) {
    relaxed = relaxPathAgainstSlope(relaxed, terrain, maxOffset);
  }
  return smoothPath(relaxed);
}

function densifyPath(points: readonly Point2[], spacing: number): Point2[] {
  const out: Point2[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) {
      continue;
    }
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(1, Math.ceil(length / spacing));
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      out.push({ x: THREE.MathUtils.lerp(a.x, b.x, t), z: THREE.MathUtils.lerp(a.z, b.z, t) });
    }
  }
  const last = points[points.length - 1];
  if (last) {
    out.push({ x: last.x, z: last.z });
  }
  return out;
}

function relaxPathAgainstSlope(points: readonly Point2[], terrain: TerrainCollisionData, maxOffset: number): Point2[] {
  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) {
      return point;
    }
    const prev = points[index - 1] ?? point;
    const next = points[index + 1] ?? point;
    const tx = next.x - prev.x;
    const tz = next.z - prev.z;
    const length = Math.hypot(tx, tz) || 1;
    const sx = -tz / length;
    const sz = tx / length;
    const offsets = [-maxOffset, -maxOffset * 0.55, -maxOffset * 0.25, 0, maxOffset * 0.25, maxOffset * 0.55, maxOffset];
    let best = point;
    let bestCost = Number.POSITIVE_INFINITY;

    for (const offset of offsets) {
      const candidate = { x: point.x + sx * offset, z: point.z + sz * offset };
      const cost = terrainPathCost(candidate, prev, next, terrain) + Math.abs(offset) * 0.035;
      if (cost < bestCost) {
        best = candidate;
        bestCost = cost;
      }
    }
    return best;
  });
}

function terrainPathCost(point: Point2, prev: Point2, next: Point2, terrain: TerrainCollisionData): number {
  const height = sampleHeight(terrain, point.x, point.z);
  const prevHeight = sampleHeight(terrain, prev.x, prev.z);
  const nextHeight = sampleHeight(terrain, next.x, next.z);
  const span = Math.max(0.1, Math.hypot(next.x - prev.x, next.z - prev.z));
  const grade = (Math.abs(height - prevHeight) + Math.abs(height - nextHeight)) / span;
  const slope = localSlope(terrain, point.x, point.z);
  const outsidePenalty = terrain.outline && !pointInPolygon(point.x, point.z, terrain.outline) ? 80 : 0;
  const waterPenalty = height < -0.18 ? 30 : 0;
  return slope * 5.5 + grade * 8 + outsidePenalty + waterPenalty;
}

function smoothPath(points: readonly Point2[]): Point2[] {
  if (points.length < 3) {
    return [...points];
  }
  const out: Point2[] = [];
  const first = points[0];
  if (first) {
    out.push(first);
  }
  for (let i = 1; i < points.length - 1; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const c = points[i + 1];
    if (!a || !b || !c) {
      continue;
    }
    out.push({ x: (a.x + 2 * b.x + c.x) / 4, z: (a.z + 2 * b.z + c.z) / 4 });
  }
  const last = points[points.length - 1];
  if (last) {
    out.push(last);
  }
  return out;
}

function createConnectionRibbon(
  connection: BiomeConnection,
  centers: readonly Point2[],
  terrain: TerrainCollisionData
): THREE.Group {
  const group = new THREE.Group();
  group.name = `BiomeLink_${connection.id}`;
  const material = connectionMaterial(connection);
  const lift = pathLift(connection);
  const ribbon = buildDrapedRibbon(
    `${group.name}_Ribbon`,
    centers,
    connectionWidth(connection),
    material,
    terrain,
    lift
  );
  group.add(ribbon);

  if (connection.kind === "road") {
    group.add(buildDrapedRibbon(`${group.name}_CenterLine`, centers, 0.12, matYellow, terrain, lift + 0.025));
  }
  return group;
}

function buildDrapedRibbon(
  name: string,
  centers: readonly Point2[],
  width: number,
  material: THREE.Material,
  terrain: TerrainCollisionData,
  lift: number
): THREE.Mesh {
  const vertices: number[] = [];
  const indices: number[] = [];
  const half = width / 2;

  for (let i = 0; i < centers.length; i += 1) {
    const point = centers[i];
    if (!point) {
      continue;
    }
    const prev = centers[Math.max(0, i - 1)] ?? point;
    const next = centers[Math.min(centers.length - 1, i + 1)] ?? point;
    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const length = Math.hypot(dx, dz) || 1;
    const sx = -dz / length;
    const sz = dx / length;
    const left = { x: point.x + sx * half, z: point.z + sz * half };
    const right = { x: point.x - sx * half, z: point.z - sz * half };
    vertices.push(left.x, sampleHeight(terrain, left.x, left.z) + lift, left.z);
    vertices.push(right.x, sampleHeight(terrain, right.x, right.z) + lift, right.z);
  }

  for (let i = 0; i < centers.length - 1; i += 1) {
    const base = i * 2;
    indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.receiveShadow = true;
  return mesh;
}

function createDrapedDisc(
  name: string,
  center: Point2,
  radius: number,
  material: THREE.Material,
  terrain: TerrainCollisionData,
  lift: number
): THREE.Mesh {
  const segments = 28;
  const vertices = [center.x, sampleHeight(terrain, center.x, center.z) + lift, center.z];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const x = center.x + Math.cos(angle) * radius;
    const z = center.z + Math.sin(angle) * radius;
    vertices.push(x, sampleHeight(terrain, x, z) + lift, z);
  }
  for (let i = 1; i <= segments; i += 1) {
    indices.push(0, i, i + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.receiveShadow = true;
  return mesh;
}

function createBiomeFootprintSurface(
  id: BiomeId,
  center: Point2,
  radius: number,
  terrain: TerrainCollisionData
): WalkableSurface {
  return {
    kind: "rect",
    id: `biome-v1-footprint-${id}`,
    x: center.x,
    z: center.z,
    width: radius * 1.45,
    depth: radius * 1.45,
    yaw: 0,
    topY: sampleHeight(terrain, center.x, center.z) + 0.12,
    stepUp: 0.62
  };
}

function createBiomeBeacon(id: BiomeId, center: Point2, material: THREE.Material, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = `Biome_${id}_Beacon`;
  group.position.set(center.x, sampleHeight(terrain, center.x, center.z) + 0.22, center.z);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.18, 8), matBasalt);
  const marker = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.62, 5), material);
  marker.position.y = 0.4;
  base.castShadow = true;
  marker.castShadow = true;
  group.add(base, marker);
  return group;
}

function createLocalRoute(center: Point2, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = "Biome_RouteLittoral_LocalGrade";
  const points = terrainAwarePath(
    {
      id: "route-local",
      kind: "road",
      from: "route-littoral",
      to: "route-littoral",
      points: [
        { x: center.x - 5.2, z: center.z - 1.2 },
        { x: center.x - 1.8, z: center.z + 0.15 },
        { x: center.x + 5.2, z: center.z + 1.2 }
      ]
    },
    terrain
  );
  group.add(buildDrapedRibbon("Biome_RouteLittoral_LocalRoad", points, 1.65, matAsphalt, terrain, 0.18));
  group.add(createSparsePosts("Biome_RouteLittoral_Guardrail", points, terrain, matYellow));
  return group;
}

function createShortBridge(name: string, x: number, z: number, yaw: number, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, sampleHeight(terrain, x, z) + 0.55, z);
  group.rotation.y = yaw;

  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 4.8), matBoardwalk);
  const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 4.7), matBoardwalk);
  const rightRail = leftRail.clone();
  leftRail.position.set(-0.54, 0.26, 0);
  rightRail.position.set(0.54, 0.26, 0);
  deck.castShadow = true;
  leftRail.castShadow = true;
  rightRail.castShadow = true;
  group.add(deck, leftRail, rightRail);
  return group;
}

function createCairn(name: string, center: Point2, scale: number, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(center.x, sampleHeight(terrain, center.x, center.z) + 0.04, center.z);
  for (let i = 0; i < 4; i += 1) {
    const rock = new THREE.Mesh(new THREE.CylinderGeometry((0.72 - i * 0.1) * scale, (0.88 - i * 0.1) * scale, 0.24, 7), matBasalt);
    rock.position.y = 0.12 + i * 0.22;
    rock.rotation.y = i * 0.37;
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }
  return group;
}

function createContourSteps(center: Point2, count: number, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = "Biome_ContourSteps";
  for (let i = 0; i < count; i += 1) {
    const radius = 1.4 + i * 0.7;
    const start = -1.1 + i * 0.28;
    const points: Point2[] = [];
    for (let s = 0; s < 8; s += 1) {
      const angle = start + s * 0.18;
      points.push({ x: center.x + Math.cos(angle) * radius, z: center.z + Math.sin(angle) * radius });
    }
    group.add(buildDrapedRibbon(`Biome_ContourStep_${i}`, points, 0.22, matTrail, terrain, 0.13));
  }
  return group;
}

function createCreoleRoofline(x: number, z: number, yaw: number, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = "Biome_CreoleRoofline";
  group.position.set(x, sampleHeight(terrain, x, z) + 0.04, z);
  group.rotation.y = yaw;

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.62, 0.95), matCreoleWall);
  body.position.y = 0.31;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.45, 4), matCreoleRoof);
  roof.position.y = 0.86;
  roof.rotation.y = Math.PI / 4;
  body.castShadow = true;
  roof.castShadow = true;
  group.add(body, roof);
  return group;
}

function createPalmPair(x: number, z: number, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = "Biome_PalmPair";
  group.add(createSimpleTree(x - 0.55, z, 1.8, matGreenLight, terrain));
  group.add(createSimpleTree(x + 0.65, z + 0.25, 1.55, matGreenLight, terrain));
  return group;
}

function createFernArc(x: number, z: number, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = "Biome_FernArc";
  for (let i = 0; i < 6; i += 1) {
    const angle = -0.9 + i * 0.36;
    group.add(createSimpleTree(x + Math.cos(angle) * 1.5, z + Math.sin(angle) * 1.1, 0.9, matGreen, terrain));
  }
  return group;
}

function createSimpleTree(x: number, z: number, height: number, material: THREE.Material, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, sampleHeight(terrain, x, z) + 0.02, z);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, height * 0.48, 5), matBoardwalk);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(height * 0.26, height * 0.52, 6), material);
  trunk.position.y = height * 0.24;
  crown.position.y = height * 0.66;
  trunk.castShadow = true;
  crown.castShadow = true;
  group.add(trunk, crown);
  return group;
}

function createIlet(name: string, x: number, z: number, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  group.add(createDrapedDisc(`${name}_Ground`, { x, z }, 1.15, transparentMaterial(0x49653b, 0.44), terrain, 0.14));
  group.add(createCreoleRoofline(x - 0.25, z + 0.15, 0.2, terrain));
  return group;
}

function createWaterRibbon(name: string, x: number, z: number, length: number, yaw: number, terrain: TerrainCollisionData): THREE.Mesh {
  const points: Point2[] = [];
  const dx = Math.sin(yaw);
  const dz = Math.cos(yaw);
  for (let i = 0; i < 8; i += 1) {
    const t = i / 7 - 0.5;
    points.push({ x: x + dx * length * t + Math.sin(i * 1.4) * 0.15, z: z + dz * length * t });
  }
  const mesh = buildDrapedRibbon(name, points, 0.7, matWater, terrain, 0.09);
  mesh.renderOrder = 3;
  return mesh;
}

function createMistDiscs(name: string, center: Point2, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  for (let i = 0; i < 3; i += 1) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.8 + i * 0.18, 14), matMist);
    disc.rotation.x = -Math.PI / 2;
    const x = center.x + Math.cos(i * 2.1) * 1.2;
    const z = center.z + Math.sin(i * 2.1) * 0.9;
    disc.position.set(x, sampleHeight(terrain, x, z) + 0.34 + i * 0.02, z);
    disc.renderOrder = 4;
    group.add(disc);
  }
  return group;
}

function createSteam(x: number, z: number, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = "Biome_Cilaos_Steam";
  for (let i = 0; i < 2; i += 1) {
    const plume = new THREE.Mesh(new THREE.CylinderGeometry(0.12 + i * 0.06, 0.06, 0.9 + i * 0.18, 8), matMist);
    plume.position.set(x + (i - 0.5) * 0.42, sampleHeight(terrain, x, z) + 0.58, z + i * 0.26);
    group.add(plume);
  }
  return group;
}

function createBasaltLine(x: number, z: number, count: number, spacing: number, terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = "Biome_BasaltLine";
  for (let i = 0; i < count; i += 1) {
    const px = x + (i - (count - 1) / 2) * spacing;
    const pz = z + Math.sin(i * 1.7) * 0.45;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36 + (i % 2) * 0.1, 0), matBasalt);
    rock.position.set(px, sampleHeight(terrain, px, pz) + 0.22, pz);
    rock.scale.y = 0.58;
    rock.rotation.y = i * 0.4;
    rock.castShadow = true;
    group.add(rock);
  }
  return group;
}

function createSparsePosts(name: string, centers: readonly Point2[], terrain: TerrainCollisionData, material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  for (let i = 2; i < centers.length; i += 8) {
    const point = centers[i];
    if (!point) {
      continue;
    }
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.12), material);
    post.position.set(point.x, sampleHeight(terrain, point.x, point.z) + 0.32, point.z);
    post.castShadow = true;
    group.add(post);
  }
  return group;
}

function createSparseEdgeStones(id: string, centers: readonly Point2[], terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = `BiomeLink_${id}_SparseStones`;
  for (let i = 4; i < centers.length; i += 10) {
    const point = centers[i];
    const prev = centers[i - 1] ?? point;
    const next = centers[i + 1] ?? point;
    if (!point || !prev || !next) {
      continue;
    }
    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const length = Math.hypot(dx, dz) || 1;
    const sx = -dz / length;
    const sz = dx / length;
    for (const side of [-1, 1] as const) {
      const x = point.x + sx * 0.72 * side;
      const z = point.z + sz * 0.72 * side;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), matBasalt);
      stone.position.set(x, sampleHeight(terrain, x, z) + 0.08, z);
      stone.scale.y = 0.45;
      stone.castShadow = true;
      group.add(stone);
    }
  }
  return group;
}

function transparentMaterial(color: number, opacity: number): THREE.Material {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0,
    transparent: true,
    opacity,
    depthWrite: false
  });
}

function connectionMaterial(connection: BiomeConnection): THREE.Material {
  if (connection.kind === "road") {
    return matAsphalt;
  }
  if (connection.kind === "boardwalk") {
    return matBoardwalk;
  }
  if (connection.to === "fournaise" || connection.from === "fournaise") {
    return matVolcanic;
  }
  return matTrail;
}

function connectionWidth(connection: BiomeConnection): number {
  if (connection.kind === "road") {
    return 1.45;
  }
  if (connection.kind === "boardwalk") {
    return 0.9;
  }
  return 0.78;
}

function pathLift(connection: BiomeConnection): number {
  if (connection.kind === "road") {
    return 0.17;
  }
  if (connection.kind === "boardwalk") {
    return 0.32;
  }
  return 0.13;
}

function localSlope(terrain: TerrainCollisionData, x: number, z: number): number {
  const step = 0.9;
  const h = sampleHeight(terrain, x, z);
  return Math.max(
    Math.abs(sampleHeight(terrain, x + step, z) - h),
    Math.abs(sampleHeight(terrain, x - step, z) - h),
    Math.abs(sampleHeight(terrain, x, z + step) - h),
    Math.abs(sampleHeight(terrain, x, z - step) - h)
  );
}

function sampleHeight(terrain: TerrainCollisionData, x: number, z: number): number {
  const { bounds, gridX, gridZ, heights } = terrain;
  const tx = THREE.MathUtils.clamp((x - bounds.minX) / (bounds.maxX - bounds.minX), 0, 1);
  const tz = THREE.MathUtils.clamp((z - bounds.minZ) / (bounds.maxZ - bounds.minZ), 0, 1);
  const gx = tx * (gridX - 1);
  const gz = tz * (gridZ - 1);
  const x0 = Math.floor(gx);
  const z0 = Math.floor(gz);
  const x1 = Math.min(gridX - 1, x0 + 1);
  const z1 = Math.min(gridZ - 1, z0 + 1);
  const fx = gx - x0;
  const fz = gz - z0;
  const h00 = finiteHeight(heights[z0 * gridX + x0]);
  const h10 = finiteHeight(heights[z0 * gridX + x1]);
  const h01 = finiteHeight(heights[z1 * gridX + x0]);
  const h11 = finiteHeight(heights[z1 * gridX + x1]);
  const hx0 = THREE.MathUtils.lerp(h00, h10, fx);
  const hx1 = THREE.MathUtils.lerp(h01, h11, fx);
  return THREE.MathUtils.lerp(hx0, hx1, fz);
}

function finiteHeight(height: number | null | undefined): number {
  return typeof height === "number" && Number.isFinite(height) ? height : 0;
}

function pointInPolygon(x: number, z: number, polygon: readonly Point2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if (!a || !b) {
      continue;
    }
    const intersects = a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z || 1) + a.x;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}
