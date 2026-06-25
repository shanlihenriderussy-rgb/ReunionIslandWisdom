# 2026-06-25 01:29 — TEST props-design : fumerolles Fournaise

## Contexte

Phase TEST du cycle quotidien. Cible : `makeFumarole` (vapeur volcan), livre en DEV le 2026-06-24, dans `apps/game-client/src/render/fournaise.ts`.

## Ce qui a ete teste

- Typecheck cible du fichier isole avec les vrais types `three@0.177` (tsconfig temporaire, stub `@riw/assets`) : **0 erreur**.
- Revue statique securite + DA.
- Verification geometrique des constantes (rayons, evitement centre, chevauchements).

## Resultats

- Module pur : pas de DOM, pas d'appel reseau ajoute, pas de `any`, pas de logique gameplay. Conforme CLAUDE.md.
- Non bloquant : aucun collider cree, le joueur traverse la vapeur.
- Anneau fumerolles : r entre 4.4 et 5.96 (`FUMAROLE_RING = RIM_RADIUS*0.72`). Centre cratere evite (seuil RIM*0.55 = 3.96). Pas de chevauchement avec le cone central (dist 2.0) ni l'anneau de rochers (7.2).
- Ancrage sol OK via `sampleHeight` (meme heightfield que les rochers).

## Limite environnement

- Les symlinks pnpm ne se resolvent pas sur le mount Linux du sandbox : `tsc` au niveau projet echoue sur `vite/client`/`three` (artefact, pas une erreur de code). tsc projet + ESLint + build a relancer sous Windows par Shan.

## Bugs / polish remontes pour FIX

1. Vapeur `transparent: true` sans `depthWrite: false` -> risque de halo / mauvais tri de transparence devant rochers et cones. Fix simple : ajouter `depthWrite: false`.
2. Proximite possible fumerolle <-> cairn "Rebord Dolomieu" (65.9,-35) selon le tirage seed. A confirmer en `?mapDebug` ; sinon reduire `FUMAROLE_RING` ou exclure le secteur du cairn.

## A verifier en `?mapDebug`

- Vapeur bien ancree au sol (pas flottante / pas enterree).
- Pas de halo translucide disgracieux devant les rochers.
- Lisibilite : les 5 fumerolles renforcent l'ambiance sans masquer les 3 reperes d'objectif.

## Suite

Phase suivante : FIX props-design (appliquer `depthWrite:false`, verifier proximite cairn). Puis round-robin -> equipment.
