# 2026-06-26 07:20 — FIX props-design : garde-fou clearance fumerolles

## Contexte

Phase FIX du cycle quotidien, chantier `props-design`.
Cible : les 2 points notes par la phase TEST du 2026-06-25 sur `makeFumarole`
(`apps/game-client/src/render/fournaise.ts`).

## Diff

1. Polish transparence : verifie que `depthWrite:false` est deja en place sur les
   bouffees de vapeur (ligne 297). Rien a corriger.
2. Garde-fou de proximite (nouveau) :
   - constantes `FUMAROLE_MIN_CLEAR = 2.2`, `CAIRN_POS`, `CONE_POS` ;
   - dans la boucle de placement des fumerolles, si une fumerolle tombe a moins
     de 2.2 d'un repere d'objectif (cairn Rebord Dolomieu ou cone central), on
     tourne l'angle de +0.9 rad (deterministe, ne consomme pas le rng), borne a
     8 essais, jusqu'a degager la marge ;
   - appels `makeCairn` / `makeConeMarker` recables sur `CAIRN_POS` / `CONE_POS`
     (suppression des coords magiques dupliquees).

Patch cible, module pur, pas de DOM, pas de reseau, pas de collider, pas de `any`.

## Tests

- Rejeu logique sous node (replique mulberry32 + boucle) :
  - seed actuel `0x3b9a17` : positions des 5 fumerolles inchangees (aucun nudge
    declenche), donc 0 regression visuelle ;
  - distances min : dCairn = 2.55, dCone = 3.65 ; toutes >= 2.2.
- Le garde-fou protege contre tout futur changement de seed ou de `FUMAROLE_RING`.
- typecheck / lint / build : a relancer sous Windows. Le mount Linux du sandbox
  tronque ce fichier (copie partielle ~280 lignes vs reel complet) et les
  symlinks pnpm (`three`, `vite/client`) ne sont pas resolus -> validation projet
  impossible ici. Comportement identique aux runs precedents.

## Risques

- Faible. Aucune regression au seed courant. Le nudge reste dans l'anneau
  (`r` constant), donc les fumerolles restent ancrees au rebord du cratere.
- A confirmer en `?mapDebug` : lisibilite de la zone Fournaise (fumerolles vs
  cairn/cone) une fois le build relance.

## Suite

- Round-robin : chantier suivant `equipment` (items / inventaire data cote
  serveur), phase DEV au prochain run.
