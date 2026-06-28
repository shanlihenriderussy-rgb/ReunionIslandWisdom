# 2026-06-27 — Fix : vegetation Ouest flottante

## Contexte

- Screenshot Shan (jeu lance, depart Ouest) : des palmiers (cluster nord-ouest) flottent au-dessus du sol. Le joueur, lui, est bien au sol.
- Cause : la vegetation se posait sur `lareunion-relief-collision.json` (relief GLOBAL, source de filtrage), alors que le sol VISIBLE (et le joueur) vient des **heightfields de chunks RGE ALTI** (`collision.ts getGroundHeight` -> chunks d'abord). Les deux sources different en hauteur -> la vegetation flotte (ou s'enfonce).

## Diff

- `apps/game-client/src/render/westVegetation.ts` :
  - charge aussi les heightfields de chunks (mirroir de `collision.ts` : `loadChunkHeightfields`, gate manifeste `IGN RGE ALTI D974` / `terrain-stream-manifest`).
  - nouvelle `groundHeight(terrain, chunks, x, z)` : echantillonne les chunks d'abord, sinon `reliefCollision` (fallback), sinon 0.
  - `instanceSpecFor` pose `position.y = groundHeight(...) + 0.02` au lieu de `sampleHeight(reliefCollision)`.
  - filtrage (`accept`, pente, eau, normale/tilt) inchange sur `reliefCollision` (coarse, suffisant). Seule la hauteur de pose passe sur les chunks.

## Pourquoi c'est sur

- Worst case (candidat hors chunks ou hauteur null) -> fallback `reliefCollision` = comportement d'avant (aucune regression).
- Best case (dans un chunk) -> la vegetation se pose exactement sur le relief visible = meme sol que le joueur.

## Tests

- `node --check --experimental-strip-types westVegetation.ts` : OK.
- `corepack pnpm --filter @riw/game-client typecheck` + `lint` : a relancer sous Windows.
- Visuel : recharger `localhost:5173`, verifier que les palmiers nord-ouest touchent le sol (et ailleurs).

## Risques

- Double fetch des heightfields de chunks (collision.ts + westVegetation) : ~16 petits JSON, caches navigateur/SW. Cout unique au load, acceptable.
- Le tilt (normale) reste sur `reliefCollision` : ecart mineur, non lie au bug de flottement.

## Suite

- Si d'autres props (rochers, buissons) flottent encore : meme cause, deja couverte par `groundHeight`.
- Factorisation possible : exporter le sampler de `collision.ts` au lieu de dupliquer (futur, evite le clobber maintenant).
