# 2026-06-07 — Props procéduraux zone de départ Piton de la Fournaise

> Lié à [[../12-phase-1-level-design]] [[../04-decisions]] (ADR-008) [[../05-asset-pipeline]] [[../09-direction-artistique]].

## Contexte

Zone de départ basculée sur le volcan (ADR-008). Le cratère était lu sur le terrain RGE ALTI brut, sans habillage. Demande : ajouter des props.

## Décision asset

- **Props 100 % procéduraux**, générés en code (`apps/game-client/src/render/fournaise.ts`). Aucun asset Kenney / externe réintroduit (respect liste interdite CLAUDE.md + DA).
- Palette volcan : basalte sombre `#2c2826` / `#403a36`, scorie rouge `#6e3b2f`, encre marqueur `#d8c8b0`.
- Style low-poly, `flatShading`, cohérent avec le reste.
- Licence : génératif maison, pas de source externe → rien à tracer côté CC0.

## Contenu posé

Ancré sur le sommet vérifié (world `65.9, -37`), ancrage hauteur sur le heightfield de collision :

- Anneau de 18 rochers de basalte autour du rebord du cratère (rayon ~7.2, jitter seedé).
- 26 scories dispersées (RNG déterministe `mulberry32`, seed `0xf0c12a`), centre du cratère évité.
- 3 repères d'objectif liés au HUD :
  - cairn « Rebord Dolomieu » (obj 1, = spawn) ;
  - marqueur cône central + anneau de scorie (obj 2) ;
  - poteau + flèche orientée nord-ouest vers le Piton des Neiges (obj 3).

## Budget / perf

- Géométries primitives low-poly (icosaèdre/dodécaèdre niveau 0, cône 7 segments, tore 16). ~46 meshes.
- Pas de texture, matériaux standard partagés par type.
- À surveiller : draw calls (pas d'instancing pour l'instant) → candidat instancing si besoin perf mobile.

## Câblage

- `render/world.ts` → `configureWorld` appelle `addFournaiseBlockout(scene)` après la végétation ouest.
- Pas de colliders ajoutés (props non bloquants) pour ne pas piéger le joueur sur la zone de départ.

## Suite

- Vérifier rendu et ancrage sol en jeu (`http://localhost:5173/`) + `?mapDebug`.
- Si validé : instancing rochers, puis signal fumerolle (décision DA), puis vrais assets de quête.
- Auto-progression objectif sur proximité des 3 repères (backlog).
