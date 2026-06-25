# 2026-06-25 — Fix visuel ouest : devers, ancrage, fondu shader

## Contexte

Screenshots PWA jouable : zone Saint-Paul / Saint-Gilles.
Bugs visibles :

- ruban du sentier trop horizontal par endroits, pas assez adapte au denivele/devers ;
- props/rochers/vegetation poses en hauteur mais pas inclines selon le sol ;
- vegetaux trop noirs / faces trop dures ;
- terrain streamé avec coutures shader et fondu trop brutal.

## Diff

Fichiers :

- `apps/game-client/src/render/westBlockout.ts`
  - le ruban du sentier echantillonne maintenant la hauteur terrain par vertex, y compris sur les bords ;
  - ajout de bords verts/bruns pour fondre le sentier dans le sol ;
  - quest markers et boundary rocks inclines via normale locale limitee.
- `apps/game-client/src/render/westVegetation.ts`
  - props ouest inclines selon la normale terrain ;
  - inclinaison limitee selon type : rocher/sol > buisson > arbre.
- `apps/game-client/src/render/gltf.ts`
  - option `materialMode: "westVegetation"` ;
  - vegetation GLB en `DoubleSide`, noirs releves en vert sombre, leger emissive pour eviter les masses noires.
- `apps/game-client/src/game/ChunkStreamer.ts`
  - terrain chunks moins facette shader : flatShading false + leger emissive vert.

## Tests

- `corepack pnpm --filter @riw/game-client typecheck` : OK.
- `corepack pnpm --filter @riw/game-client lint` : OK.
- `corepack pnpm --filter @riw/game-client build` : bloque dans sandbox Codex sur Vite `spawn EPERM` (meme limite deja constatee). A relancer hors sandbox.

## Securite

- Visuel client pur.
- Aucun secret.
- Aucun appel reseau externe.
- Pas de logique serveur deplacee cote client.

## A verifier visuellement

- Sentier ouest : plus de decollement net sur les devers.
- Rochers/plantes : base mieux alignee au sol.
- Vegetation : moins de masses noires.
- Terrain chunks : coutures shader moins visibles.