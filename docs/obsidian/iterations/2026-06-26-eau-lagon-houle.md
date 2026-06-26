# 2026-06-26 — Eau : lagon bicolore + houle ecume (P2)

> Suite du lot graphismes [[25-graphismes-ameliorations]] (P2 "eau / lagon").
> Cadre : DA "Jour Tropical" ([[09-direction-artistique]]), pas de nouvel asset.

## Contexte

- Plan P2 demandait : ocean bicolore proche/large + houle sur les bandes d'ecume.
- Reprise apres lot P1 + debut P2 deja appliques (camera, lumiere, cote ouest, vegetation).

## Diff

- `render/world.ts`
  - Ocean : `PlaneGeometry(520,520,32,32)` + vertex colors via `applyOceanGradient`.
  - Gradient radial `#60D4D1` (lagon, origine) -> `#0E6E84` (large), facteur `r*r`,
    rayon `OCEAN_GRADIENT_RADIUS=230`. Materiau `MeshStandardMaterial vertexColors`.
  - Pas de normalMap : aucun asset texture licencie (cf. CLAUDE.md assets).
- `render/westScenic.ts`
  - `updateWestWaterFx(elapsed)` exporte : bob vertical ±0.02 m sur 4 s (cos) +
    battement d'opacite sur l'ecume. Module pur, pas de DOM, pas de timer interne.
  - Bandes d'ecume enregistrees dans `waterFx` avec phase decalee (`i*1.7`),
    `waterFx.length=0` au (re)build pour eviter l'empilement.
- `game/GameApp.ts`
  - Import + appel `updateWestWaterFx(this.clock.elapsedTime)` dans la boucle,
    a cote de `updateFournaiseFx`.

## Tests

- Sanity node (logique pure, sans three) :
  - Cote ouest (-80,15) : `r=0.35` -> reste cote lagon (canal vert eleve). OK.
  - Large (clamp `r=1`) : `#0E6E84` (~0.05,0.43,0.52). OK.
  - Houle : bob Y borne `[-0.020, 0.020]`, opacite bornee `[0.59, 0.72] <= baseOpacity`. OK.
- Revue statique : pas de `any`, pas de DOM, pas de reseau. Conforme CLAUDE.md.
- typecheck/lint/build : a relancer sous Windows (sandbox `spawn EPERM` + symlinks pnpm).

## Risques

- Distance radiale depuis l'origine : si le hub jouable s'eloigne beaucoup de
  l'origine, ajuster `OCEAN_GRADIENT_RADIUS`. Actuel : cote ouest bien en zone lagon.
- FX additif leger (opacite) : negligeable perf, deja transparent existant.

## Suite

- Capture `?mapDebug` avant/apres sous Windows.
- Prochain P2 possible : color grading LUT `jourTropical` + weathering toits.
