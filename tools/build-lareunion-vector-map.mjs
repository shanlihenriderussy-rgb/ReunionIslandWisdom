import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const requireFromClient = createRequire(path.join(root, "apps/game-client/package.json"));
const fromClient = (specifier) => pathToFileURL(requireFromClient.resolve(specifier)).href;
const THREE = await import(fromClient("three"));
const { GLTFExporter } = await import(fromClient("three/examples/jsm/exporters/GLTFExporter.js"));

const sourcePath = path.join(root, "packages/assets/sources/lareunion/lareunion-osm-outline.geojson");
const outputDir = path.join(root, "apps/game-client/public/assets/terrain/lareunion");
const outputPath = path.join(outputDir, "lareunion-vector-map.glb");
const manifestPath = path.join(outputDir, "vector-map-manifest.json");

const targetLongestSide = 155;
const simplifyTolerance = 0.12;
const landY = -0.08;
const coastlineY = -0.015;

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

function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
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

function removeClosingDuplicate(points) {
  if (points.length < 2) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];
  if (first.x === last.x && first.y === last.y) {
    return points.slice(0, -1);
  }
  return points;
}

function projectRing(ring, bounds) {
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const lonWidth = (bounds.maxLon - bounds.minLon) * cosLat;
  const latHeight = bounds.maxLat - bounds.minLat;
  const scale = targetLongestSide / Math.max(lonWidth, latHeight);

  return ring.map(([lon, lat]) => ({
    x: (lon - centerLon) * cosLat * scale,
    y: (lat - centerLat) * scale
  }));
}

function transformShapeGeometry(geometry, y) {
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getY(i);
    position.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
}

function createCoastline(points) {
  const vertices = [];
  for (const point of points) {
    vertices.push(point.x, coastlineY, point.y);
  }
  const first = points[0];
  vertices.push(first.x, coastlineY, first.y);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: 0xf3d389, linewidth: 2 })
  );
}

async function main() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`GeoJSON introuvable: ${sourcePath}`);
  }

  const geojson = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const feature = geojson.features?.[0];
  const geometry = feature?.geometry;
  if (!geometry || geometry.type !== "Polygon") {
    throw new Error("GeoJSON attendu: FeatureCollection avec Polygon en premiere feature.");
  }

  const outerRing = geometry.coordinates[0];
  const bounds = {
    minLon: Infinity,
    minLat: Infinity,
    maxLon: -Infinity,
    maxLat: -Infinity
  };

  for (const [lon, lat] of outerRing) {
    bounds.minLon = Math.min(bounds.minLon, lon);
    bounds.maxLon = Math.max(bounds.maxLon, lon);
    bounds.minLat = Math.min(bounds.minLat, lat);
    bounds.maxLat = Math.max(bounds.maxLat, lat);
  }

  let points = removeClosingDuplicate(projectRing(outerRing, bounds));
  points = simplifyRdp(points.concat(points[0]), simplifyTolerance);
  points = removeClosingDuplicate(points);
  if (signedArea(points) < 0) {
    points = points.reverse();
  }

  const shape = new THREE.Shape(points);
  const landGeometry = new THREE.ShapeGeometry(shape);
  transformShapeGeometry(landGeometry, landY);

  const land = new THREE.Mesh(
    landGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x5a8a4a,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide
    })
  );
  land.name = "LaReunionVectorLand";
  land.receiveShadow = true;

  const coastline = createCoastline(points);
  coastline.name = "LaReunionCoastline";

  const scene = new THREE.Scene();
  scene.name = "LaReunionVectorMap";
  scene.add(land, coastline);

  fs.mkdirSync(outputDir, { recursive: true });
  const glb = await exportGlb(scene);
  fs.writeFileSync(outputPath, Buffer.from(glb));

  const manifest = {
    source: "packages/assets/sources/lareunion/lareunion-osm-outline.geojson",
    license: geojson.licence,
    osmId: feature.properties?.osm_id,
    targetLongestSide,
    simplifyTolerance,
    sourcePoints: outerRing.length,
    runtimePoints: points.length,
    bytes: fs.statSync(outputPath).size,
    file: "/assets/terrain/lareunion/lareunion-vector-map.glb"
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
