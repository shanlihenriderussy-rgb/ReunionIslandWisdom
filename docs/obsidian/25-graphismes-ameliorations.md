# 25 — Améliorations graphismes (synthèse priorisée)

> Source : audit code Codex 2026-06-25 (terrain, westScenic, westVegetation, fournaise, players, hud, tokens).
> Cadre : ne pas casser la DA « Jour Tropical » ([[09-direction-artistique]]) ni la règle « un asset = zone + quête + rôle » ([[CLAUDE]]).
> Lié à [[23-design-system-hud]], [[02-backlog]], [[04-decisions]], audit HUD 2026-06-25.
> Runtime non rejoué ici (sandbox `spawn EPERM`) : toute capture/validation visuelle se fait sous Windows.

## Décision de priorité (producer)

Ordre acté pour les 4 P1 :

1. **HUD mock caché par défaut** — FAIT EN PREMIER. L'audit 2026-06-25 classe le HUD `no-go public` : c'est un bloqueur, pas du polish. Gauges/minimap/hotbar/inventaire mockés donnent une fausse promesse de gameplay. Gate derrière `?mapDebug` / drapeau `featureFlags`.
2. **Nappe lave + ring cratère Dolomieu** + `depthWrite:false` fumerolles — lecture Fournaise (zone de départ), fort impact capture.
3. **Désactiver GLB monolithique si streamer actif** — zéro visuel, gros gain perf, trivial, aucun risque.

Raison : bloqueur d'abord (HUD), puis la zone de départ (1re impression joueur), puis dette perf sûre.

## P1 — bloquant / quick win fort

- HUD : masquer par défaut gauges HP/Mana/XP, minimap trompeuse, hotbar 10 slots, inventaire modal préchargé (tant que combat/inventaire serveur absents). Gate `?mapDebug` ou `featureFlags`.
- Fournaise : nappe lave `MeshBasicMaterial` additive `#FF6A2A` au fond Dolomieu (z≈-39, r<3, opacity 0.25–0.35, pulsation ~1.6 s) + fond cratère `#3a1e16`.
- Fumerolles : `puffMat.depthWrite = false; transparent = true` (halo devant rochers/cône — cf. test 2026-06-25).
- Perf : `if (chunkStreamerActive) skip monolithicLoad` dans `addLaReunionVectorMap` (GLB 18 Mo encore chargé en parallèle).

## P2 — fort effet, faible coût

- Caméra : offset `(0,4.8,7.2)→(0,3.4,5.6)`, `lookAtHeight 1.28→1.1`, distance mult `(0.58,2.25)→(0.85,2.0)`, lerp `delta*7→delta*5.5` (anti-pompage 30 fps).
- Color grading : LUT `jourTropical` 16³ inline (shadow chaude / highlight cyan), exposure `1.18→1.32`. — exposure **FAIT** (1.28) + `PCFSoftShadowMap`. **LUT REPORTÉE** : impose un `EffectComposer`/pass post-process (recompil shader, coût mobile) → contraire aux garde-fous. Décision archi requise avant impl. Cf. [[04-decisions]].
- Côte ouest : toits cases plus chauds (`#d4572f/c0392b/a13a1f/8e2a18` + weathering vertexColor), cordage `LineSegments` ponton, barque colorée par index path, kiosk `roofMesh.scale.z 0.78→0.7` + `castShadow` poteaux. — toits chauds + cordage + barque **FAITS** (lot P1/P2 antérieur) ; **weathering vertexColor toits FAIT 2026-06-26** (`weatherRoof` sur cases + kiosk, faîte éclairci / avant-toit assombri + rouille). Cf. [[iterations/2026-06-26-toits-weathering]].
- Eau / lagon : océan bicolore proche/large (`#60D4D1→#0E6E84`) + normalMap tuile ; houle ±0.02 sur 4 s (cos) sur bandes d'écume. — **FAIT 2026-06-26** (bicolore par vertex colors + `updateWestWaterFx` ; normalMap reportée, pas d'asset licencié). Cf. [[iterations/2026-06-26-eau-lagon-houle]].
- Végétation : pondérer canopée (60 % palmStraight / 15 palmBend / 15 treePalm / 10 treeDetailed), réduire densité Maido (`SAMPLES_PER_UNIT 0.9→0.45`, retirer 2e cluster), éclaircir troncs (clamp `maxChannel 0.12→0.18` + emissive `#1b2d1a` 0.08).

## P3 — perf / cohérence / fond

- Instancing palmiers/rochers ouest (`InstancedMesh`, ~−30 % draw calls mobile) + boundary rocks Fournaise. — **palmiers/rochers Ouest FAITS 2026-06-26** (`buildGltfInstances` dans `gltf.ts`, branché `westVegetation.ts`, sanity matrices = prop classique). Boundary rocks Fournaise : à faire. Cf. [[04-decisions]] ADR-011, [[iterations/2026-06-26-instancing-vegetation]]. NB Shan : ne corrige pas le warning bundle (chantier code-splitting séparé).
- Volcan : override `?biomeDebug=fournaise` → soleil `0xff8c42` int 2.4 + fog chaud `0xf0c8a0` (pas de recompil shader). Bake vertexColor plus rouge quart SE dans `build-lareunion-dem-terrain.mjs`.
- Soleil global `3.45→2.6` + `PCFSoftShadowMap` + `shadowMap 2048→1536` (ou `1024` si `devicePixelRatio<1.5`).
- Police titres : WOFF2 `Paytone One` subset embarqué (data URL) au lieu du fallback system-ui.
- SVG HUD : migrer 15+ inline en `<symbol>` `components.css` (~−40 % DOM).
- Post-process : vignette douce + grain léger (0.025) + selective bloom stencil sur lave/fumées.

## Détails techniques par fichier

Cf. synthèse source pour les valeurs exactes (constantes, geometries, couleurs) :

- Terrain / matériaux : `world.ts`, `ChunkStreamer.applyTerrainChunkMaterial`, `tools/build-lareunion-dem-terrain.mjs`.
- Végétation ouest : `render/westVegetation.ts`, `gltf.ts` (Box3 base, tilt).
- Côte ouest : `render/westScenic.ts` (kiosk, cases, ponton, barque, écume, shoreline).
- Fournaise : `render/fournaise.ts` (cratère, cône, scories, cairn, poteau-flèche, lumière).
- Joueurs : `render/players.ts` (capsule, distants, nametag, indicateur direction).
- Caméra : `game/camera.ts` `updateFollowCamera`, `game/GameApp.ts` loop.
- HUD : `ui/hud.ts`, `styles.css`, `docs/design-system/hud/*`.

## Outillage proposé

- Test visuel Playwright `tests/visual/` : capture zone par zone vs moodboard `docs/Refs`, tolérance ΔE2000 5 %.
- `tools/build-windows.ps1` : `NODE_OPTIONS=--max-old-space-size=4096` pour contourner `spawn EPERM`.
- `pnpm bench:gpu` : mesure ms/frame (1000 boxes + 100 palm GLB) à chaque PR visuelle.

## Garde-fous

- Aucun nouvel asset externe sans licence ni rôle zone/quête.
- Pas de recompil shader lourde côté mobile ; privilégier overrides runtime (couleur, fog, intensité).
- Vérifier perf medium-mobile après chaque ajout transparent/ombre.
- Tout changement visuel → capture `?mapDebug` + note playtest.
