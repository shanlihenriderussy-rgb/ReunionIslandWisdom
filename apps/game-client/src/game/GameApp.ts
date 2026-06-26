import * as THREE from "three";
import { playerMoveSpeed } from "@riw/shared";
import { InputController } from "./InputController";
import { updateFollowCamera } from "./camera";
import { WorldCollision } from "./collision";
import { NetworkClient } from "../network/NetworkClient";
import { createHud, type HudController } from "../ui/hud";
import { configureWorld } from "../render/world";
import { getBiomeAtPosition } from "../world/biomes";
import { WEST_BLOCKOUT_SPAWN } from "../world/westBlockout";
import { createChunkStreamer, type ChunkStreamer } from "./ChunkStreamer";
import { updateFournaiseFx } from "../render/fournaise";
import { updateWestWaterFx } from "../render/westScenic";
import {
  addNpcViews,
  findNearestNpc,
  updateNpcHighlight,
  updateNpcMarkers,
  updateNpcIdle,
  type NpcView
} from "../render/npcs";
import {
  createLocalPlayerMesh,
  syncRemotePlayers,
  updateNameTags,
  updatePlayerWalkAnimation,
  type RemotePlayerView
} from "../render/players";

type PerfSnapshot = {
  fps: number;
  frameMs: number;
  render: {
    calls: number;
    triangles: number;
    points: number;
    lines: number;
  };
  memory: {
    geometries: number;
    textures: number;
  };
  programs: number | null;
  sceneChildren: number;
  mapView: boolean;
  timestamp: number;
};

declare global {
  interface Window {
    __RIW_PERF__?: PerfSnapshot;
  }
}

export class GameApp {
  private readonly shell: HTMLDivElement;
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(58, 1, 0.1, 420);
  private readonly clock = new THREE.Clock();
  private readonly input = new InputController();
  private readonly collision = new WorldCollision();
  private readonly network = new NetworkClient();
  private readonly hud: HudController;
  private readonly cameraPivot = new THREE.Group();
  private readonly localPlayer = createLocalPlayerMesh();
  private readonly remotePlayers = new Map<string, RemotePlayerView>();
  private readonly npcViews: NpcView[] = [];
  private readonly lastLocalPlayerPosition = new THREE.Vector3();
  private readonly chunkStreamer: ChunkStreamer = createChunkStreamer(this.scene, { radius: 1, maxConcurrent: 2 });
  private readonly perfDebug = new URLSearchParams(window.location.search).has("perfDebug");
  private localPlayerId: string | null = null;
  private sequence = 0;
  private animationFrame = 0;
  private cameraYaw = 0;
  private activeZoneLabel = "Saint-Paul / Saint-Gilles";
  private fpsAccum = 0;
  private fpsFrames = 0;
  private fpsValue = 0;
  private perfLastNow = performance.now();
  private perfFrameMs = 0;
  private perfFps = 0;

  constructor(root: HTMLDivElement) {
    this.shell = document.createElement("div");
    this.shell.className = "game-shell";

    this.renderer.domElement.className = "game-canvas";
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x87ceeb); // Ciel tropical — voir DA 09-direction-artistique
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Couleurs plus franches facon maquette "Jour Tropical" (exposure releve 1.18 -> 1.28).
    this.renderer.toneMappingExposure = 1.28;
    this.renderer.shadowMap.enabled = true;
    // Ombres douces (cartoon) au lieu du shadow map dur par defaut.
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.hud = createHud(this.network, this.input);

    this.shell.append(this.renderer.domElement, this.hud.element);
    root.append(this.shell);
  }

  start(): void {
    this.configureScene();
    this.resize();
    this.input.bind(window, this.renderer.domElement);
    void this.network.connect();
    // Streaming terrain RGE ALTI : remplace le mesh monolithique si manifeste valide.
    void this.chunkStreamer.init();

    window.addEventListener("resize", this.resize);
    this.loop();
  }

  private readonly resize = (): void => {
    const width = this.shell.clientWidth;
    const height = this.shell.clientHeight;
    // Conteneur pas encore mis en page / onglet masque : eviter aspect NaN/Infinity
    // (matrice de projection corrompue, rendu noir jusqu'au prochain resize).
    if (width <= 0 || height <= 0) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private configureScene(): void {
    // Les colliders des props generes (vegetation ouest) sont injectes une fois poses au sol.
    configureWorld(this.scene, (colliders) => this.collision.addColliders(colliders));
    this.cameraYaw = WEST_BLOCKOUT_SPAWN.yaw;
    this.cameraPivot.position.set(WEST_BLOCKOUT_SPAWN.x, WEST_BLOCKOUT_SPAWN.y, WEST_BLOCKOUT_SPAWN.z);
    this.collision.snapToGround(this.cameraPivot.position);
    this.scene.add(this.cameraPivot);
    this.localPlayer.position.copy(this.cameraPivot.position);
    this.scene.add(this.localPlayer);
    this.npcViews.push(...addNpcViews(this.scene));
    this.updateActiveBiome();
  }

  private loop = (): void => {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.updatePerfProbe();
    this.animationFrame = window.requestAnimationFrame(this.loop);
  };

  private update(delta: number): void {
    const snapshot = this.network.getSnapshot();
    this.localPlayerId = snapshot.sessionId;
    const paused = this.hud.isPaused();

    if (!paused && !this.hud.isMapView()) {
      this.updateLocalPrediction(delta);
    } else {
      this.sendStopIntent();
    }

    this.localPlayer.position.copy(this.cameraPivot.position);
    this.localPlayer.rotation.y = this.cameraPivot.rotation.y;
    const localMoved = this.localPlayer.position.distanceToSquared(this.lastLocalPlayerPosition) > 0.0004;
    updatePlayerWalkAnimation(this.localPlayer, delta, localMoved);
    this.lastLocalPlayerPosition.copy(this.localPlayer.position);

    syncRemotePlayers(
      this.scene,
      this.hud.element,
      this.remotePlayers,
      snapshot,
      this.localPlayerId,
      this.localPlayer,
      delta
    );

    if (this.hud.isMapView()) {
      this.updateMapDebugCamera(delta);
    } else {
      updateFollowCamera(this.camera, this.cameraPivot, this.cameraYaw, delta, this.hud.getCameraZoom());
    }
    updateNameTags(this.remotePlayers, this.camera, this.shell.clientWidth, this.shell.clientHeight);
    this.updateNpcInteractions(paused);
    updateNpcIdle(this.npcViews, delta, this.clock.elapsedTime);
    updateNpcMarkers(this.npcViews, this.clock.elapsedTime);
    this.chunkStreamer.update(this.cameraPivot.position, { mapView: this.hud.isMapView() });
    updateFournaiseFx(this.clock.elapsedTime);
    updateWestWaterFx(this.clock.elapsedTime);
    this.updateActiveBiome();
    this.hud.update(snapshot);
    this.updateDebugOverlay(delta);
  }

  private updateActiveBiome(): void {
    const biome = getBiomeAtPosition(this.cameraPivot.position);
    this.activeZoneLabel = biome.label;
    this.hud.setZone(biome.label);
  }

  private updatePerfProbe(): void {
    if (!this.perfDebug) {
      return;
    }

    const now = performance.now();
    const frameMs = Math.max(0.001, now - this.perfLastNow);
    this.perfLastNow = now;
    this.perfFrameMs = this.perfFrameMs === 0 ? frameMs : THREE.MathUtils.lerp(this.perfFrameMs, frameMs, 0.12);
    this.perfFps = 1000 / this.perfFrameMs;

    const info = this.renderer.info;
    window.__RIW_PERF__ = {
      fps: Number(this.perfFps.toFixed(1)),
      frameMs: Number(this.perfFrameMs.toFixed(2)),
      render: {
        calls: info.render.calls,
        triangles: info.render.triangles,
        points: info.render.points,
        lines: info.render.lines
      },
      memory: {
        geometries: info.memory.geometries,
        textures: info.memory.textures
      },
      programs: info.programs?.length ?? null,
      sceneChildren: this.scene.children.length,
      mapView: this.hud.isMapView(),
      timestamp: Math.round(now)
    };
  }

  // Overlay debug (fps, zone, position) — visible uniquement en vue carte.
  private updateDebugOverlay(delta: number): void {
    if (!this.hud.isMapView()) {
      this.hud.setDebug(null);
      return;
    }
    this.fpsAccum += delta;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 0.5) {
      this.fpsValue = Math.round(this.fpsFrames / this.fpsAccum);
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }
    const p = this.cameraPivot.position;
    this.hud.setDebug({
      fps: this.fpsValue,
      pos: [Number(p.x.toFixed(1)), Number(p.y.toFixed(1)), Number(p.z.toFixed(1))],
      zone: this.activeZoneLabel
    });
  }

  private updateMapDebugCamera(delta: number): void {
    const aspect = this.camera.aspect;
    const mobileMapFocus = aspect < 0.75 ? 1 : 0;
    const height = Math.max(
      THREE.MathUtils.lerp(92, 255, this.hud.getCameraZoom()),
      aspect < 0.75 ? 260 : 0
    );
    const target = new THREE.Vector3(
      THREE.MathUtils.lerp(0, WEST_BLOCKOUT_SPAWN.x, mobileMapFocus),
      0,
      THREE.MathUtils.lerp(0, WEST_BLOCKOUT_SPAWN.z, mobileMapFocus)
    );
    this.camera.position.lerp(new THREE.Vector3(target.x, height, target.z + 0.01), Math.min(1, delta * 5));
    this.camera.lookAt(target);
  }

  private updateNpcInteractions(paused: boolean): void {
    const nearest = !paused && !this.hud.isMapView() ? findNearestNpc(this.cameraPivot.position, this.npcViews) : null;
    this.hud.setInteractPrompt(nearest?.name ?? null);
    updateNpcHighlight(this.npcViews, nearest?.id ?? null);
    if (this.input.consumeInteractPressed() && nearest) {
      this.network.openLocalDialogue({
        npcId: nearest.id,
        npcName: nearest.name,
        line: nearest.line
      });
      this.network.sendInteract(nearest.id);
    }
  }

  private updateLocalPrediction(delta: number): void {
    const movement = this.input.getMovementVector();
    const cameraMove = this.input.getCameraDelta();
    this.cameraYaw += cameraMove.x * 0.003;

    const length = Math.hypot(movement.x, movement.z);
    const normalizedX = length > 0 ? movement.x / length : 0;
    const normalizedZ = length > 0 ? movement.z / length : 0;

    if (length > 0) {
      const sin = Math.sin(this.cameraYaw);
      const cos = Math.cos(this.cameraYaw);
      const worldX = normalizedX * cos + normalizedZ * sin;
      const worldZ = normalizedZ * cos - normalizedX * sin;

      const previous = this.cameraPivot.position.clone();
      const proposed = previous.clone();
      proposed.x += worldX * playerMoveSpeed * delta;
      proposed.z += worldZ * playerMoveSpeed * delta;
      this.cameraPivot.position.copy(this.collision.resolveMove(previous, proposed));
      this.cameraPivot.rotation.y = Math.atan2(worldX, worldZ);
    } else {
      this.collision.snapToGround(this.cameraPivot.position);
    }

    this.network.sendMove({
      sequence: this.sequence,
      x: normalizedX,
      z: normalizedZ,
      cameraYaw: this.cameraYaw
    });
    this.sequence += 1;
  }

  private sendStopIntent(): void {
    this.input.resetMovement();
    this.network.sendMove({
      sequence: this.sequence,
      x: 0,
      z: 0,
      cameraYaw: this.cameraYaw
    });
    this.sequence += 1;
  }

  dispose(): void {
    window.cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.resize);
    this.input.unbind(window, this.renderer.domElement);
    this.chunkStreamer.dispose();
    this.hud.dispose();
    for (const view of this.remotePlayers.values()) {
      view.nameTag.remove();
    }
    this.remotePlayers.clear();
    this.renderer.dispose();
    this.network.disconnect();
  }
}
