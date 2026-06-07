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
const { mergeVertices } = await import(fromClient("three/examples/jsm/utils/BufferGeometryUtils.js"));

const sourcePath = path.join(root, "packages/assets/sources/lareunion/LaReunion.stl");
const outputDir = path.join(root, "apps/game-client/public/assets/terrain/lareunion/chunks");

// --- Reglages mise en scene ---
const targetLongestSide = 82;        // empreinte au sol (unites jeu)
const verticalExaggeration = 0.55;   // relief lisible (0.18 etait trop plat -> aspect chaotique)
const upThreshold = 0.2;             // ne garde que la peau superieure (jette socle + falaises verticales)
const centerRadius = 7;              // rayon d'echantillonnage pour caler le centre de l'ile a y=0
const chunkCountX = 2;
const chunkCountZ = 2;

// STL axes : Z = hauteur (verifie : ratio ~0.10), X/Y = empreinte horizontale.
// world : x = (X-cx)*s ; y = (Z-minZ)*s*exa ; z = -(Y-cy)*s

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
    exporter.parse(scene, resolve, reject, { binary: true, includeCustomExtensions: false, trs: false });
  });
}

async function main() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`STL introuvable: ${sourcePath}`);
  }
  fs.mkdirSync(outputDir, { recursive: true });

  const source = fs.readFileSync(sourcePath);
  const sourceBuffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const geometry = new STLLoader().parse(sourceBuffer);
  geometry.computeBoundingBox();

  const box = geometry.boundingBox;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const scale = targetLongestSide / Math.max(size.x, size.y);
  const halfX = (size.x * scale) / 2;
  const halfZ = (size.y * scale) / 2;

  const toWorld = (sx, sy, sz) => [
    (sx - center.x) * scale,
    (sz - box.min.z) * scale * verticalExaggeration,
    -(sy - center.y) * scale
  ];

  const chunkIndex = (x, z) => {
    const ix = Math.min(chunkCountX - 1, Math.max(0, Math.floor(((x + halfX) / (halfX * 2)) * chunkCountX)));
    const iz = Math.min(chunkCountZ - 1, Math.max(0, Math.floor(((z + halfZ) / (halfZ * 2)) * chunkCountZ)));
    return iz * chunkCountX + ix;
  };

  const chunks = Array.from({ length: chunkCountX * chunkCountZ }, () => ({ points: [], triangles: 0 }));
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();

  const positions = geometry.getAttribute("position");
  let kept = 0;
  let centerSum = 0;
  let centerCount = 0;

  for (let i = 0; i < positions.count; i += 3) {
    const a = toWorld(positions.getX(i), positions.getY(i), positions.getZ(i));
    const b = toWorld(positions.getX(i + 1), positions.getY(i + 1), positions.getZ(i + 1));
    const c = toWorld(positions.getX(i + 2), positions.getY(i + 2), positions.getZ(i + 2));

    v0.set(a[0], a[1], a[2]);
    v1.set(b[0], b[1], b[2]);
    v2.set(c[0], c[1], c[2]);
    e1.subVectors(v1, v0);
    e2.subVectors(v2, v0);
    nrm.crossVectors(e1, e2).normalize();
    if (nrm.y < upThreshold) {
      continue;
    }

    const cx = (a[0] + b[0] + c[0]) / 3;
    const cz = (a[2] + b[2] + c[2]) / 3;
    const cy = (a[1] + b[1] + c[1]) / 3;
    if (Math.hypot(cx, cz) < centerRadius) {
      centerSum += cy;
      centerCount += 1;
    }

    const chunk = chunks[chunkIndex(cx, cz)];
    chunk.points.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    chunk.triangles += 1;
    kept += 1;
  }

  const centerHeight = centerCount > 0 ? centerSum / centerCount : 0;

  const manifest = {
    source: "packages/assets/sources/lareunion/LaReunion.stl",
    targetLongestSide,
    verticalExaggeration,
    upThreshold,
    centerHeight,
    originalTriangles: positions.count / 3,
    keptTriangles: kept,
    chunks: []
  };

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    // Cale le centre de l'ile a y=0 : le hub se pose dessus, les cotes plongent sous la mer.
    for (let p = 1; p < chunk.points.length; p += 3) {
      chunk.points[p] -= centerHeight;
    }

    const geometryChunk = new THREE.BufferGeometry();
    geometryChunk.setAttribute("position", new THREE.Float32BufferAttribute(chunk.points, 3));
    const indexed = mergeVertices(geometryChunk, 0.0005);
    indexed.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({ color: 0x5a8a4a, roughness: 0.96, metalness: 0 });
    const mesh = new THREE.Mesh(indexed, material);
    mesh.name = `LaReunionTerrain_${index}`;
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    const scene = new THREE.Scene();
    scene.name = `LaReunionTerrainChunk_${index}`;
    scene.add(mesh);

    const glb = await exportGlb(scene);
    const chunkName = `lareunion-terrain-${index}.glb`;
    const chunkPath = path.join(outputDir, chunkName);
    fs.writeFileSync(chunkPath, Buffer.from(glb));

    manifest.chunks.push({
      file: `/assets/terrain/lareunion/chunks/${chunkName}`,
      triangles: chunk.triangles,
      runtimeVertices: indexed.getAttribute("position").count,
      bytes: fs.statSync(chunkPath).size
    });
  }

  fs.writeFileSync(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
