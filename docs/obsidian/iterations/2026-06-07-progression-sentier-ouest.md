# 2026-06-07 — Progression le long du sentier ouest (helpers level-design)

Phase du cycle : **DEV**
Chantier : **level-design**
Run automatique : `riw-build-quotidien` (22:00 heure Reunion).

## Contexte

Premier run du build quotidien incremental. Le sentier ouest (Saint-Paul /
Saint-Gilles) existe deja comme blockout (`WEST_BLOCKOUT_PATH`) mais aucune
fonction ne sait dire ou se trouve le joueur le long de ce sentier. C'est la
brique manquante pour la future boucle d'exploration et l'affichage "lieu actuel".

## Diff

Fichier : `apps/game-client/src/world/westBlockout.ts` (ajout pur, aucun retrait).

- `WEST_BLOCKOUT_PATH_LENGTH` : longueur totale du sentier (114.56 unites monde apres reroute Maido / Mafate).
- type `PathProgress` : segmentIndex, t, distanceAlong, normalized (0..1), lateral, label.
- `getNearestPathProgress(x, z)` : projette une position sur le sentier
  (projection point-segment), renvoie la progression normalisee et la distance
  laterale au sentier.

Aucun import externe, aucun DOM, aucune logique gameplay. Conforme CLAUDE.md
(rien dans `world.ts`, pas de `any`, pas de placeholder reintroduit).

## Tests

- Typecheck strict du fichier : OK.
- Sanity runtime :
  - longueur = 114.56 ;
  - depart -> normalized 0.000 ;
  - point de vue Maido / Mafate -> normalized 1.000 ;
  - point "Snack / marche" -> normalized 0.236 (segment 2) ;
  - sortie sud Saint-Gilles -> normalized 0.542 ;
  - position hors sentier -> lateral 22.47, normalized borne dans [0,1].
- Limite : le sandbox Linux ne peut pas executer le `pnpm build` complet
  (binaires node installes sous Windows). A relancer cote Windows :
  `corepack pnpm --filter @riw/game-client typecheck` puis `lint` et `build`.

## Risques

- Faible. Code mort tant que non appele (aucun consommateur encore).
- `label` renvoie le point de depart du segment le plus proche : voulu, a garder
  en tete au moment du wiring HUD.

## Suite

- Phase TEST (prochain run) : revalider typecheck/lint/build cote Windows et
  preparer le branchement HUD "lieu actuel" via `getNearestPathProgress`.
- Chantier suivant apres le cycle : props-design.
