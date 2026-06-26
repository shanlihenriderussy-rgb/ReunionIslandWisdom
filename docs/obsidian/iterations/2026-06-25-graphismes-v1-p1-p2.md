# 2026-06-25 — Rendu graphique V1 (P1 + P2)

> Lié à [[../25-graphismes-ameliorations]] (plan priorisé, audit Codex).
> Cadre DA : [[../09-direction-artistique]] « Jour Tropical », règle « un asset = zone + quête + rôle ».
> Runtime non rejoué en sandbox (`spawn EPERM` + mount désync). Validation Windows requise.

## Contexte

Application de l'ordre P1 acté (HUD bloqueur d'abord, puis Fournaise, puis dette perf),
suivie des P2 à faible coût / fort effet. Aucun nouvel asset externe ; overrides runtime
uniquement (pas de recompilation de shader).

## Diff

P1 :

- `ui/hud.ts` — HUD mock masqué par défaut, réaffichable via `?hudMock`. Masqués : frame
  joueur (HP/Mana + badge niveau 25), minimap SVG trompeuse (statusCard zone/online conservé),
  hotbar 10 slots + barre XP, panneau « Détails de l'objet », boutons Sac et Social.
  Conservés : objectif Fournaise, zone, notifications, chat, carte, options, pause.
- `render/fournaise.ts` — fond cratère Dolomieu (disque roche `#3a1e16`) + nappe de lave
  additive `#ff6a2a` (opacité 0.32, `depthWrite:false`), pulsation ~1.6 s via
  `updateFournaiseFx`. Fumerolles `depthWrite:false` (fin du halo opaque). Cône central
  abaissé (1.6 → 1.2) + socle scorie. Apex sable clair sur le cairn. Clamp bas des scories
  (`max(0.18, scale*0.45)`).
- `game/GameApp.ts` — appel `updateFournaiseFx(elapsed)` dans la boucle ; exposure 1.18 → 1.28 ;
  `shadowMap.type = PCFSoftShadowMap` (ombres douces).
- `render/world.ts` — `addLaReunionVectorMap` sonde d'abord le manifeste de chunks : si
  streaming RGE ALTI valide, le GLB monolithique 18 Mo n'est plus chargé (fetch+parse évités).

P2 :

- `game/camera.ts` — offset `(0,4.8,7.2)` → `(0,3.4,5.6)`, `lookAtHeight 1.28 → 1.1`,
  distance `lerp(0.58,2.25)` → `lerp(0.85,2.0)`, lerp caméra `7 → 5.5` (anti-pompage).
- `render/world.ts` — hemi ground `#5f8e44` → `#4f7c39`, soleil `3.45 → 2.9` + `shadow.bias -0.0006`.
- `render/westScenic.ts` — toits créoles chauds (`#d4572f/c0392b/a13a1f/8e2a18`), barque
  coque rouge `#b5402b` + liston vert, cordage `LineSegments` entre pieux du ponton.
- `render/gltf.ts` — troncs : seuil sombre `0.12 → 0.18`, brun chaud `#4a3526` (tronc) /
  `#274d2e` (feuillage), emissive `#152a17` 0.06.
- `world/westVegetation.ts` — canopée pondérée (`pickCanopyUrl`, ~60 % palmiers droits),
  densité Maido réduite (rebord −50 %, mi-pente −25 %).
- `render/westVegetation.ts` — tilt sol côté sentier `0.42 → 0.32` (rochers/barrières gardent 0.42).

## Tests

- Revue statique TS faite (narrowing matériaux, scopes, types tuple).
- À rejouer sous Windows :
  - `corepack pnpm --filter @riw/game-client typecheck`
  - `corepack pnpm --filter @riw/game-client lint`
  - `corepack pnpm --filter @riw/game-client build`
  - Captures `?mapDebug` + `?hudMock` (HUD complet vs nettoyé) + zone Fournaise (lave, fumerolles).

## Risques

- `?hudMock` : la touche I ouvre encore la modale inventaire mock (accès clavier non coupé) —
  acceptable hors capture ; couper plus tard avec le flag si gênant.
- Lave additive : surveiller le rendu sous brouillard chaud / sur mobile (transparent + renderOrder).
- Densité Maido : seed inchangé mais séquence RNG décalée par les `continue` → la forêt ouest
  change légèrement partout (attendu, pas un bug). Re-valider la lisibilité du sentier.
- Skip GLB monolithique : si le manifeste chunk est absent/invalide, fallback monolithique OK.

## Suite

1. Color grading LUT « jourTropical » + houle animée bandes d'écume (P2 restants).
2. Instancing palmiers/rochers ouest (P3 perf mobile).
3. Override lumière volcan `?biomeDebug=fournaise` (soleil orange + fog chaud).
4. Test visuel Playwright vs moodboards (P3 outillage).
