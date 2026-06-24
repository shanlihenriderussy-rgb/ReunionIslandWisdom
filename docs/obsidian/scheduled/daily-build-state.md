# Etat du build quotidien (riw-build-quotidien)

Cycle : 1 phase par jour. DEV -> TEST -> FIX -> chantier suivant.

## Etat courant

- phase: TEST
- chantier: props-design
- prochain_chantier: equipment

## Politique de validation (sandbox)

- Le sandbox peut bloquer le `pnpm build` complet (`spawn EPERM` cote Vite / resolution Windows).
- Chaque run : typecheck/lint/logique quand possible + note explicite si build a refaire hors sandbox.
- Shan lance `corepack pnpm ... typecheck/lint/build` quand il ouvre le repo.

## Feature testee (resultat phase TEST 2026-06-07 22:11)

- level-design : `WEST_BLOCKOUT_PATH_LENGTH` (114.557) + `getNearestPathProgress`.
- Logique rejouee : depart=0, fin=1, monotone sur les 18 points, borne [0,1] OK.
- Revue statique : pas de `any`, pas de DOM, module pur. Conforme CLAUDE.md.
- typecheck/lint/build : a relancer sous Windows (sandbox ne peut pas).

## Feature a tester (livree DEV 2026-06-24 17:29)

- props-design : `makeFumarole` dans `apps/game-client/src/render/fournaise.ts`.
- 5 fumerolles seedees (`FUMAROLE_SEED=0x3b9a17`) sur anneau interieur du cratere.
- Vapeur = 3 bouffees icosaedre translucides + event basalte. Non bloquant (pas de collider).
- Validation technique 2026-06-25 : typecheck OK, lint OK. Build Vite bloque par sandbox Windows (`spawn EPERM`) apres `tsc` OK.
- A verifier en phase TEST : ancrage sol, opacite, pas de chevauchement avec reperes objectif.

## Bugs en attente (renseignes par TEST, corriges par FIX)

- Pas de bug bloquant (precedents corriges).

## Chantiers (round-robin)

1. level-design
2. props-design
3. equipment
4. game-logic
5. enemy
6. fight-aspect
7. fight-logic
8. gaming-style

## Historique

- 2026-06-07 22:00 — DEV level-design : ajout helpers progression sentier ouest. Phase suivante : TEST.
- 2026-06-07 22:11 — TEST level-design : logique validee (0..1, monotone), aucun bug bloquant, 1 polish note. Phase suivante : FIX.
- 2026-06-15 18:53 — FIX level-design : ajout `isOnWestPath` + `WEST_BLOCKOUT_PATH_HALF_WIDTH` (seuil lateral sentier ouest). Module pur, 6/6 cas OK. Round-robin -> props-design. Phase suivante : DEV.
- 2026-06-24 17:29 — DEV props-design : ajout `makeFumarole` (vapeur volcan, 5 fumerolles seedees, non bloquant) dans `fournaise.ts`. Reecriture complete du fichier (mount Linux laggait, fichier Windows OK). Phase suivante : TEST.

## Validation distribution 2026-06-25 03:19

- `corepack pnpm release:web` lance hors sandbox : typecheck OK, lint OK, build Vite OK.
- Zip genere : `output/reunion-island-wisdom-web-0.1.0-20260625-031928.zip` (25,5 Mo).
- Dette perf immediate : zip contient encore le GLB terrain monolithique 18,3 Mo.