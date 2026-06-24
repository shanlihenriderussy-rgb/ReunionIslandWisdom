# 2026-06-24 17:29 — Fumerolles procédurales Piton de la Fournaise

> Lié à [[../09-direction-artistique]] [[../05-asset-pipeline]] [[../scheduled/daily-build-state]].
> Cycle build quotidien — phase DEV, chantier props-design.

## Contexte

Zone de départ = cratère Dolomieu (volcan actif). Props basalte/scories déjà posés
(`fournaise.ts`). Manquait un marqueur visuel du caractère **actif** du volcan.

## Décision asset

- Prop 100 % procédural, généré en code (`apps/game-client/src/render/fournaise.ts`).
- Aucun asset Kenney / externe. Rien à tracer côté CC0 (génératif maison).
- Palette cohérente : basalte sombre `#2c2826` pour l'évent, vapeur `#cfc9c4`.
- Style low-poly `flatShading`, conforme au reste de la zone.

## Contenu posé

- `makeFumarole(x, z, terrain, scale, seed)` : un petit évent cylindrique basalte +
  3 bouffées de vapeur (icosaèdres translucides, opacité décroissante 0.5 → 0.26).
- Placement : 5 fumerolles seedées (`FUMAROLE_SEED = 0x3b9a17`, `mulberry32`) sur un
  anneau intérieur du cratère (`FUMAROLE_RING = RIM_RADIUS * 0.72`), centre du cratère évité.
- Ancrage sol via `sampleHeight` (heightfield de collision), même espace monde que le joueur.

## Rôle gameplay

- Lisibilité : signale la zone volcanique active au joueur dès le spawn.
- Repère d'ambiance autour des marqueurs d'objectif existants.

## Budget / perf

- ~5 fumerolles × 4 meshes = ~20 meshes low-poly supplémentaires, sans texture.
- Matériaux translucides (transparent) : surveiller le tri alpha si densité augmente.
- Pas de collider ajouté (props non bloquants, cohérent avec le reste de la zone).

## Validation

- `corepack pnpm --filter @riw/game-client typecheck` : OK le 2026-06-25.
- `corepack pnpm --filter @riw/game-client lint` : OK le 2026-06-25.
- `corepack pnpm --filter @riw/game-client build` : bloque sur Vite `spawn EPERM` en sandbox Windows, après `tsc` OK.
- Revue statique : pas de `any`, pas de DOM, réutilise les helpers purs existants
  (`mulberry32`, `hash01`, `sampleHeight`). Conforme CLAUDE.md.
- Sécurité : visuel client pur, aucune logique serveur, aucun input, aucun secret.

## À vérifier en jeu (phase TEST suivante)

- `http://localhost:5173/` et `?mapDebug` : ancrage sol des fumerolles.
- Opacité correcte (vapeur lisible mais pas opaque).
- Pas de chevauchement gênant avec cairn / cône / sight marker.

## Note technique

- L'écriture du fichier a nécessité une réécriture complète : le mount Linux du sandbox
  renvoyait une vue tronquée/en retard du fichier. Le fichier Windows (autorité) est complet
  et correct (confirmé par lecture directe).
