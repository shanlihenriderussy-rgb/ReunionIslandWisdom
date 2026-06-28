import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const requireFromClient = createRequire(path.join(root, "apps/game-client/package.json"));
const fromClient = (specifier) => pathToFileURL(requireFromClient.resolve(specifier)).href;
const THREE = await import(fromClient("three"));
const { GLTFExporter } = await import(fromClient("three/examples/jsm/exporters/GLTFExporter.js"));

const defaultSourceDir = path.join(root, "packages/assets/sources/lareunion/rgealti");
const outlinePath = path.join(root, "packages/assets/sources/lareunion/lareunion-osm-outline.geojson");
const outputDir = path.join(root, "apps/game-client/public/assets/terrain/lareunion");
const chunkOutputDir = path.join(outputDir, "chunks");
const glbPath = path.join(outputDir, "lareunion-relief-map.glb");
const collisionPath = path.join(outputDir, "lareunion-relief-collision.json");
const heightfieldPath = path.join(outputDir, "lareunion-heightfield.json");
const manifestPath = path.join(outputDir, "relief-map-manifest.json");
const chunkManifestPath = path.join(chunkOutputDir, "manifest.json");

const args = parseArgs(process.argv.slice(2));
const sourceDir = path.resolve(args.source ?? defaultSourceDir);
const targetLongestSide = readNumberArg("targetLongestSide", 220);
const gridX = readNumberArg("gridX", 640);
const gridZ = readNumberArg("gridZ", 576);
const chunkCountX = readNumberArg("chunkCountX", 4);
const chunkCountZ = readNumberArg("chunkCountZ", 4);
const verticalExaggeration = readNumberArg("verticalExaggeration", 1.15);
const coastlineY = 0.04;
const seaFloorY = -0.42;
const terrainSourceName = "IGN RGE ALTI D974";
const terrainProjection = {
  name: "RGR92 / UTM zone 40S",
  epsg: 2975,
  zone: "40S",
  units: "meters",
  falseEasting: 500000,
  falseNorthing: 10000000
};
const terrainPerfBudget = {
  desktopFps: 60,
  mobileFps: 30,
  scope: "terrain seul"
};
const terrainLodContract = [
  {
    level: 0,
    label: "full",
    source: "generated",
    chunkRadius: 1
  },
  {
    level: 1,
    label: "mobile-low",
    source: "pending-generation",
    chunkRadius: 2
  }
];

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

function parseArgs(entries) {
  const parsed = {};
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (!entry?.startsWith("--")) {
      continue;
    }
    const key = entry.slice(2);
    const value = entries[i + 1];
    if (!value || value.startsWith("--")) {
      parsed[key] = "true";
    } else {
      parsed[key] = value;
      i += 1;
    }
  }
  return parsed;
}

function readNumberArg(key, fallback) {
  const raw = args[key];
  if (typeof raw !== "string") {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Argument invalide --${key}: ${raw}`);
  }
  return value;
}

async function exportGlb(scene) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(scene, resolve, reject, {
      binary: true,
      includeCustomExtensions: false,
      trs: false
    });
  });
}

async function listSourceFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const found = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...await listSourceFiles(fullPath));
      continue;
    }
    if (/\.(asc|txt|tif|tiff)$/i.test(entry.name)) {
      found.push(fullPath);
    }
  }
  return found;
}

async function readAscHeader(filePath) {
  const stream = fs.createReadStream(filePath, "utf8");
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const header = {};
  let lineCount = 0;

  for await (const line of rl) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      header[parts[0].toLowerCase()] = Number(parts[1]);
      lineCount += 1;
    }
    if (lineCount >= 6) {
      break;
    }
  }
  rl.close();
  stream.destroy();

  const ncols = header.ncols;
  const nrows = header.nrows;
  const cellsize = header.cellsize;
  const nodata = header.nodata_value ?? -9999;
  const xll = header.xllcorner ?? header.xllcenter;
  const yll = header.yllcorner ?? header.yllcenter;
  const centerOffset = header.xllcenter !== undefined || header.yllcenter !== undefined ? 0 : 0.5;

  if (![ncols, nrows, cellsize, xll, yll].every(Number.isFinite)) {
    throw new Error(`Header ASC invalide: ${filePath}`);
  }

  return {
    filePath,
    kind: "asc",
    ncols,
    nrows,
    cellsize,
    nodata,
    centerOffset,
    minX: xll,
    maxX: xll + ncols * cellsize,
    minY: yll,
    maxY: yll + nrows * cellsize
  };
}

async function readTiffHeader(filePath) {
  let geotiff;
  try {
    geotiff = await import("geotiff");
  } catch {
    throw new Error(
      `GeoTIFF detecte mais dependency absente. Ajoute geotiff ou fournis les tuiles RGE ALTI en .asc: ${filePath}`
    );
  }

  const tiff = await geotiff.fromFile(filePath);
  const image = await tiff.getImage();
  const bbox = image.getBoundingBox();
  const [minX, minY, maxX, maxY] = bbox;
  const resolution = image.getResolution?.();
  const geoKeys = image.getGeoKeys?.();
  if (![minX, minY, maxX, maxY].every(Number.isFinite) || minX >= maxX || minY >= maxY) {
    throw new Error(`Bounding box GeoTIFF invalide: ${filePath}`);
  }
  return {
    filePath,
    kind: "tiff",
    image,
    width: image.getWidth(),
    height: image.getHeight(),
    minX,
    maxX,
    minY,
    maxY,
    nodata: image.getGDALNoData(),
    resolution: Array.isArray(resolution) ? resolution : undefined,
    geoKeys
  };
}

async function readSourceHeaders(files) {
  const headers = [];
  for (const file of files) {
    if (/\.(tif|tiff)$/i.test(file)) {
      headers.push(await readTiffHeader(file));
    } else {
      headers.push(await readAscHeader(file));
    }
  }
  return headers;
}

function mergeBounds(headers) {
  return {
    minX: Math.min(...headers.map((header) => header.minX)),
    maxX: Math.max(...headers.map((header) => header.maxX)),
    minY: Math.min(...headers.map((header) => header.minY)),
    maxY: Math.max(...headers.map((header) => header.maxY))
  };
}

function createWorldMapping(sourceBounds) {
  const sourceWidth = sourceBounds.maxX - sourceBounds.minX;
  const sourceHeight = sourceBounds.maxY - sourceBounds.minY;
  const metersToWorldScale = targetLongestSide / Math.max(sourceWidth, sourceHeight);
  const centerEasting = (sourceBounds.minX + sourceBounds.maxX) / 2;
  const centerNorthing = (sourceBounds.minY + sourceBounds.maxY) / 2;
  return {
    projection: terrainProjection,
    sourceBounds,
    center: {
      easting: Number(centerEasting.toFixed(3)),
      northing: Number(centerNorthing.toFixed(3))
    },
    metersToWorldScale,
    targetLongestSide,
    worldBounds: {
      minX: Number((-(sourceWidth / 2) * metersToWorldScale).toFixed(4)),
      maxX: Number(((sourceWidth / 2) * metersToWorldScale).toFixed(4)),
      minZ: Number((-(sourceHeight / 2) * metersToWorldScale).toFixed(4)),
      maxZ: Number(((sourceHeight / 2) * metersToWorldScale).toFixed(4))
    }
  };
}

function projectOutlineToGame(ring, mapping) {
  const projected = ring.map(([lon, lat]) => lonLatToUtm40S(lon, lat));
  return projected.map((point) => ({
    x: (point.x - mapping.center.easting) * mapping.metersToWorldScale,
    z: (point.y - mapping.center.northing) * mapping.metersToWorldScale
  }));
}

function lonLatToUtm40S(lon, lat) {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e = Math.sqrt(f * (2 - f));
  const e2 = e * e;
  const ep2 = e2 / (1 - e2);
  const lon0 = degToRad(57);
  const phi = degToRad(lat);
  const lambda = degToRad(lon);
  const n = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const t = Math.tan(phi) ** 2;
  const c = ep2 * Math.cos(phi) ** 2;
  const aa = Math.cos(phi) * (lambda - lon0);
  const m =
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * phi -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * phi) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * phi));
  const x =
    k0 *
      n *
      (aa +
        ((1 - t + c) * aa ** 3) / 6 +
        ((5 - 18 * t + t ** 2 + 72 * c - 58 * ep2) * aa ** 5) / 120) +
    500000;
  const y =
    k0 *
      (m +
        n *
          Math.tan(phi) *
          ((aa ** 2) / 2 +
            ((5 - t + 9 * c + 4 * c ** 2) * aa ** 4) / 24 +
            ((61 - 58 * t + t ** 2 + 600 * c - 330 * ep2) * aa ** 6) / 720));
  return { x, y: y < 0 ? y + 10000000 : y };
}

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function worldFromSource(x, y, mapping) {
  return {
    x: (x - mapping.center.easting) * mapping.metersToWorldScale,
    z: (y - mapping.center.northing) * mapping.metersToWorldScale,
    scale: mapping.metersToWorldScale
  };
}

async function fillFromAsc(header, sourceBounds, accum) {
  const targetCellMetersX = (sourceBounds.maxX - sourceBounds.minX) / gridX;
  const targetCellMetersY = (sourceBounds.maxY - sourceBounds.minY) / gridZ;
  const sampleEvery = Math.max(1, Math.floor(Math.min(targetCellMetersX, targetCellMetersY) / header.cellsize / 2));
  const stream = fs.createReadStream(header.filePath, "utf8");
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let row = -6;

  for await (const line of rl) {
    row += 1;
    if (row < 0 || row % sampleEvery !== 0) {
      continue;
    }

    const y = header.minY + (header.nrows - 1 - row + header.centerOffset) * header.cellsize;
    const targetZ = Math.floor(((y - sourceBounds.minY) / (sourceBounds.maxY - sourceBounds.minY)) * (gridZ - 1));
    if (targetZ < 0 || targetZ >= gridZ) {
      continue;
    }

    const values = line.trim().split(/\s+/);
    for (let col = 0; col < values.length; col += sampleEvery) {
      const elevation = Number(values[col]);
      if (!Number.isFinite(elevation) || elevation === header.nodata) {
        continue;
      }
      const x = header.minX + (col + header.centerOffset) * header.cellsize;
      const targetX = Math.floor(((x - sourceBounds.minX) / (sourceBounds.maxX - sourceBounds.minX)) * (gridX - 1));
      if (targetX < 0 || targetX >= gridX) {
        continue;
      }
      addSample(accum, targetZ * gridX + targetX, elevation);
    }
  }
}

async function fillFromTiff(header, sourceBounds, accum) {
  const maxReadWidth = Math.min(header.width, gridX * 3);
  const maxReadHeight = Math.min(header.height, gridZ * 3);
  const raster = await header.image.readRasters({
    width: maxReadWidth,
    height: maxReadHeight,
    interleave: true
  });
  const nodata = Number(header.nodata);

  for (let yIndex = 0; yIndex < maxReadHeight; yIndex += 1) {
    const sourceY = header.maxY - (yIndex / Math.max(1, maxReadHeight - 1)) * (header.maxY - header.minY);
    const targetZ = Math.floor(((sourceY - sourceBounds.minY) / (sourceBounds.maxY - sourceBounds.minY)) * (gridZ - 1));
    if (targetZ < 0 || targetZ >= gridZ) {
      continue;
    }

    for (let xIndex = 0; xIndex < maxReadWidth; xIndex += 1) {
      const elevation = Number(raster[yIndex * maxReadWidth + xIndex]);
      if (!Number.isFinite(elevation) || elevation === nodata) {
        continue;
      }
      const sourceX = header.minX + (xIndex / Math.max(1, maxReadWidth - 1)) * (header.maxX - header.minX);
      const targetX = Math.floor(((sourceX - sourceBounds.minX) / (sourceBounds.maxX - sourceBounds.minX)) * (gridX - 1));
      if (targetX < 0 || targetX >= gridX) {
        continue;
      }
      addSample(accum, targetZ * gridX + targetX, elevation);
    }
  }
}

function addSample(accum, index, value) {
  accum.sums[index] += value;
  accum.counts[index] += 1;
}

function finalizeHeights(accum, sourceBounds) {
  const heightsMeters = accum.sums.map((sum, index) => {
    const count = accum.counts[index];
    return count > 0 ? sum / count : Number.NaN;
  });

  fillMissing(heightsMeters);

  let minElevation = Infinity;
  let maxElevation = -Infinity;
  for (const height of heightsMeters) {
    if (!Number.isFinite(height)) {
      continue;
    }
    minElevation = Math.min(minElevation, height);
    maxElevation = Math.max(maxElevation, height);
  }

  const horizontalScale = targetLongestSide / Math.max(sourceBounds.maxX - sourceBounds.minX, sourceBounds.maxY - sourceBounds.minY);
  const heights = heightsMeters.map((height) => {
    if (!Number.isFinite(height)) {
      return seaFloorY;
    }
    return Math.max(seaFloorY, (height - minElevation) * horizontalScale * verticalExaggeration);
  });

  return { heights, heightsMeters, minElevation, maxElevation, horizontalScale };
}

function fillMissing(heights) {
  for (let pass = 0; pass < 36; pass += 1) {
    const next = heights.slice();
    let changed = false;
    for (let z = 0; z < gridZ; z += 1) {
      for (let x = 0; x < gridX; x += 1) {
        const index = z * gridX + x;
        if (Number.isFinite(heights[index])) {
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
            if (Number.isFinite(value)) {
              sum += value;
              count += 1;
            }
          }
        }
        if (count > 0) {
          next[index] = sum / count;
          changed = true;
        }
      }
    }
    for (let i = 0; i < heights.length; i += 1) {
      heights[i] = next[i];
    }
    if (!changed) {
      return;
    }
  }
}

function getTerrainColor(x, z, height, slope) {
  const scale = targetLongestSide / 155;
  const lowGrass = new THREE.Color(0x86b85a);
  const warmDryGrass = new THREE.Color(0x9ebd64);
  const humidGreen = new THREE.Color(0x579955);
  const deepGreen = new THREE.Color(0x3e7140);
  const highRock = new THREE.Color(0x6d6a5d);
  const cliffRock = new THREE.Color(0x4d5048);
  const sand = new THREE.Color(0xd6c08a);
  const basalt = new THREE.Color(0x34322e);
  const volcanicSoil = new THREE.Color(0x6f5941);

  const altitude = THREE.MathUtils.clamp(height / 7.8, 0, 1);
  const slopeMask = THREE.MathUtils.clamp((slope - 0.08) / 0.62, 0, 1);
  let color = lowGrass.clone().lerp(humidGreen, THREE.MathUtils.clamp(altitude * 1.55, 0, 1));
  if (altitude > 0.36) {
    color.lerp(deepGreen, THREE.MathUtils.clamp((altitude - 0.36) / 0.32, 0, 1));
  }
  if (altitude > 0.62) {
    color.lerp(highRock, THREE.MathUtils.clamp((altitude - 0.62) / 0.35, 0, 1));
  }

  const westDryMask = smoothEllipse(x, z, -54 * scale, -5 * scale, 34 * scale, 45 * scale);
  if (westDryMask > 0) {
    color.lerp(warmDryGrass, westDryMask * (1 - altitude) * 0.38);
  }

  const mafateMask = smoothEllipse(x, z, -18 * scale, 10 * scale, 25 * scale, 22 * scale);
  const cilaosMask = smoothEllipse(x, z, -5 * scale, -22 * scale, 23 * scale, 20 * scale);
  const salazieMask = smoothEllipse(x, z, 16 * scale, 25 * scale, 28 * scale, 23 * scale);
  const humidCirqueMask = Math.max(mafateMask * 0.78, cilaosMask * 0.68, salazieMask);
  if (humidCirqueMask > 0) {
    color.lerp(new THREE.Color(0x3f8b4c), humidCirqueMask * 0.34);
  }

  const fournaiseMask = smoothEllipse(x, z, 38 * scale, -32 * scale, 35 * scale, 30 * scale);
  if (fournaiseMask > 0) {
    const volcanic = volcanicSoil.clone().lerp(basalt, THREE.MathUtils.clamp(altitude * 1.2, 0, 1));
    color.lerp(volcanic, fournaiseMask * 0.96);
  }

  const lowCoastMask = 1 - THREE.MathUtils.clamp(height / 2.15, 0, 1);
  const westSandMask = smoothEllipse(x, z, -62 * scale, 2 * scale, 26 * scale, 38 * scale) * lowCoastMask;
  const southSandMask = smoothEllipse(x, z, -10 * scale, -54 * scale, 49 * scale, 19 * scale) * lowCoastMask;
  const northWestSandMask = smoothEllipse(x, z, -42 * scale, 34 * scale, 22 * scale, 18 * scale) * lowCoastMask;
  const sandMask = Math.max(westSandMask, southSandMask * 0.9, northWestSandMask * 0.72);
  if (sandMask > 0) {
    color.lerp(sand, THREE.MathUtils.clamp(sandMask * 0.95, 0, 0.9));
  }

  if (slopeMask > 0) {
    color.lerp(cliffRock, slopeMask * (0.2 + altitude * 0.48));
  }

  const grain = pseudoNoise(x * 0.18, z * 0.18) * 0.03;
  const terrainPulse = pseudoNoise(x * 0.055, z * 0.055) * 0.025;
  color.offsetHSL(0, 0.015 + terrainPulse, grain + terrainPulse);
  return color;
}

function smoothEllipse(x, z, cx, cz, rx, rz) {
  const dx = (x - cx) / rx;
  const dz = (z - cz) / rz;
  const distance = Math.sqrt(dx * dx + dz * dz);
  return 1 - THREE.MathUtils.smoothstep(distance, 0.58, 1);
}

function pseudoNoise(x, z) {
  const value = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function computeTerrainSlope(heights, x, z) {
  const left = heights[z * gridX + Math.max(0, x - 1)];
  const right = heights[z * gridX + Math.min(gridX - 1, x + 1)];
  const down = heights[Math.max(0, z - 1) * gridX + x];
  const up = heights[Math.min(gridZ - 1, z + 1) * gridX + x];
  const dx = Math.abs((right ?? 0) - (left ?? 0));
  const dz = Math.abs((up ?? 0) - (down ?? 0));
  return Math.sqrt(dx * dx + dz * dz);
}

function createReliefMesh(bounds, outline, heights) {
  const vertices = [];
  const colors = [];
  const indices = [];
  for (let z = 0; z < gridZ; z += 1) {
    for (let x = 0; x < gridX; x += 1) {
      const worldX = bounds.minX + (x / (gridX - 1)) * (bounds.maxX - bounds.minX);
      const worldZ = bounds.minZ + (z / (gridZ - 1)) * (bounds.maxZ - bounds.minZ);
      const height = heights[z * gridX + x];
      const color = getTerrainColor(worldX, worldZ, height, computeTerrainSlope(heights, x, z));
      vertices.push(worldX, height, worldZ);
      colors.push(color.r, color.g, color.b);
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
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide
    })
  );
}

function createReliefChunkMesh(bounds, outline, heights, range, name, globalNormals) {
  const localGridX = range.xEnd - range.xStart + 1;
  const localGridZ = range.zEnd - range.zStart + 1;
  const vertices = [];
  const colors = [];
  const normals = [];
  const indices = [];

  for (let z = range.zStart; z <= range.zEnd; z += 1) {
    for (let x = range.xStart; x <= range.xEnd; x += 1) {
      const worldX = bounds.minX + (x / (gridX - 1)) * (bounds.maxX - bounds.minX);
      const worldZ = bounds.minZ + (z / (gridZ - 1)) * (bounds.maxZ - bounds.minZ);
      const globalIndex = z * gridX + x;
      const height = heights[globalIndex];
      const color = getTerrainColor(worldX, worldZ, height, computeTerrainSlope(heights, x, z));
      vertices.push(worldX, height, worldZ);
      colors.push(color.r, color.g, color.b);
      normals.push(
        globalNormals[globalIndex * 3] ?? 0,
        globalNormals[globalIndex * 3 + 1] ?? 1,
        globalNormals[globalIndex * 3 + 2] ?? 0
      );
    }
  }

  for (let z = range.zStart; z < range.zEnd; z += 1) {
    for (let x = range.xStart; x < range.xEnd; x += 1) {
      const centerX = bounds.minX + ((x + 0.5) / (gridX - 1)) * (bounds.maxX - bounds.minX);
      const centerZ = bounds.minZ + ((z + 0.5) / (gridZ - 1)) * (bounds.maxZ - bounds.minZ);
      if (!pointInPolygon(centerX, centerZ, outline)) {
        continue;
      }
      const localX = x - range.xStart;
      const localZ = z - range.zStart;
      const a = localZ * localGridX + localX;
      const b = a + 1;
      const c = (localZ + 1) * localGridX + localX;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide
    })
  );
  mesh.name = name;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

function buildChunkRanges() {
  const ranges = [];
  for (let cz = 0; cz < chunkCountZ; cz += 1) {
    for (let cx = 0; cx < chunkCountX; cx += 1) {
      const xStart = Math.floor((cx / chunkCountX) * (gridX - 1));
      const xEnd = Math.floor(((cx + 1) / chunkCountX) * (gridX - 1));
      const zStart = Math.floor((cz / chunkCountZ) * (gridZ - 1));
      const zEnd = Math.floor(((cz + 1) / chunkCountZ) * (gridZ - 1));
      ranges.push({ cx, cz, xStart, xEnd, zStart, zEnd });
    }
  }
  return ranges;
}

function chunkBounds(projectedBounds, range) {
  return {
    minX: projectedBounds.minX + (range.xStart / (gridX - 1)) * (projectedBounds.maxX - projectedBounds.minX),
    maxX: projectedBounds.minX + (range.xEnd / (gridX - 1)) * (projectedBounds.maxX - projectedBounds.minX),
    minZ: projectedBounds.minZ + (range.zStart / (gridZ - 1)) * (projectedBounds.maxZ - projectedBounds.minZ),
    maxZ: projectedBounds.minZ + (range.zEnd / (gridZ - 1)) * (projectedBounds.maxZ - projectedBounds.minZ)
  };
}

function sliceGrid(values, range) {
  const localGridX = range.xEnd - range.xStart + 1;
  const localGridZ = range.zEnd - range.zStart + 1;
  const sliced = [];
  for (let z = range.zStart; z <= range.zEnd; z += 1) {
    for (let x = range.xStart; x <= range.xEnd; x += 1) {
      sliced.push(values[z * gridX + x]);
    }
  }
  return { localGridX, localGridZ, values: sliced };
}

async function cleanChunkOutputs() {
  await fsp.mkdir(chunkOutputDir, { recursive: true });
  const entries = await fsp.readdir(chunkOutputDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && /^lareunion-terrain-\d+\.(glb|json)$/.test(entry.name))
      .map((entry) => fsp.unlink(path.join(chunkOutputDir, entry.name)))
  );
}

async function exportTerrainChunks(projectedBounds, outline, heights, heightsMeters, globalNormals, worldMapping) {
  await cleanChunkOutputs();
  const chunks = [];
  const ranges = buildChunkRanges();

  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];
    const chunkName = `lareunion-terrain-${index}`;
    const mesh = createReliefChunkMesh(
      projectedBounds,
      outline,
      heights,
      range,
      `LaReunionRgeAltiTerrain_${index}`,
      globalNormals
    );
    const scene = new THREE.Scene();
    scene.name = `LaReunionRgeAltiChunk_${index}`;
    scene.add(mesh);

    const glb = await exportGlb(scene);
    const glbFile = `${chunkName}.glb`;
    const glbPathChunk = path.join(chunkOutputDir, glbFile);
    await fsp.writeFile(glbPathChunk, Buffer.from(glb));

    const slicedHeights = sliceGrid(heights, range);
    const slicedMeters = sliceGrid(heightsMeters, range);
    const heightfieldFile = `${chunkName}.json`;
    const heightfieldPathChunk = path.join(chunkOutputDir, heightfieldFile);
    const localBounds = chunkBounds(projectedBounds, range);
    const heightfield = {
      source: terrainSourceName,
      kind: "terrain-chunk-heightfield",
      projection: terrainProjection,
      worldMapping,
      index,
      cx: range.cx,
      cz: range.cz,
      lodLevel: 0,
      bounds: localBounds,
      gridX: slicedHeights.localGridX,
      gridZ: slicedHeights.localGridZ,
      heights: slicedHeights.values.map((height) => Number(height.toFixed(4))),
      elevationsMeters: slicedMeters.values.map((height) => (Number.isFinite(height) ? Number(height.toFixed(2)) : null))
    };
    await fsp.writeFile(heightfieldPathChunk, `${JSON.stringify(heightfield)}\n`);

    chunks.push({
      index,
      cx: range.cx,
      cz: range.cz,
      bounds: localBounds,
      gridX: slicedHeights.localGridX,
      gridZ: slicedHeights.localGridZ,
      file: `/assets/terrain/lareunion/chunks/${glbFile}`,
      heightfield: `/assets/terrain/lareunion/chunks/${heightfieldFile}`,
      lods: [
        {
          level: 0,
          file: `/assets/terrain/lareunion/chunks/${glbFile}`,
          heightfield: `/assets/terrain/lareunion/chunks/${heightfieldFile}`
        }
      ],
      triangles: mesh.geometry.index ? mesh.geometry.index.count / 3 : 0,
      runtimeVertices: mesh.geometry.getAttribute("position").count,
      bytes: fs.statSync(glbPathChunk).size,
      heightfieldBytes: fs.statSync(heightfieldPathChunk).size
    });
  }

  const manifest = {
    source: terrainSourceName,
    kind: "terrain-stream-manifest",
    projection: terrainProjection,
    worldMapping,
    lodLevels: terrainLodContract,
    perfBudget: terrainPerfBudget,
    chunkCountX,
    chunkCountZ,
    gridX,
    gridZ,
    chunks
  };
  await fsp.writeFile(chunkManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
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

function pointInPolygon(x, z, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

async function main() {
  const files = await listSourceFiles(sourceDir);
  if (files.length === 0) {
    throw new Error(
      `Aucun .asc/.tif trouve dans ${sourceDir}. Place les tuiles IGN RGE ALTI D974 ici ou passe --source <dossier>.`
    );
  }

  const geojson = JSON.parse(await fsp.readFile(outlinePath, "utf8"));
  const outlineRing = geojson.features?.[0]?.geometry?.coordinates?.[0];
  if (!Array.isArray(outlineRing)) {
    throw new Error("Contour OSM invalide.");
  }

  const headers = await readSourceHeaders(files);
  const sourceBounds = mergeBounds(headers);
  const worldMapping = createWorldMapping(sourceBounds);
  const outline = projectOutlineToGame(outlineRing, worldMapping);
  const projectedBounds = worldMapping.worldBounds;

  const accum = {
    sums: Array.from({ length: gridX * gridZ }, () => 0),
    counts: Array.from({ length: gridX * gridZ }, () => 0)
  };

  for (const header of headers) {
    if (header.kind === "asc") {
      await fillFromAsc(header, sourceBounds, accum);
    } else {
      await fillFromTiff(header, sourceBounds, accum);
    }
  }

  const { heights, heightsMeters, minElevation, maxElevation, horizontalScale } = finalizeHeights(accum, sourceBounds);
  const relief = createReliefMesh(projectedBounds, outline, heights);
  relief.name = "LaReunionRgeAltiTerrain";
  relief.receiveShadow = true;
  relief.castShadow = false;
  const globalNormals = Array.from(relief.geometry.getAttribute("normal").array);

  const coastline = createCoastline(outline);
  coastline.name = "LaReunionCoastline";

  const scene = new THREE.Scene();
  scene.name = "LaReunionRgeAltiMap";
  scene.add(relief, coastline);

  await fsp.mkdir(outputDir, { recursive: true });
  const glb = await exportGlb(scene);
  await fsp.writeFile(glbPath, Buffer.from(glb));
  const chunkManifest = await exportTerrainChunks(projectedBounds, outline, heights, heightsMeters, globalNormals, worldMapping);

  const collision = {
    source: terrainSourceName,
    projection: terrainProjection,
    worldMapping,
    bounds: projectedBounds,
    gridX,
    gridZ,
    outline,
    heights: heights.map((height) => Number(height.toFixed(4)))
  };
  await fsp.writeFile(collisionPath, `${JSON.stringify(collision)}\n`);

  const heightfield = {
    source: terrainSourceName,
    projection: terrainProjection,
    worldMapping,
    sourceBounds,
    horizontalScale,
    verticalExaggeration,
    minElevation,
    maxElevation,
    gridX,
    gridZ,
    elevationsMeters: heightsMeters.map((height) => (Number.isFinite(height) ? Number(height.toFixed(2)) : null))
  };
  await fsp.writeFile(heightfieldPath, `${JSON.stringify(heightfield)}\n`);

  const manifest = {
    source: terrainSourceName,
    sourceDir: path.relative(root, sourceDir).replaceAll("\\", "/"),
    inputFiles: files.map((file) => path.relative(root, file).replaceAll("\\", "/")),
    sourceOutline: "packages/assets/sources/lareunion/lareunion-osm-outline.geojson",
    license: "Licence Ouverte / Etalab 2.0 pour RGE ALTI, ODbL pour contour OSM",
    projection: terrainProjection,
    worldMapping,
    lodLevels: terrainLodContract,
    perfBudget: terrainPerfBudget,
    targetLongestSide,
    gridX,
    gridZ,
    chunkCountX,
    chunkCountZ,
    verticalExaggeration,
    minElevation,
    maxElevation,
    horizontalScale,
    glbBytes: fs.statSync(glbPath).size,
    collisionBytes: fs.statSync(collisionPath).size,
    heightfieldBytes: fs.statSync(heightfieldPath).size,
    chunkManifest: "/assets/terrain/lareunion/chunks/manifest.json",
    chunks: chunkManifest.chunks.map((chunk) => ({
      file: chunk.file,
      heightfield: chunk.heightfield,
      lods: chunk.lods,
      bounds: chunk.bounds,
      triangles: chunk.triangles,
      runtimeVertices: chunk.runtimeVertices,
      bytes: chunk.bytes,
      heightfieldBytes: chunk.heightfieldBytes
    })),
    reliefMap: "/assets/terrain/lareunion/lareunion-relief-map.glb",
    collision: "/assets/terrain/lareunion/lareunion-relief-collision.json",
    heightfield: "/assets/terrain/lareunion/lareunion-heightfield.json"
  };
  await fsp.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
