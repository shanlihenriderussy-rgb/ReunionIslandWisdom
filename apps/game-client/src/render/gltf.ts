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

export function addGltfProp(
  scene: THREE.Scene,
  url: string,
  position: THREE.Vector3,
  options: ModelOptions = {}
): void {
  void loadGltfGroup(url)
    .then(({ scene: model }) => {
      normalizeModel(model, options);
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
