# 2026-06-29 15:23 — DEV game-logic : progression joueur serveur-authoritative

## Contexte

Chantier round-robin du jour : `game-logic` (progression + interaction serveur authoritative).
Item P1 backlog : « Migrer la progression de quete dialogue vers un etat serveur authoritative
avant recompenses/inventaire ». Debloque aussi le combat (« stocker reellement les souvenirs gagnes »).

Jusqu'ici : parler a un PNJ ouvrait un dialogue, vaincre une cible PvE annoncait un souvenir,
mais **rien n'etait stocke**. Aucune trace de progression cote serveur.

## Diff

Slice minimale, serveur uniquement (additif, aucun changement de contrat cassant).

1. `packages/shared/src/protocol.ts`
   - `playerProgressionSchema` (Zod) : `souvenirs: string[]` (max 200) + `quetes: string[]` (max 100).
   - `progressionUpdatedSchema` (= schema progression) : message serveur -> client.
   - Type `PlayerProgression`.

2. `apps/game-server/src/progression/ProgressionStore.ts` (nouveau, **module pur**)
   - Meme philosophie que `CombatSystem` : zero dependance Colyseus / Three / DOM / reseau, testable seul.
   - Etat par joueur : `Set` souvenirs + `Set` quetes (dedup natif).
   - `ensure` / `addSouvenir` / `discoverQuest` (retournent `true` seulement sur nouvel ajout) / `snapshot` (trie, deterministe) / `forget`.
   - Plafonds anti-abus : 200 souvenirs, 100 quetes.

3. `apps/game-server/src/rooms/ReunionWorldRoom.ts`
   - Index `questsByGiverNpc` (PNJ donneur -> ids quetes) derive du content une fois.
   - `onJoin` : `ensure` + envoi initial `progression`.
   - `onLeave` : `forget`.
   - `interact` : apres `dialogueOpened`, decouverte des quetes du PNJ ; envoi `progression` si changement.
   - `attack` (cible vaincue) : `addSouvenir(def.reward)` ; envoi `progression` si nouvel.
   - `sendProgression(client)` : envoi **prive** au seul proprietaire (jamais broadcast).

## Tests

- Sanity logique + Zod avec le vrai `zod@4.4.3` du repo (sandbox) : **13/13 PASS**.
  - dedup souvenir/quete, rejet valeur vide, tri deterministe, parse snapshot OK (rempli + vide),
    `forget` remet a vide, rejets Zod (souvenir vide, quete > 60 car).
- Syntaxe des 3 fichiers validee via `node --experimental-strip-types --check` : exit 0.
- typecheck/lint/build projet **a relancer sous Windows** : symlinks pnpm casses sur le mount Linux
  (`typescript/bin/tsc` non resolu) — limitation connue du sandbox, pas du code.

## Risques

- Securite : message `progression` envoye au seul `client` proprietaire -> pas d'IDOR, pas de fuite
  de la progression d'autrui. Valeurs (`def.reward`, `quest.id`) issues du **content serveur**, jamais
  de l'entree client -> pas d'injection. Dedup + plafonds -> pas de croissance memoire non bornee.
  Piggyback sur les chemins deja valides (Zod + cooldown + distance) de `interact`/`attack`.
- Compat : message sortant additif ; le client actuel ignore les messages inconnus -> aucune regression.
- Persistance : en memoire (par room). Sauvegarde durable = futur (Supabase, cf. backlog).

## Suite

- TEST (prochain run) : rejouer la logique, verifier integration room (join -> progression vide,
  parler donneur -> quete, vaincre cible -> souvenir), confirmer typecheck/lint sous Windows.
- Cablage client (afficher souvenirs/quetes au HUD) = slice suivante (hors « une pierre » du jour).
- Relier `rewardTitle` quete -> id catalogue objet quand l'inventaire serveur arrivera.

Cf. [[../21-systeme-de-jeu]], [[../02-backlog]], [[../04-decisions]] ADR-020.
