# 2026-06-27 19:40 — FIX equipment : invariant inverse du slot

## Contexte

Phase FIX du cycle quotidien. Chantier : `equipment`.
Le run TEST (2026-06-27 19:22) avait releve que `itemDefinitionSchema.superRefine` ne contraignait que la categorie `equipement` (slot != aucun), sans verrouiller le sens inverse : un `consommable` / `cle` / `ressource` pouvait recevoir un slot et passer la validation.

## Diff

`packages/shared/src/protocol.ts` :

- Ajout constante centralisee `equippableCategories = ["equipement", "instrument"] as const satisfies readonly ItemCategory[]`.
- `superRefine` durci, invariant slot dans les deux sens :
  1. categorie equipable (`equipement`, `instrument`) -> slot != `aucun` obligatoire ;
  2. categorie non equipable -> slot doit etre `aucun`.
- Regle de stack inchangee (non empilable => maxStack 1).

Justification du choix : `instrument` est explicitement equipable (le `kayamb` se tient en main, slot `main`). On le range donc avec `equipement` dans `equippableCategories` plutot que d'ajouter une exception ad hoc.

## Tests

Rejoues avec le vrai `zod@4.4.3` du repo (store `.pnpm`) :

- catalogue actuel : PASS (20 objets, aucune regression).
- `kayamb` (instrument / main) : PASS.
- rejet `consommable` + `slot=main` : OK.
- rejet `instrument` + `slot=aucun` : OK.
- rejet `cle` + `slot=tete` : OK.

Type-check isole de la construction `as const satisfies readonly ItemCategory[]` : `tsc@6.0.3` strict, 0 erreur.

typecheck / lint / build projet : a relancer sous Windows (mount Linux : symlinks pnpm casses, `@riw/shared` non resolu en projet).

Note : pas de framework de tests unitaires dans le repo. L'invariant est garanti par le schema (source de verite partagee client/serveur) et verifie en sandbox. Mise en place d'un harness de tests = item futur potentiel.

## Risques / securite

- Donnees pures cote shared. Le durcissement **renforce** la validation serveur authoritative (input plus strict) : positif pour injection / donnees corrompues.
- Aucune surface reseau/DOM ajoutee. Pas de secret. Pas de `any`.
- 0 regression sur le catalogue existant.

## Suite

Round-robin -> chantier `game-logic` (phase DEV au prochain run).

Liens : [[2026-06-27-test-equipment-catalogue]] · [[../scheduled/daily-build-state]] · [[2026-06-26-equipment-item-catalog]]
