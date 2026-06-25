# Etat du build quotidien (riw-build-quotidien)

Cycle : 1 phase par jour. DEV -> TEST -> FIX -> chantier suivant.

## Etat courant

- phase: FIX
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

## Feature testee (resultat phase TEST 2026-06-25 01:29)

- props-design : `makeFumarole` dans `apps/game-client/src/render/fournaise.ts`.
- Typecheck cible du fichier isole (vrais types `three` 0.177) : 0 erreur.
- Note env : symlinks pnpm non resolus sur le mount Linux (`vite/client`/`three` introuvables via tsc projet). tsc projet + lint a relancer sous Windows.
- Revue statique : module pur, pas de DOM, pas de reseau ajoute, pas de `any`. Non bloquant (aucun collider). Conforme CLAUDE.md.
- Geometrie verifiee : anneau fumerolles r=4.4..5.96 (RIM_RADIUS*0.72), centre cratere evite (min > RIM*0.55=3.96), pas de chevauchement avec cone central (dist 2.0) ni rebord rocheux (7.2). Ancrage sol OK via `sampleHeight`.

## Feature a corriger / polish (FIX du jour suivant)

- props-design : bouffees de vapeur `transparent:true` sans `depthWrite:false` -> risque de halo/tri de transparence devant rochers et cones. Ajouter `depthWrite:false` + leger `roughness`/`emissive` froid optionnel.
- Proximite possible fumerolle <-> cairn "Rebord Dolomieu" (65.9,-35, dist centre 4.0) selon tirage seed : verifier en `?mapDebug`, sinon reduire `FUMAROLE_RING` ou exclure secteur cairn.

## Bugs en attente (renseignes par TEST, corriges par FIX)

- Audit visuel global 2026-06-25 : no-go public.
- P1 : depart Ouest mais objectif Fournaise ; PNJ visibles alors que doc dit non spawnes ; couches monde trop nombreuses ; HUD mock trop actif ; risque overlap GLB monolithique/chunks.
- Detail : [[../playtests/2026-06-25-audit-visuel-global]].

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
- 2026-06-25 01:29 — TEST props-design : `makeFumarole` valide. Typecheck fichier isole 0 erreur (types three reels). Geometrie/ancrage OK, non bloquant. 1 polish (transparence sans depthWrite) + 1 verif mapDebug (proximite cairn). Phase suivante : FIX.

## Validation distribution 2026-06-25 03:19

- `corepack pnpm release:web` lance hors sandbox : typecheck OK, lint OK, build Vite OK.
- Zip genere : `output/reunion-island-wisdom-web-0.1.0-20260625-031928.zip` (25,5 Mo).
- Dette perf immediate : zip contient encore le GLB terrain monolithique 18,3 Mo.
## Fix visuel ouest 2026-06-25

- Corrections : sentier vertex-height par bord, props inclines normale terrain, vegetation GLB DoubleSide + noirs releves, chunks terrain adoucis.
- Validation : typecheck OK, lint OK.
- Build : a relancer hors sandbox (`spawn EPERM` Vite dans Codex).
## Package retry 2026-06-25 03:49

- Cause echec Shan : dossier `output/reunion-island-wisdom-web` verrouille par serveur local.
- Fix : staging versionne par release, zip plat avec `index.html` a la racine.
- Validation : `corepack pnpm package:web` OK -> `output/reunion-island-wisdom-web-0.1.0-20260625-035327.zip`.

## Validation PWA + desktop 2026-06-25 05:55

- `corepack pnpm install` : OK.
- `corepack pnpm --filter @riw/game-client typecheck` : OK.
- `corepack pnpm --filter @riw/game-client lint` : OK.
- `corepack pnpm cook:web` : OK -> `output/reunion-island-wisdom-web-0.1.0-20260625-054947.zip`.
- `corepack pnpm cook:desktop` : OK.
- Artefacts desktop :
  - `apps/game-client/src-tauri/target/release/bundle/msi/Reunion Island Wisdom_0.1.0_x64_en-US.msi` (22,82 Mo) ;
  - `apps/game-client/src-tauri/target/release/bundle/nsis/Reunion Island Wisdom_0.1.0_x64-setup.exe` (21,76 Mo).
