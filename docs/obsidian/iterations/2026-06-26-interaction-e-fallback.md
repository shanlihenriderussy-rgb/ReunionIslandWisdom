# 2026-06-26 - Fix interaction E / bouton parler

## Bug

Symptome :

- Le prompt `E Parler a Tatie Snack` s'affichait.
- Appuyer sur `E` ou le bouton mobile ne donnait parfois aucun dialogue visible.

Cause :

- `InputController` captait bien `KeyE`.
- `GameApp` envoyait uniquement `network.sendInteract(nearest.id)`.
- Si Colyseus etait offline, lent, ou pas encore synchronise, aucun `dialogueOpened` ne revenait au client.
- UX percue : bouton casse, meme si la validation serveur restait correcte.

## Fix

- `NetworkClient.openLocalDialogue(dialogue)` ajoute un dialogue local non autoritatif dans le snapshot client.
- `GameApp.updateNpcInteractions` ouvre ce dialogue local immediatement quand un PNJ proche est cible, puis envoie toujours `sendInteract`.
- `NetworkClient` normalise maintenant la reservation Colyseus 0.17 (`name/sessionId/roomId/processId`) vers le format attendu par `colyseus.js@0.16` (`room.name/room.roomId/room.processId`).
- `apps/game-server/src/index.ts` repasse par `Server.listen()` officiel, avec routes `/health` et `/healthz` Express, pour laisser Colyseus gerer CORS + `/matchmake`.
- `tools/launch-game.ps1` ouvre `localhost:5173` pour eviter le mix origin `127.0.0.1` client / `localhost` serveur.

## Securite

- Pas de recompense, inventaire, progression serveur ou etat persistant cote client.
- La validation serveur distance/cooldown reste en place.
- Ce fallback corrige uniquement le feedback de dialogue local.

## Playtest

Mode offline client seul :

- Desktop : prompt visible, touche `E` -> dialogue `Tatie Snack` ouvert.
- Mobile Pixel 5 : bouton action -> dialogue `Tatie Snack` ouvert.

Mode online client + serveur :

- `/health` serveur : OK.
- `/matchmake/joinOrCreate/reunion_world` : OPTIONS 204 CORS OK, POST 200 reservation OK.
- Chrome headless CDP : statut `En ligne`, prompt `E Parler a Tatie Snack`, touche `E` -> dialogue `Tatie Snack` ouvert.
- Erreur corrigee : `TypeError: Cannot read properties of undefined (reading 'name')` dans `colyseus.js`, causee par l'incompatibilite reservation serveur 0.17 / client 0.16.

Captures :

- `docs/obsidian/iterations/2026-06-26-interaction-e-fallback/desktop-key-e.png`
- `docs/obsidian/iterations/2026-06-26-interaction-e-fallback/mobile-action-button.png`
- `docs/obsidian/iterations/2026-06-26-interaction-e-fallback/online-key-e-fixed.png`

## Failles gameplay observees

P1 :

- Le dialogue mobile est trop haut et occupe presque tout le bas d'ecran. A reduire ou passer en bottom sheet compacte.
- La progression de quete est declenchee par ouverture de dialogue client/HUD, pas encore par etat serveur. A migrer avant recompenses.
- Risque versionning Colyseus : serveur 0.17 + `colyseus.js` 0.16 demandent un adaptateur de reservation tant que le client JS officiel ne publie pas une version 0.17 compatible.

P2 :

- Le prompt reste "Parler a X" pour tous les PNJ. Il faut varier l'action : parler, inspecter, observer, ramasser.
- Le premier objectif est valide immediatement au dialogue, sans choix ni confirmation joueur.
- Le joueur peut ouvrir le dialogue hors connexion : utile pour demo, mais il faut afficher clairement "hors ligne - progression non sauvegardee" plus tard.

P3 :

- Les notifications se superposent au dialogue en desktop.
- Le bouton action mobile reste tres gros face au texte de dialogue.
