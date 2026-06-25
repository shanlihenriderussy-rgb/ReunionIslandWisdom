# 2026-06-25 - Fix interaction touche E

## Probleme

- Symptôme : appuyer sur `E` près d'un PNJ n'ouvre pas le dialogue.
- La touche est bien capturée côté client (`InputController`).
- Le client démarrait visuellement sur Saint-Paul / Saint-Gilles, près des PNJ.
- Le serveur démarrait encore le joueur authoritative à la Fournaise.
- Résultat : le client envoyait `interact`, mais le serveur refusait l'action car la distance joueur/PNJ était trop grande.

## Correction

- `apps/game-server/src/rooms/ReunionWorldRoom.ts`
  - `startZone` repassé temporairement sur `saint-paul-saint-gilles`.
  - `activeEvent` repassé sur `parcours-ouest`.

## Pourquoi temporaire

- Les PNJ interactifs actuels existent côté Ouest.
- Tant que la zone Fournaise n'a pas ses propres interactions ou que le client n'est pas entièrement réaligné sur Fournaise, la build interactive doit rester Ouest.
- Le vrai chantier reste l'audit visuel global : une seule zone active doit piloter spawn, HUD, PNJ, objectifs et caméra.

## Validation attendue

- Lancer serveur + client.
- Aller près de Tatie Snack ou d'un PNJ Ouest.
- Le prompt `E` apparaît.
- Appuyer `E`.
- Le dialogue PNJ s'ouvre.

## Validation faite

- `corepack pnpm typecheck` : OK.
- `corepack pnpm lint` : OK.
- Test Colyseus réel :
  - serveur lancé sur `ws://127.0.0.1:2567` ;
  - client test rejoint `reunion_world` ;
  - envoi `interact` avec `targetId: "tatie-snack"` ;
  - réponse reçue : `dialogueOpened` avec `npcName: "Tatie Snack"`.
