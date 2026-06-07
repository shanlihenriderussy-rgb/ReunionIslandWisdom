import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const requireFromClient = createRequire(path.join(root, "apps/game-client/package.json"));
const fromClient = (specifier) => pathToFileURL(requireFromClient.resolve(specifier)).href;
const THREE = await import(fromClient("three"));
const { GLTFExporter } = await import(fromClient("three/examples/jsm/exporters/GLTFExporter.js"));
const { STLLoader } = await import(fromClient("three/examples/jsm/loaders/STLLoader.js"));

const outlinePath = path.join(root, "packages/assets/sources/lareunion/lareunion-osm-outline.geojson");
const stlPath = path.join(root, "packages/assets/sources/lareunion/LaReunion.stl");
const outputDir = path.join(root, "apps/game-client/public/assets/terrain/lareunion");
const glbPath = path.join(outputDir, "lareunion-relief-map.glb");
const collisionPath = path.join(outputDir, "lareunion-relief-collision.json");
const manifestPath = path.join(outputDir, "relief-map-manifest.json");

const targetLongestSide = 155;
const gridX = 160;
const gridZ = 144;
const verticalExaggeration = 1;
const coastlineY = 0.04;
const seaFloorY = -0.45;
const spawnFlattenRadius = 5;
const spawnFlattenBlend = 7;

class NodeFileReader {
  result = null;
  onloadend = null;

  readAsArrayBuffer(blob) {
    void blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }

  readAsDataURL(blob) {
    void blob.arrayBuffer().then((buffer) => {
      const base64 = Buffer.from(buffer).toString("base64");
      this.result = `data:${blob.type || "application/octet-stream"};base64,${base64}`;
      this.onloadend?.();
    });
  }
}

globalThis.FileReader = NodeFileReader;

function exportGlb(scene) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(scene, resolve, reject, {
      binary: true,
      includeCustomExtensions: false,
      trs: false
    });
  });
}

function perpendicularDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }
  return Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / Math.hypot(dx, dy);
}

function simplifyRdp(points, tolerance) {
  if (points.length <= 2) {
    return points;
  }

  let maxDistance = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance <= tolerance) {
    return [start, end];
  }

  const left = simplifyRdp(points.slice(0, index + 1), tolerance);
  const right = simplifyRdp(points.slice(index), tolerance);
  return left.slice(0, -1).concat(right);
}

function simplifyClosedRingByDistance(points, minDistance) {
  const simplified = [];
  let previous = points[0];
  if (!previous) {
    return simplified;
  }
  simplified.push(previous);

  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (!point) {
      continue;
    }
    if (Math.hypot(point.x - previous.x, point.z - previous.z) >= minDistance) {
      simplified.push(point);
      previous = point;
    }
  }

  return simplified;
}

function removeClosingDuplicate(points) {
  if (points.length < 2) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];
  if (first.x === last.x && first.z === last.z) {
    return points.slice(0, -1);
  }
  return points;
}

function pointInPolygon(x, z, polygon) {
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

function projectOutline(ring) {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const lonWidth = (maxLon - minLon) * cosLat;
  const latHeight = maxLat - minLat;
  const scale = targetLongestSide / Math.max(lonWidth, latHeight);
  const rawPoints = ring.map(([lon, lat]) => ({
    x: (lon - centerLon) * cosLat * scale,
    z: (lat - centerLat) * scale
  }));
  const openPoints = removeClosingDuplicate(rawPoints);
  const points = simplifyClosedRingByDistance(openPoints, 0.22);

  return {
    points,
    bounds: {
      minX: -targetLongestSide / 2,
      maxX: targetLongestSide / 2,
      minZ: -(latHeight * scale) / 2,
      maxZ: (latHeight * scale) / 2
    }
  };
}

function createHeightfield(stlGeometry, bounds, outline) {
  stlGeometry.computeBoundingBox();
  const box = stlGeometry.boundingBox;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const scale = targetLongestSide / Math.max(size.x, size.y);

  const heights = Array.from({ length: gridX * gridZ }, () => Number.NaN);
  const counts = Array.from({ length: gridX * gridZ }, () => 0);
  const positions = stlGeometry.getAttribute("position");

  for (let i = 0; i < positions.count; i += 1) {
    const x = (positions.getX(i) - center.x) * scale;
    const z = -(positions.getY(i) - center.y) * scale;
    const h = (positions.getZ(i) - box.min.z) * scale * verticalExaggeration;
    const gx = Math.round(((x - bounds.minX) / (bounds.maxX - bounds.minX)) * (gridX - 1));
    const gz = Math.round(((z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * (gridZ - 1));
    if (gx < 0 || gx >= gridX || gz < 0 || gz >= gridZ) {
      continue;
    }

    const index = gz * gridX + gx;
    heights[index] = Number.isNaN(heights[index]) ? h : Math.max(heights[index], h);
    counts[index] += 1;
  }

  for (let pass = 0; pass < 28; pass += 1) {
    const next = heights.slice();
    for (let z = 0; z < gridZ; z += 1) {
      for (let x = 0; x < gridX; x += 1) {
        const index = z * gridX + x;
        if (!Number.isNaN(heights[index])) {
          continue;
        }

        let sum = 0;
        let count = 0;
        for (let dz = -1; dz <= 1; dz += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dz === 0) {
              continue;
            }
            const nx = x + dx;
            const nz = z + dz;
            if (nx < 0 || nx >= gridX || nz < 0 || nz >= gridZ) {
              continue;
            }
            const value = heights[nz * gridX + nx];
            if (!Number.isNaN(value)) {
              sum += value;
              count += 1;
            }
          }
        }
        if (count > 0) {
          next[index] = sum / count;
        }
      }
    }
    for (let i = 0; i < heights.length; i += 1) {
      heights[i] = next[i];
    }
  }

  let centerSum = 0;
  let centerCount = 0;
  for (let z = 0; z < gridZ; z += 1) {
    for (let x = 0; x < gridX; x += 1) {
      const worldX = bounds.minX + (x / (gridX - 1)) * (bounds.maxX - bounds.minX);
      const worldZ = bounds.minZ + (z / (gridZ - 1)) * (bounds.maxZ - bounds.minZ);
      const index = z * gridX + x;
      if (!pointInPolygon(worldX, worldZ, outline) || Number.isNaN(heights[index])) {
        heights[index] = seaFloorY;
        continue;
      }
      if (Math.hypot(worldX, worldZ) < 6) {
        centerSum += heights[index];
        centerCount += 1;
      }
    }
  }

  const centerHeight = centerCount > 0 ? centerSum / centerCount : 0;
  for (let z = 0; z < gridZ; z += 1) {
    for (let x = 0; x < gridX; x += 1) {
      const worldX = bounds.minX + (x / (gridX - 1)) * (bounds.maxX - bounds.minX);
      const worldZ = bounds.minZ + (z / (gridZ - 1)) * (bounds.maxZ - bounds.minZ);
      const index = z * gridX + x;
      if (!pointInPolygon(worldX, worldZ, outline)) {
        continue;
      }

      let height = heights[index] - centerHeight;
      const distance = Math.hypot(worldX, worldZ);
      if (distance < spawnFlattenRadius + spawnFlattenBlend) {
        const t = Math.min(1, Math.max(0, (distance - spawnFlattenRadius) / spawnFlattenBlend));
        height = THREE.MathUtils.lerp(0, height, t);
      }
      heights[index] = Math.max(-0.18, height);
    }
  }

  return {
    heights,
    sourceVertices: positions.count,
    filledSamples: counts.filter((count) => count > 0).length
  };
}

function createReliefMesh(bounds, outline, heights) {
  const vertices = [];
  const indices = [];
  for (let z = 0; z < gridZ; z += 1) {
    for (let x = 0; x < gridX; x += 1) {
      const worldX = bounds.minX + (x / (gridX - 1)) * (bounds.maxX - bounds.minX);
      const worldZ = bounds.minZ + (z / (gridZ - 1)) * (bounds.maxZ - bounds.minZ);
      const height = heights[z * gridX + x];
      vertices.push(worldX, height, worldZ);
    }
  }

  for (let z = 0; z < gridZ - 1; z += 1) {
    for (let x = 0; x < gridX - 1; x += 1) {
      const centerX = bounds.minX + ((x + 0.5) / (gridX - 1)) * (bounds.maxX - bounds.minX);
      const centerZ = bounds.minZ + ((z + 0.5) / (gridZ - 1)) * (bounds.maxZ - bounds.minZ);
      if (!pointInPolygon(centerX, centerZ, outline)) {
        continue;
      }

      const a = z * gridX + x;
      const b = a + 1;
      const c = (z + 1) * gridX + x;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x5f8f48,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide
    })
  );
}

function createCoastline(points) {
  const vertices = [];
  for (const point of points) {
    vertices.push(point.x, coastlineY, point.z);
  }
  const first = points[0];
  vertices.push(first.x, coastlineY, first.z);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xf3d389 }));
}

async function main() {
  const geojson = JSON.parse(fs.readFileSync(outlinePath, "utf8"));
  const outlineRing = geojson.features?.[0]?.geometry?.coordinates?.[0];
  if (!Array.isArray(outlineRing)) {
    throw new Error("Contour OSM invalide.");
  }

  const { points: outline, bounds } = projectOutline(outlineRing);
  const stlSource = fs.readFileSync(stlPath);
  const stlBuffer = stlSource.buffer.slice(stlSource.byteOffset, stlSource.byteOffset + stlSource.byteLength);
  const stlGeometry = new STLLoader().parse(stlBuffer);
  const { heights, sourceVertices, filledSamples } = createHeightfield(stlGeometry, bounds, outline);

  const relief = createReliefMesh(bounds, outline, heights);
  relief.name = "LaReunionReliefTerrain";
  relief.receiveShadow = true;
  relief.castShadow = false;

  const coastline = createCoastline(outline);
  coastline.name = "LaReunionCoastline";

  const scene = new THREE.Scene();
  scene.name = "LaReunionReliefMap";
  scene.add(relief, coastline);

  fs.mkdirSync(outputDir, { recursive: true });
  const glb = await exportGlb(scene);
  fs.writeFileSync(glbPath, Buffer.from(glb));

  const collision = {
    bounds,
    gridX,
    gridZ,
    outline,
    heights: heights.map((height) => Number(height.toFixed(4)))
  };
  fs.writeFileSync(collisionPath, `${JSON.stringify(collision)}\n`);

  const manifest = {
    sourceOutline: "packages/assets/sources/lareunion/lareunion-osm-outline.geojson",
    sourceRelief: "packages/assets/sources/lareunion/LaReunion.stl",
    license: geojson.licence,
    targetLongestSide,
    gridX,
    gridZ,
    verticalExaggeration,
    spawnFlattenRadius,
    spawnFlattenBlend,
    sourceVertices,
    filledSamples,
    outlinePoints: outline.length,
    glbBytes: fs.statSync(glbPath).size,
    collisionBytes: fs.statSync(collisionPath).size,
    reliefMap: "/assets/terrain/lareunion/lareunion-relief-map.glb",
    collision: "/assets/terrain/lareunion/lareunion-relief-collision.json"
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
