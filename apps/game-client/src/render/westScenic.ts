import * as THREE from "three";
import { terrainAssets } from "@riw/assets";

type Point2 = {
  x: number;
  z: number;
};

type TerrainCollisionData = {
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  gridX: number;
  gridZ: number;
  outline: Point2[];
  heights: number[];
};

const seaLevel = -0.38;
const beachY = 0.055;
const westShoreMinZ = -18;
const westShoreMaxZ = 24;
const westShoreMaxX = -70;

export function addWestMoodboardScenic(scene: THREE.Scene): void {
  void fetch(terrainAssets.laReunion.reliefCollision)
    .then((response) => (response.ok ? response.json() : null))
    .then((terrain: TerrainCollisionData | null) => {
      if (!terrain) {
        return;
      }

      const group = new THREE.Group();
      group.name = "ScenicMoodboard_SaintPaulSaintGilles";

      // Semis de props GLB retire : remplace par le generateur seede
      // (render/westVegetation.ts). On garde ici uniquement le decor non-prop.
      group.add(createWestVectorShoreline(terrain));
      group.add(createSnackKiosk(terrain));
      group.add(createProceduralSigns(terrain));
      const isMapDebug = new URLSearchParams(window.location.search).has("mapDebug");
      if (isMapDebug) {
        group.add(createLagoonPatches());
        group.add(createFoamBands());
      } else {
        group.add(createCloudLayer());
      }
      scene.add(group);
    })
    .catch((error: unknown) => {
      console.warn("West scenic moodboard layer failed", error);
    });
}

function createWestVectorShoreline(terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = "ScenicWest_VectorShoreline";
  const coast = getLongestContiguousRun(
    terrain.outline,
    (point) => point.x <= westShoreMaxX && point.z >= westShoreMinZ && point.z <= westShoreMaxZ
  );

  const points = smoothPolyline(simplifyByDistance(coast, 0.42));
  if (points.length < 3) {
    return group;
  }

  group.add(createShoreStrip(points, "sand"));
  return group;
}

function createShoreStrip(points: readonly Point2[], kind: "sea" | "sand"): THREE.Mesh {
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const ocean = new THREE.Color(0x19aeca);
  const lagoon = new THREE.Color(0x60d4d1);
  const sandOuter = new THREE.Color(0xd9c48e);
  const sandInner = new THREE.Color(0xe6d59a);

  for (const point of points) {
    const outward = { x: point.x - 0.55, z: point.z };
    const inward = { x: point.x + 1.25, z: point.z };

    if (kind === "sea") {
      vertices.push(point.x, seaLevel + 0.13, point.z);
      vertices.push(outward.x, seaLevel + 0.13, outward.z);
      colors.push(lagoon.r, lagoon.g, lagoon.b, ocean.r, ocean.g, ocean.b);
    } else {
      vertices.push(point.x, beachY + 0.085, point.z);
      vertices.push(inward.x, beachY + 0.095, inward.z);
      colors.push(sandOuter.r, sandOuter.g, sandOuter.b, sandInner.r, sandInner.g, sandInner.b);
    }
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    const base = i * 2;
    const next = (i + 1) * 2;
    indices.push(base, next, base + 1, base + 1, next, next + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
    transparent: kind === "sea",
    opacity: kind === "sea" ? 0.72 : 1,
    side: THREE.DoubleSide,
    depthWrite: kind === "sand",
    depthTest: kind === "sand",
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = kind === "sea" ? "ScenicWest_VectorSeaTrim" : "ScenicWest_VectorSandEdge";
  mesh.renderOrder = kind === "sea" ? 3 : 4;
  return mesh;
}

function getLongestContiguousRun(
  points: readonly Point2[],
  predicate: (point: Point2) => boolean
): Point2[] {
  let best: Point2[] = [];
  let current: Point2[] = [];

  for (const point of points) {
    if (predicate(point)) {
      current.push(point);
      continue;
    }
    if (current.length > best.length) {
      best = current;
    }
    current = [];
  }

  if (current.length > best.length) {
    best = current;
  }
  return best;
}

function simplifyByDistance(points: readonly Point2[], minDistance: number): Point2[] {
  const out: Point2[] = [];
  let previous = points[0];
  if (!previous) {
    return out;
  }
  out.push(previous);
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (!point) {
      continue;
    }
    if (Math.hypot(point.x - previous.x, point.z - previous.z) >= minDistance) {
      out.push(point);
      previous = point;
    }
  }
  return out;
}

function smoothPolyline(points: readonly Point2[]): Point2[] {
  if (points.length < 4) {
    return [...points];
  }
  const curve = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(point.x, 0, point.z)),
    false,
    "centripetal",
    0.45
  );
  return curve.getPoints(Math.max(18, points.length * 3)).map((point) => ({ x: point.x, z: point.z }));
}

function createProceduralSigns(terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = "ScenicWest_ProceduralSigns";
  const signs = [
    { x: -77.3, z: 5.0, rot: -0.85, color: 0xf2c66d },
    { x: -71.0, z: -14.6, rot: 0.45, color: 0xf4c430 }
  ] as const;

  for (const sign of signs) {
    const signGroup = createProceduralSign(sign.color);
    signGroup.position.set(sign.x, sampleHeight(terrain, sign.x, sign.z) + 0.06, sign.z);
    signGroup.rotation.y = sign.rot;
    group.add(signGroup);
  }

  return group;
}

function createProceduralSign(color: number): THREE.Group {
  const group = new THREE.Group();
  group.name = "ScenicWest_Sign";
  const wood = new THREE.MeshStandardMaterial({ color: 0x8b5a32, roughness: 0.9, metalness: 0 });
  const accent = new THREE.MeshStandardMaterial({ color, roughness: 0.76, metalness: 0 });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 1.14, 6), wood);
  post.position.y = 0.57;
  post.castShadow = true;

  const board = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.28, 0.08), accent);
  board.position.set(0.22, 1.02, 0);
  board.castShadow = true;
  board.receiveShadow = true;

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.08, 0.1), wood);
  cap.position.set(0.22, 1.2, 0);
  cap.castShadow = true;

  group.add(post, board, cap);
  return group;
}

function createSnackKiosk(terrain: TerrainCollisionData): THREE.Group {
  const group = new THREE.Group();
  group.name = "ScenicWest_SnackKiosk";
  group.position.set(-75.7, sampleHeight(terrain, -75.7, 4.0) + 0.05, 4.0);
  group.rotation.y = -0.52;

  const wood = new THREE.MeshStandardMaterial({ color: 0x9b6236, roughness: 0.86, metalness: 0 });
  const wall = new THREE.MeshStandardMaterial({ color: 0xf1d49d, roughness: 0.9, metalness: 0 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x2e8b8b, roughness: 0.72, metalness: 0 });
  const counter = new THREE.MeshStandardMaterial({ color: 0xc7895b, roughness: 0.88, metalness: 0 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.55, 1.2), wall);
  base.position.y = 0.28;
  base.castShadow = true;
  base.receiveShadow = true;

  const frontCounter = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.22, 0.28), counter);
  frontCounter.position.set(0, 0.76, -0.72);
  frontCounter.castShadow = true;
  frontCounter.receiveShadow = true;

  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(1.28, 0.65, 4), roof);
  roofMesh.position.y = 1.58;
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.scale.z = 0.78;
  roofMesh.castShadow = true;

  const postGeometry = new THREE.CylinderGeometry(0.055, 0.055, 1.32, 6);
  for (const [x, z] of [
    [-0.78, -0.54],
    [0.78, -0.54],
    [-0.78, 0.48],
    [0.78, 0.48]
  ] as const) {
    const post = new THREE.Mesh(postGeometry, wood);
    post.position.set(x, 0.98, z);
    post.castShadow = true;
    group.add(post);
  }

  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.26, 0.06), roof);
  sign.position.set(0, 1.23, -0.78);
  sign.castShadow = true;

  group.add(base, frontCounter, roofMesh, sign);
  return group;
}

function createLagoonPatches(): THREE.Group {
  const group = new THREE.Group();
  group.name = "ScenicWest_LagoonColorPatches";

  const patches = [
    { x: -88.8, z: 15.0, sx: 8.4, sz: 5.2, color: 0x6fe6dc, opacity: 0.32 },
    { x: -84.5, z: 4.0, sx: 7.6, sz: 4.3, color: 0x55d6d0, opacity: 0.28 },
    { x: -77.6, z: -13.0, sx: 6.7, sz: 3.5, color: 0xa2efe3, opacity: 0.22 }
  ] as const;

  for (const patch of patches) {
    const material = new THREE.MeshBasicMaterial({
      color: patch.color,
      transparent: true,
      opacity: patch.opacity,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 36), material);
    mesh.name = "ScenicWest_LagoonPatch";
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(patch.x, seaLevel + 0.032, patch.z);
    mesh.scale.set(patch.sx, patch.sz, 1);
    mesh.renderOrder = 1;
    group.add(mesh);
  }

  return group;
}

function createFoamBands(): THREE.Group {
  const group = new THREE.Group();
  group.name = "ScenicWest_FoamBands";
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const bands = [
    [
      { x: -90.0, z: 21.0 },
      { x: -86.4, z: 17.5 },
      { x: -83.1, z: 12.5 },
      { x: -79.5, z: 8.2 }
    ],
    [
      { x: -85.5, z: 5.8 },
      { x: -81.0, z: 2.0 },
      { x: -77.8, z: -4.0 },
      { x: -74.2, z: -10.0 }
    ],
    [
      { x: -78.3, z: -13.5 },
      { x: -74.8, z: -17.8 },
      { x: -70.5, z: -23.2 },
      { x: -66.6, z: -29.5 }
    ]
  ] as const;

  for (const band of bands) {
    const mesh = createFlatRibbon(band, 0.42, seaLevel + 0.06, material.clone());
    mesh.name = "ScenicWest_FoamBand";
    mesh.renderOrder = 2;
    group.add(mesh);
  }

  return group;
}

function createCloudLayer(): THREE.Group {
  const group = new THREE.Group();
  group.name = "ScenicWest_CloudLayer";

  const clouds = [
    { x: -94, y: 24, z: 36, scale: 2.8 },
    { x: -48, y: 30, z: 28, scale: 3.5 },
    { x: -72, y: 26, z: -58, scale: 2.5 },
    { x: -18, y: 32, z: -42, scale: 3.2 }
  ] as const;

  for (const cloud of clouds) {
    group.add(createCloudCluster(cloud.x, cloud.y, cloud.z, cloud.scale));
  }

  return group;
}

function createCloudCluster(x: number, y: number, z: number, scale: number): THREE.Group {
  const group = new THREE.Group();
  group.name = "ScenicWest_Cloud";
  group.position.set(x, y, z);
  group.scale.setScalar(scale);

  const material = new THREE.MeshStandardMaterial({
    color: 0xf7fbff,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.9
  });
  const geometry = new THREE.DodecahedronGeometry(1, 0);
  const blobs = [
    { x: -0.9, y: 0.0, z: 0.0, sx: 1.0, sy: 0.55, sz: 0.55 },
    { x: -0.2, y: 0.22, z: 0.02, sx: 1.2, sy: 0.72, sz: 0.62 },
    { x: 0.72, y: 0.05, z: -0.02, sx: 1.05, sy: 0.58, sz: 0.58 },
    { x: 1.35, y: -0.02, z: 0.0, sx: 0.74, sy: 0.42, sz: 0.42 }
  ] as const;

  for (const blob of blobs) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(blob.x, blob.y, blob.z);
    mesh.scale.set(blob.sx, blob.sy, blob.sz);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
  }

  return group;
}

function createFlatRibbon(
  points: readonly Point2[],
  width: number,
  y: number,
  material: THREE.Material
): THREE.Mesh {
  const smoothPoints = sampleSmoothPoints(points, y);
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let index = 0; index < smoothPoints.length; index += 1) {
    const point = smoothPoints[index];
    if (!point) {
      continue;
    }
    const previous = smoothPoints[Math.max(0, index - 1)] ?? point;
    const next = smoothPoints[Math.min(smoothPoints.length - 1, index + 1)] ?? point;
    const tangent = new THREE.Vector2(next.x - previous.x, next.z - previous.z).normalize();
    const side = new THREE.Vector2(-tangent.y, tangent.x);
    const half = width * 0.5;
    vertices.push(point.x + side.x * half, point.y, point.z + side.y * half);
    vertices.push(point.x - side.x * half, point.y, point.z - side.y * half);
  }

  for (let index = 0; index < smoothPoints.length - 1; index += 1) {
    const base = index * 2;
    const next = (index + 1) * 2;
    indices.push(base, next, base + 1, base + 1, next, next + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function sampleSmoothPoints(points: readonly Point2[], y: number): THREE.Vector3[] {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point.x, y, point.z)));
  return curve.getPoints(Math.max(12, points.length * 5));
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

  const h00 = heights[z0 * gridX + x0] ?? 0;
  const h10 = heights[z0 * gridX + x1] ?? h00;
  const h01 = heights[z1 * gridX + x0] ?? h00;
  const h11 = heights[z1 * gridX + x1] ?? h00;
  const hx0 = THREE.MathUtils.lerp(h00, h10, fx);
  const hx1 = THREE.MathUtils.lerp(h01, h11, fx);
  return THREE.MathUtils.lerp(hx0, hx1, fz);
}
