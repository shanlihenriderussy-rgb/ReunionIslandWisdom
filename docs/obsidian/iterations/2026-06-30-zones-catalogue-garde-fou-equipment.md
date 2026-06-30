# 2026-06-30 08:02 — Zones V1 + garde-fou catalogue equipment

## Contexte

Suite du point `2026-06-27-test-equipment-catalogue`.

Le correctif schema etait deja present dans `packages/shared/src/protocol.ts` :

- categories equipables = `equipement` + `instrument` ;
- categorie equipable -> slot reel obligatoire ;
- autre categorie -> slot `aucun` obligatoire.

Manque restant : un test negatif vivant dans le repo.

## Diff

- `packages/content/scripts/validate-content.ts` :
  - ajout de tests negatifs executes pendant `validate:content` ;
  - rejet attendu : consommable avec slot ;
  - rejet attendu : instrument sans slot ;
  - rejet attendu : cle avec slot.
- `packages/content/data/zones.json` :
  - ajout de `saint-denis`, `mafate`, `salazie`, `cilaos` ;
  - descriptions alignees avec `docs/obsidian/21-systeme-de-jeu.md` ;
  - positions reprises des centres `WORLD_BIOMES` existants.

## Validation

- `corepack pnpm validate:content` : OK.
- `corepack pnpm --filter @riw/content typecheck` : OK.
- `corepack pnpm --filter @riw/content lint` : OK.
- `corepack pnpm typecheck` : OK.
- `corepack pnpm lint` : OK.
- `corepack pnpm build` : OK.

Le catalogue actuel reste valide. Les 3 tests negatifs item definition passent. Les nouvelles zones restent dans `worldBounds`.

## Risques / securite

- Donnees pures.
- Pas de surface reseau/DOM ajoutee.
- Le durcissement equipment reduit le risque de donnees serveur incoherentes.

## Suite

- Brancher ces zones catalogue dans une logique de selection/transition seulement apres terrain fiable et ZoneManager.
- Garder V1 sans stats RPG : souvenirs, titres, emotes, progression quetes, position sauvegardee.

Liens : [[2026-06-27-test-equipment-catalogue]] · [[2026-06-27-fix-equipment-invariant-slot]] · [[../21-systeme-de-jeu]]
