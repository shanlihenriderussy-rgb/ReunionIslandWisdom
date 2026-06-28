# 2026-06-27 19:22 — TEST equipment : catalogue d'objets + schema Zod

## Contexte

Phase TEST du cycle quotidien. Chantier : `equipment`.
Feature testee : catalogue d'objets structure (`item-catalog.json`, 20 objets) + schema partage `itemDefinitionSchema` / `itemCatalogSchema` (`packages/shared/src/protocol.ts`), livree au run DEV du 2026-06-26.

## Methode

Le mount Linux du sandbox ne resout pas les symlinks pnpm (`tsx`, `@riw/shared` introuvables). Les commandes `corepack pnpm ... typecheck/validate:content` echouent donc en environnement sandbox (connu, cf. politique d'etat).

Contournement : logique du schema rejouee dans un script Node autonome important le **vrai** `zod@4.4.3` depuis le store `node_modules/.pnpm/zod@4.4.3/...` (meme version que le repo). Tests positifs + tests negatifs.

## Resultats

Positifs :

- `itemCatalogSchema.parse(catalog)` : 20 objets parses, 0 erreur.
- Integrite `items.json` <-> `item-catalog.json` : inclusion + completude OK (20/20).
- Unicite des ids : OK.

Negatifs (le schema doit rejeter) :

- `equipement` avec `slot=aucun` -> rejete OK.
- non empilable avec `maxStack=5` -> rejete OK.
- categorie inconnue -> rejete OK.
- `maxStack` non entier (1.5) -> rejete OK.

Qualite des donnees :

- Repartition categories : 5 consommable, 5 cle, 7 equipement, 2 ressource, 1 instrument.
- Repartition slots : 12 aucun, 3 accessoire, 2 tete, 1 corps, 1 pieds, 1 main.
- 7 equipements : tous slot reel, non empilables, `maxStack=1`, poids 0.05..0.8 (senses).
- Aucun poids hors plage.

## Finding (mineur, non bloquant)

`kayamb` est `category:"instrument"` avec `slot:"main"`. C'est coherent avec l'intention (instrument tenu en main), mais le `superRefine` ne contraint **que** la categorie `equipement` (slot != aucun). Consequence : un `consommable` / `cle` / `monnaie` / `ressource` pourrait se voir attribuer un slot et passer la validation. L'invariant inverse n'est pas verrouille.

Donnees actuelles : conformes (seuls equipement + l'instrument voulu portent un slot). Pas d'impact runtime (donnees pures, pas encore branchees client/serveur).

## Suite (FIX prochain run)

Durcir `itemDefinitionSchema.superRefine` :

- categories equipables = `equipement` + `instrument` -> slot != `aucun` autorise/obligatoire ;
- toutes autres categories -> slot doit etre `aucun`.

Ajouter un test negatif (consommable avec slot). 0 regression attendue sur le catalogue actuel.

## Validation

- Logique Zod (zod 4.4.3 reel) : OK.
- typecheck / lint / build projet : a relancer sous Windows (symlinks pnpm casses dans le sandbox).
- Securite : feature = donnees pures, aucune surface reseau/DOM ajoutee. RAS.

Liens : [[../scheduled/daily-build-state]] · [[2026-06-26-equipment-item-catalog]]
