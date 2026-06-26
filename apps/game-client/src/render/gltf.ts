import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

const loader = new GLTFLoader();
const cache = new Map<string, Promise<LoadedGltf>>();

// Offset de cap commun aux personnages Kenney mini.
// Si les persos regardent a l'oppose en jeu, passer a Math.PI.
export const CHARACTER_YAW_OFFSET = 0;

type ModelOptions = {
  name?: string;
  scale?: number;
  // Si defini, on ignore scale et on dimensionne le modele a cette hauteur (unites monde).
  targetHeight?: number;
  y?: number;
  rotationY?: number;
  yawOffset?: number;
  // Pose la base du modele a y=0 (pieds au sol). Defaut: true.
  ground?: boolean;
  // Centre le modele sur son parent. Defaut: true pour les props/personnages.
  center?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  hideFallback?: boolean;
  userDataKey?: string;
  materialMode?: "westVegetation";
};

type LoadedGltf = {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
};

export type AnimationController = {
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  current: string;
};

export async function loadGltfGroup(url: string): Promise<LoadedGltf> {
  let cached = cache.get(url);
  if (!cached) {
    cached = loader.loadAsync(url).then((gltf) => {
      const group = gltf.scene;
      prepareObject(group);
      return {
        scene: group,
        animations: gltf.animations
      };
    });
    cache.set(url, cached);
  }

  const source = await cached;
  const clone = SkeletonUtils.clone(source.scene) as THREE.Group;
  prepareObject(clone);
  return {
    scene: clone,
    animations: source.animations
  };
}

// Applique echelle (par hauteur cible ou facteur), grounding et rotation.
function normalizeModel(model: THREE.Object3D, options: ModelOptions): void {
  const preBox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  preBox.getSize(size);

  let scale = options.scale ?? 1;
  if (options.targetHeight !== undefined && size.y > 0.0001) {
    scale = options.targetHeight / size.y;
  }
  model.scale.setScalar(scale);

  model.rotation.y = (options.rotationY ?? 0) + (options.yawOffset ?? 0);

  if (options.center !== false) {
    // Centre le modele sur son parent : le gameplay deplace le parent, pas le mesh interne.
    const centeredBox = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    centeredBox.getCenter(center);
    model.position.x = -center.x;
    model.position.z = -center.z;
  }

  // Grounding apres scale/centrage : recalcul bbox pour poser la base a y=0.
  const groundOffset = options.ground === false ? 0 : -new THREE.Box3().setFromObject(model).min.y;
  model.position.y = (options.y ?? 0) + groundOffset;
}

export function attachGltf(parent: THREE.Group, url: string, options: ModelOptions = {}): void {
  void loadGltfGroup(url)
    .then(({ scene: model, animations }) => {
      normalizeModel(model, options);
      applyMaterialOptions(model, options);
      applyShadowOptions(model, options);
      if (options.userDataKey) {
        parent.userData[options.userDataKey] = model;
      }
      if (animations.length > 0) {
        parent.userData["animationController"] = createAnimationController(model, animations);
      }
      parent.add(model);

      if (options.hideFallback) {
        for (const child of parent.children) {
          if (child !== model && child.userData["fallback"] === true) {
            child.visible = false;
          }
        }
      }
    })
    .catch((error: unknown) => {
      console.warn(`GLB load failed: ${url}`, error);
    });
}

// Specification d'une instance pour buildGltfInstances : placement monde du prop
// (le scale est derive de targetHeight, comme un prop normal).
export type GltfInstanceSpec = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  targetHeight: number;
  rotationY: number;
};

const UNIT_SCALE = new THREE.Vector3(1, 1, 1);

// Construit des InstancedMesh (1 par mesh unique du GLB) pour poser N copies d'un
// meme prop en un minimum de draw calls. Reutilise normalizeModel (scale/centrage/
// grounding/rotation) en le rejouant sur un template unique : aucune duplication
// des maths de placement. Cf. P3 perf ouest, ADR draw calls.
export async function buildGltfInstances(
  url: string,
  specs: readonly GltfInstanceSpec[],
  options: { materialMode?: "westVegetation"; castShadow?: boolean; receiveShadow?: boolean } = {}
): Promise<THREE.InstancedMesh[]> {
  if (specs.length === 0) {
    return [];
  }

  const { scene: template } = await loadGltfGroup(url);
  applyMaterialOptions(template, options);

  // Ordre de parcours stable : on relit les memes feuilles a chaque instance.
  const leaves: THREE.Mesh[] = [];
  template.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      leaves.push(child);
    }
  });
  if (leaves.length === 0) {
    return [];
  }

  const perLeaf = leaves.map(() => [] as THREE.Matrix4[]);
  const parentMatrix = new THREE.Matrix4();

  for (const spec of specs) {
    // Reset scale avant normalize : sinon preBox inclut le scale de l'iteration precedente.
    template.scale.setScalar(1);
    normalizeModel(template, { targetHeight: spec.targetHeight, rotationY: spec.rotationY });
    template.updateMatrixWorld(true);
    parentMatrix.compose(spec.position, spec.quaternion, UNIT_SCALE);

    for (let i = 0; i < leaves.length; i += 1) {
      const leaf = leaves[i];
      const bucket = perLeaf[i];
      if (!leaf || !bucket) {
        continue;
      }
      bucket.push(new THREE.Matrix4().multiplyMatrices(parentMatrix, leaf.matrixWorld));
    }
  }

  const result: THREE.InstancedMesh[] = [];
  for (let i = 0; i < leaves.length; i += 1) {
    const leaf = leaves[i];
    const matrices = perLeaf[i];
    if (!leaf || !matrices || matrices.length === 0) {
      continue;
    }
    const instanced = new THREE.InstancedMesh(leaf.geometry, leaf.material, matrices.length);
    for (let k = 0; k < matrices.length; k += 1) {
      const matrix = matrices[k];
      if (matrix) {
        instanced.setMatrixAt(k, matrix);
      }
    }
    instanced.instanceMatrix.needsUpdate = true;
    instanced.castShadow = options.castShadow ?? true;
    instanced.receiveShadow = options.receiveShadow ?? true;
    instanced.name = `${leaf.name || "leaf"}_instanced`;
    instanced.computeBoundingSphere(); // bornes incluant les instances -> culling correct
    result.push(instanced);
  }
  return result;
}

export function addGltfProp(
  scene: THREE.Scene,
  url: string,
  position: THREE.Vector3,
  options: ModelOptions = {}
): void {
  void loadGltfGroup(url)
    .then(({ scene: model }) => {
      normalizeModel(model, options);
      applyMaterialOptions(model, options);
      applyShadowOptions(model, options);
      if (options.name) {
        model.name = options.name;
      }
      model.position.x = position.x;
      model.position.z = position.z;
      model.position.y += position.y;
      scene.add(model);
    })
    .catch((error: unknown) => {
      console.warn(`GLB prop load failed: ${url}`, error);
    });
}

export function updateAnimationController(parent: THREE.Object3D, delta: number, moving: boolean): boolean {
  const controller = parent.userData["animationController"];
  if (!isAnimationController(controller)) {
    return false;
  }

  const next = moving ? "walk" : "idle";
  if (controller.current !== next) {
    const previousAction = controller.actions.get(controller.current);
    const nextAction = controller.actions.get(next);
    if (nextAction) {
      nextAction.reset().play();
      if (previousAction) {
        previousAction.crossFadeTo(nextAction, 0.14, false);
      }
      controller.current = next;
    }
  }

  controller.mixer.update(delta);
  return true;
}

function createAnimationController(root: THREE.Object3D, animations: THREE.AnimationClip[]): AnimationController {
  const mixer = new THREE.AnimationMixer(root);
  const actions = new Map<string, THREE.AnimationAction>();
  for (const clip of animations) {
    actions.set(clip.name, mixer.clipAction(clip));
  }

  const initial = actions.has("idle") ? "idle" : animations[0]?.name ?? "";
  if (initial) {
    actions.get(initial)?.play();
  }

  return {
    mixer,
    actions,
    current: initial
  };
}

function isAnimationController(value: unknown): value is AnimationController {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AnimationController>;
  return candidate.mixer instanceof THREE.AnimationMixer && candidate.actions instanceof Map;
}

function prepareObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = true;
  });
}


function applyMaterialOptions(object: THREE.Object3D, options: ModelOptions): void {
  if (options.materialMode !== "westVegetation") {
    return;
  }

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => tuneWestVegetationMaterial(material));
      return;
    }

    child.material = tuneWestVegetationMaterial(child.material);
  });
}

function tuneWestVegetationMaterial(material: THREE.Material): THREE.Material {
  const tuned = material.clone();
  tuned.side = THREE.DoubleSide;

  if (tuned instanceof THREE.MeshStandardMaterial || tuned instanceof THREE.MeshBasicMaterial) {
    const maxChannel = Math.max(tuned.color.r, tuned.color.g, tuned.color.b);
    // Seuil "sombre" remonte 0.12 -> 0.18 : recupere troncs/branches quasi-noirs.
    if (maxChannel < 0.18) {
      // Brunâtre (tronc) -> bois chaud ; sinon -> feuillage sombre lisible.
      const brownish = tuned.color.r >= tuned.color.b;
      tuned.color.setHex(brownish ? 0x4a3526 : 0x274d2e);
    } else if (tuned.color.g >= tuned.color.r && tuned.color.g >= tuned.color.b) {
      tuned.color.lerp(new THREE.Color(0x67a85a), 0.22);
    }
  }

  if (tuned instanceof THREE.MeshStandardMaterial) {
    tuned.metalness = 0;
    tuned.roughness = Math.max(tuned.roughness, 0.82);
    tuned.emissive.setHex(0x152a17);
    tuned.emissiveIntensity = Math.max(tuned.emissiveIntensity, 0.06);
  }

  tuned.needsUpdate = true;
  return tuned;
}
function applyShadowOptions(object: THREE.Object3D, options: ModelOptions): void {
  if (options.castShadow === undefined && options.receiveShadow === undefined) {
    return;
  }

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    if (options.castShadow !== undefined) {
      child.castShadow = options.castShadow;
    }
    if (options.receiveShadow !== undefined) {
      child.receiveShadow = options.receiveShadow;
    }
  });
}
