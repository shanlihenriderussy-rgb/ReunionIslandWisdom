import * as THREE from "three";
import { terrainAssets } from "@riw/assets";
import {
  WEST_BLOCKOUT_BOUNDARY_MARKERS,
  WEST_BLOCKOUT_PATH,
  WEST_BLOCKOUT_QUEST_MARKERS,
  type BlockoutMarker,
  type BlockoutPoint
} from "../world/westBlockout";

type TerrainCollisionData = {
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  gridX: number;
  gridZ: number;
  heights: number[];
};

const trailMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.96,
  metalness: 0,
  transparent: true,
  opacity: 0.94,
  depthWrite: false,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2
});

const boundaryMaterial = new THREE.MeshStandardMaterial({
  color: 0x4d5048,
  roughness: 0.92,
  metalness: 0
});

const trailSampleSpacing = 1.15;
const trailHeightOffset = 0.14;
const trailWidth = 2.55;
const mafateLookTarget = new THREE.Vector2(-31.2, 22.7);

export function addWestBlockout(scene: THREE.Scene): void {
  void fetch(terrainAssets.laReunion.reliefCollision)
    .then((response) => (response.ok ? response.json() : null))
    .then((terrain: TerrainCollisionData | null) => {
      if (!terrain) {
        return;
      }
      const group = new THREE.Group();
      group.name = "Blockout_SaintPaulSaintGilles";
      group.add(createTrailRibbon(WEST_BLOCKOUT_PATH, terrain, trailWidth));
      for (const marker of WEST_BLOCKOUT_QUEST_MARKERS) {
        group.add(createQuestMarker(marker, terrain));
      }
      for (const marker of WEST_BLOCKOUT_BOUNDARY_MARKERS) {
        group.add(createBoundaryMarker(marker, terrain));
      }
      scene.add(group);
    })
    .catch((error: unknown) => {
      console.warn("West blockout generation failed", error);
    });
}

function createTrailRibbon(
  points: readonly BlockoutPoint[],
  terrain: TerrainCollisionData,
  width: number
): THREE.Mesh {
  const centers = createTerrainAwareCenters(points, terrain);
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const outer = new THREE.Color(0x5c371d);
  const shoulder = new THREE.Color(0x8a562c);
  const center = new THREE.Color(0xc68442);
  const crossSection = [
    { offset: -0.5, lift: 0.002, color: outer },
    { offset: -0.28, lift: 0.014, color: shoulder },
    { offset: 0, lift: 0.03, color: center },
    { offset: 0.28, lift: 0.014, color: shoulder },
    { offset: 0.5, lift: 0.002, color: outer }
  ] as const;

  for (let index = 0; index < centers.length; index += 1) {
    const point = centers[index];
    if (!point) {
      continue;
    }
    const previous = centers[Math.max(0, index - 1)] ?? point;
    const next = centers[Math.min(centers.length - 1, index + 1)] ?? point;
    const tangent = new THREE.Vector2(next.x - previous.x, next.z - previous.z).normalize();
    const side = new THREE.Vector2(-tangent.y, tangent.x);
    const baseY = sampleHeight(terrain, point.x, point.z) + trailHeightOffset;

    for (const section of crossSection) {
      const offset = section.offset * width;
      vertices.push(point.x + side.x * offset, baseY + section.lift, point.z + side.y * offset);
      colors.push(section.color.r, section.color.g, section.color.b);
    }
  }

  const rowSize = crossSection.length;
  for (let index = 0; index < centers.length - 1; index += 1) {
    const base = index * rowSize;
    const next = (index + 1) * rowSize;
    for (let column = 0; column < rowSize - 1; column += 1) {
      indices.push(base + column, next + column, base + column + 1);
      indices.push(base + column + 1, next + column, next + column + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = trailMaterial.clone();
  material.vertexColors = true;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "Blockout_West_MainTrail";
  mesh.renderOrder = 2;
  return mesh;
}

function createTerrainAwareCenters(
  points: readonly BlockoutPoint[],
  terrain: TerrainCollisionData
): readonly BlockoutPoint[] {
  const dense = densifyPath(points);
  const adjusted = dense.map((point, index) => {
    if (index === 0 || index === dense.length - 1) {
      return point;
    }

    const previous = dense[index - 1] ?? point;
    const next = dense[index + 1] ?? point;
    const tangent = new THREE.Vector2(next.x - previous.x, next.z - previous.z).normalize();
    const side = new THREE.Vector2(-tangent.y, tangent.x);
    let best = point;
    let bestCost = terrainTrailCost(terrain, point.x, point.z);

    for (const offset of [-0.7, -0.45, -0.22, 0.22, 0.45, 0.7]) {
      const candidate = {
        x: point.x + side.x * offset,
        z: point.z + side.y * offset,
        label: point.label
      };
      const cost = terrainTrailCost(terrain, candidate.x, candidate.z) + Math.abs(offset) * 0.08;
      if (cost < bestCost) {
        best = candidate;
        bestCost = cost;
      }
    }
    return best;
  });

  return smoothPath(adjusted, 2);
}

function densifyPath(points: readonly BlockoutPoint[]): BlockoutPoint[] {
  const out: BlockoutPoint[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    if (!a || !b) {
      continue;
    }
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(1, Math.ceil(length / trailSampleSpacing));
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      out.push({
        x: THREE.MathUtils.lerp(a.x, b.x, t),
        z: THREE.MathUtils.lerp(a.z, b.z, t),
        label: a.label
      });
    }
  }
  const last = points[points.length - 1];
  if (last) {
    out.push(last);
  }
  return out;
}

function smoothPath(points: readonly BlockoutPoint[], passes: number): BlockoutPoint[] {
  let current = [...points];
  for (let pass = 0; pass < passes; pass += 1) {
    const next: BlockoutPoint[] = [];
    for (let index = 0; index < current.length - 1; index += 1) {
      const a = current[index];
      const b = current[index + 1];
      if (!a || !b) {
        continue;
      }
      if (index === 0) {
        next.push(a);
      }
      next.push(
        {
          x: THREE.MathUtils.lerp(a.x, b.x, 0.35),
          z: THREE.MathUtils.lerp(a.z, b.z, 0.35),
          label: a.label
        },
        {
          x: THREE.MathUtils.lerp(a.x, b.x, 0.65),
          z: THREE.MathUtils.lerp(a.z, b.z, 0.65),
          label: b.label
        }
      );
      if (index === current.length - 2) {
        next.push(b);
      }
    }
    current = next;
  }
  return current;
}

function terrainTrailCost(terrain: TerrainCollisionData, x: number, z: number): number {
  const h = sampleHeight(terrain, x, z);
  const dx = Math.abs(sampleHeight(terrain, x + 0.85, z) - sampleHeight(terrain, x - 0.85, z));
  const dz = Math.abs(sampleHeight(terrain, x, z + 0.85) - sampleHeight(terrain, x, z - 0.85));
  const roughness = Math.max(dx, dz);
  const highPenalty = Math.max(0, h - 6.4) * 0.1;
  return roughness + highPenalty;
}

function createQuestMarker(marker: BlockoutMarker, terrain: TerrainCollisionData): THREE.Object3D {
  const group = new THREE.Group();
  group.name = `BlockoutQuest_${marker.id}`;
  group.position.set(marker.x, sampleHeight(terrain, marker.x, marker.z) + 0.16, marker.z);

  const material = new THREE.MeshStandardMaterial({
    color: marker.color,
    emissive: marker.color,
    emissiveIntensity: 0.12,
    roughness: 0.62,
    metalness: 0
  });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.08, 8, 28), material);
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = false;
  ring.receiveShadow = true;

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.3, 6), material);
  pole.position.y = 0.65;
  pole.castShadow = true;

  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.38, 0.08), material);
  flag.position.set(0.36, 1.15, 0);
  flag.castShadow = true;

  group.add(ring, pole, flag);
  if (marker.id === "maido-viewpoint") {
    group.add(createViewCone(marker, terrain));
  }
  return group;
}

function createViewCone(marker: BlockoutMarker, terrain: TerrainCollisionData): THREE.Mesh {
  const localTarget = new THREE.Vector2(mafateLookTarget.x - marker.x, mafateLookTarget.y - marker.z);
  const dir = localTarget.normalize();
  const side = new THREE.Vector2(-dir.y, dir.x);
  const length = 8.2;
  const width = 5.6;
  const y = 0.08;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        0, y, 0,
        dir.x * length + side.x * width * 0.5, y + 0.02, dir.y * length + side.y * width * 0.5,
        dir.x * length - side.x * width * 0.5, y + 0.02, dir.y * length - side.y * width * 0.5
      ],
      3
    )
  );
  geometry.setIndex([0, 1, 2]);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color: marker.color,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const cone = new THREE.Mesh(geometry, material);
  cone.name = "ViewCone_Maido_Mafate";
  cone.position.y = sampleHeight(terrain, marker.x, marker.z) + 0.2 - (sampleHeight(terrain, marker.x, marker.z) + 0.16);
  cone.renderOrder = 3;
  return cone;
}

function createBoundaryMarker(marker: BlockoutMarker, terrain: TerrainCollisionData): THREE.Object3D {
  const group = new THREE.Group();
  group.name = `BlockoutBoundary_${marker.id}`;
  group.position.set(marker.x, sampleHeight(terrain, marker.x, marker.z) + 0.05, marker.z);

  const material = boundaryMaterial.clone();
  material.color.setHex(marker.color);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), material);
  rock.scale.set(1.2, 0.58, 0.92);
  rock.rotation.set(0.2, marker.x * 0.17, -0.12);
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);
  return group;
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
