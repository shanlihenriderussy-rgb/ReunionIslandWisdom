# 20 — Système de jeu : zones, chunks, vue joueur, HUD

> Lié à [[10-build-plan]] [[12-phase-1-level-design]] [[13-phase-2-gameplay]] [[zones]] [[09-direction-artistique]].
> Architecture cible + contrats d'API. Three.js, navigateur, mobile-first.
> MAJ : 2026-05-31.

## 0. Principe

Jeu = **une seule scène Three.js**, contenu chargé/déchargé **par zone** et **par chunk**.
Le client affiche et envoie des intentions. Le serveur décide (voir [[13-phase-2-gameplay]]).
On ne charge jamais l'île entière : on stream autour du joueur.

État actuel respecté : joueur invisible, PNJ non rendus. La **vue joueur** = caméra + entité logique, **sans avatar rendu** tant que pas de décision explicite.

## 1. Couches (responsabilités)

```txt
GameApp            boucle, scène, renderer, orchestration
 ├─ ZoneManager    charge/décharge zone active, expose métadonnées
 │   └─ ChunkStreamer  charge/décharge chunks GLB + heightfield autour du joueur
 ├─ PlayerView     entité logique joueur (position) + caméra follow + zoom
 ├─ Collision      heightfield + colliders (existant)
 ├─ Hud            DOM : zone, zoom, chat, objectif, debug
 └─ NetworkClient  intentions ↔ serveur (existant)
```

Règles (reprise CLAUDE.md) :

- Pas de logique gameplay dans `world.ts`.
- Pas de DOM dans `world.ts`.
- Pas de logique serveur dans le client.
- `world.ts` devient un **builder de zone** piloté par `ZoneManager`, pas un god-file.

## 2. Système de zones

### 2.1 Modèle de données (`packages/content`)

Une zone = données déclaratives, pas de Three.js dans le content.

```ts
// packages/shared/src/zones.ts  (types partagés client/serveur)
export type ZoneId =
  | 'saint-paul-littoral'
  | 'saint-denis-hub'
  | 'mafate'
  | 'salazie'
  | 'cilaos'
  | 'fournaise'
  | 'route-littoral';

export interface ZoneDef {
  id: ZoneId;
  label: string;                 // affichage HUD
  manifestUrl: string;           // relief-map-manifest.json de la zone
  spawn: { x: number; y: number; z: number };
  ambient: AmbientDef;           // lumière/fog/ciel (voir 09-DA)
  bounds: { min: [number, number]; max: [number, number] }; // X,Z monde
  neighbors: ZoneId[];           // transitions
}

export interface AmbientDef {
  background: number; fog: number; fogNear: number; fogFar: number;
  hemiSky: number; hemiGround: number; hemiIntensity: number;
  sunColor: number; sunIntensity: number; sunPos: [number, number, number];
}
```

```ts
// packages/content/src/zones/index.ts
export const ZONES: Record<ZoneId, ZoneDef> = { /* … une entrée par zone … */ };
```

Valeurs ambiance = celles de [[09-direction-artistique]] (palette Jour Tropical par zone).

### 2.2 ZoneManager (client)

```ts
// apps/game-client/src/game/ZoneManager.ts
export interface ZoneManagerHandles {
  current: ZoneId | null;
  load(id: ZoneId): Promise<void>;   // décharge l'ancienne, charge la nouvelle
  update(dt: number, playerPos: THREE.Vector3): void; // délègue au streamer
  dispose(): void;
}
export function createZoneManager(
  scene: THREE.Scene,
  collision: Collision,
  hud: HudHandles,
): ZoneManagerHandles;
```

Responsabilités :

- applique `AmbientDef` (lumière/fog/ciel) à la scène.
- instancie le `ChunkStreamer` de la zone.
- pousse `label` zone au HUD.
- libère proprement ressources (geometry.dispose, material.dispose, texture.dispose) à chaque changement de zone → **pas de fuite mémoire mobile**.

## 3. Compartimentage / streaming chunks

### 3.1 Format manifest (déjà amorcé dans world.ts)

```jsonc
// relief-map-manifest.json (par zone)
{
  "origin": { "x": 0, "y": 0, "z": 0 },
  "scale": 1,
  "chunkSize": 64,                 // taille monde d'un chunk (X/Z)
  "chunks": [
    { "url": "chunks/c_0_0.glb", "cx": 0, "cz": 0, "heightfield": "chunks/c_0_0.hf.json" }
  ]
}
```

Évolution vs world.ts actuel : `chunks` passe de `string[]` à objets `{url, cx, cz, heightfield}` pour permettre load/unload par coordonnée.

### 3.2 ChunkStreamer

```ts
// apps/game-client/src/game/ChunkStreamer.ts
export interface ChunkStreamer {
  update(playerPos: THREE.Vector3): void; // load ring autour, unload hors rayon
  dispose(): void;
}
export function createChunkStreamer(
  scene: THREE.Scene,
  collision: Collision,
  manifest: ZoneManifest,
  opts: { radius: number; maxConcurrent: number },
): ChunkStreamer;
```

Algo :

1. Calc chunk courant depuis `playerPos` (`floor(x / chunkSize)`).
2. Charger anneau `radius` autour (ex. radius=1 → 3×3 = 9 chunks).
3. Décharger chunks hors `radius + 1` (hystérésis anti-yoyo).
4. File de chargement limitée (`maxConcurrent`, ex. 2) → pas de freeze mobile.
5. Chunk chargé = mesh GLB ajouté scène + heightfield poussé à `Collision`.
6. Chunk déchargé = retiré scène + dispose + heightfield retiré de `Collision`.

Budget perf (voir [[05-asset-pipeline]]) :

- chunk ~1 MB, ≤ 9 chunks résidents → < 10 MB terrain.
- LOD futur : chunk lointain en version basse résolution (anneau extérieur).

## 4. Système de vue joueur

### 4.1 Entité joueur logique (sans avatar rendu)

```ts
// apps/game-client/src/game/PlayerView.ts
export interface PlayerView {
  position: THREE.Vector3;          // source de vérité locale (prédiction)
  update(dt: number, input: InputState, collision: Collision): void;
  setServerPosition(p: Vector3Like): void; // réconciliation serveur
  attachCamera(cam: GameCamera): void;
}
export function createPlayerView(spawn: Vector3Like): PlayerView;
```

- `update` : applique l'intention de déplacement (input) → déplace `position`, clamp au sol via `Collision` (heightfield), envoie l'intention au serveur via NetworkClient.
- caméra suit `position` : `cam.setTarget(position)` chaque frame.
- **pas de mesh avatar** : conforme état figé. Réintroduction = décision explicite ([[18-next-steps]]).
- zoom : slider HUD → `cam.setZoom(t)` (déjà supporté par `camera.ts`).

### 4.2 Caméra (existant, à réutiliser)

`GameCamera` fournit déjà : `setTarget(v)`, `setZoom(t)`, orbit yaw/pitch, `update(dt)`. Rien à réécrire, juste câbler `PlayerView` dessus.

## 5. HUD

### 5.1 Composants DOM (style [[09-direction-artistique]])

```txt
- Bandeau zone (haut)        : label zone active
- Objectif courant (haut-D)  : quête en cours (texte court)
- Slider zoom (latéral)      : EXISTE déjà, relier à PlayerView/camera
- Chat (bas-G)               : input + log, cooldown serveur
- Bouton pause               : EXISTE déjà
- Debug overlay (?mapDebug)  : fps, chunk courant, nb chunks résidents, position
```

### 5.2 Contrat HUD

```ts
// apps/game-client/src/game/hud.ts (étendre l'existant createHud/HudHandles)
export interface HudHandles {
  setZone(label: string): void;
  setObjective(text: string | null): void;
  onZoom(cb: (t: number) => void): void;       // slider → callback
  pushChat(line: { from: string; text: string }): void;
  onChatSend(cb: (text: string) => void): void;
  setDebug(info: DebugInfo | null): void;       // null = masqué
  setPaused(paused: boolean): void;
}
export interface DebugInfo {
  fps: number; chunk: [number, number]; residentChunks: number;
  pos: [number, number, number]; zone: string;
}
```

Règles :

- HUD = DOM pur, jamais dans `world.ts`.
- Accent UI `#F4C430`, fond `rgba(0,0,0,0.55)`.
- Chat : échapper le HTML (anti-XSS), cooldown côté serveur (anti-spam).

## 6. Flux par frame (boucle GameApp)

```txt
requestAnimationFrame
 ├─ input.update()
 ├─ player.update(dt, input, collision)     // déplacement + intention réseau
 ├─ zoneManager.update(dt, player.position)  // stream chunks
 ├─ camera.setTarget(player.position); camera.update(dt)
 ├─ world.update(dt)                          // eau/ambiances
 ├─ hud.setDebug(...) si ?mapDebug
 └─ renderer.render(scene, camera.three)
```

Transition de zone : joueur franchit `bounds` → `zoneManager.load(neighbor)` (ou portail explicite). Décharge complète + recharge ambiance + spawn.

## 7. Sécurité (à chaque diff, rappel CLAUDE.md)

- Toute intention déplacement/interaction validée serveur (Zod).
- Anti-triche position/vitesse côté serveur.
- Chat : cooldown + échappement XSS.
- Pas de secret client. Pas de logique sensible client.

## 7bis. État d'implémentation (2026-05-31)

Fait :

- Vue joueur : avatar local capsule articulé + joueurs distants + nametags (`render/players.ts`) — déjà en place.
- HUD étendu (`ui/hud.ts`) : `setZone()` bandeau zone, `setDebug()` overlay fps/zone/position (vue carte). ADR-006.
- `GameApp` : `activeZoneLabel` provisoire + `updateDebugOverlay()`.
- Toggle vue jouable/carte (`isMapView()`) + slider zoom : déjà présents.

À faire (différé, voir ADR-005) :

- `packages/shared/src/zones.ts`, registre `packages/content`, ZoneManager, ChunkStreamer.
- Refactor `world.ts` en builder de zone.
- Déclenché après terrain fiable ([[11-phase-0-terrain]]).

## 8. Tâches d'implémentation (ordre)

1. [ ] Types zones partagés `packages/shared/src/zones.ts`.
2. [ ] Registry `packages/content/src/zones/index.ts` (1 zone : saint-paul-littoral).
3. [ ] Étendre format manifest chunks (`{url,cx,cz,heightfield}` + `chunkSize`).
4. [ ] `ChunkStreamer.ts` (load/unload anneau + file limitée).
5. [ ] `ZoneManager.ts` (ambiance + streamer + dispose).
6. [ ] Refactor `world.ts` : devient builder de zone appelé par ZoneManager (retirer god-file).
7. [ ] `PlayerView.ts` (position logique, follow caméra, clamp sol, intention réseau).
8. [ ] Étendre `hud.ts` au contrat §5.2.
9. [ ] Câbler la boucle `GameApp` (§6).
10. [ ] Debug overlay `?mapDebug` (fps, chunk, résidents, pos).
11. [ ] Validation : typecheck + lint + build client ; playtest `?mapDebug` + note [[03-playtests]].

## 9. Dépendances décisionnelles

- Pré-requis dur : **terrain fiable** ([[11-phase-0-terrain]]) — le streamer a besoin de chunks + heightfields réels.
- En attendant : tester le streamer sur chunks STL fallback (jamais comme source finale).
- Décision avatar joueur visible : reste en attente ([[18-next-steps]]).
