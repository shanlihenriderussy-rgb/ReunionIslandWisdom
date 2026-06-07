# 18 — Prochaines étapes (actionnable)

> Lié à [[10-build-plan]] [[11-phase-0-terrain]] [[01-roadmap]] [[02-backlog]].
> MAJ : 2026-05-31. Vue courte = quoi faire maintenant.

## Maintenant (sprint terrain)

1. **Récupérer RGE ALTI D974** dans `packages/assets/sources/lareunion/rgealti/` (ne pas committer le brut lourd).
2. **Ingestion `.asc`** via `corepack pnpm terrain:dem` → vérifier bornes, no-data, échelle Z.
3. **Acter dépendance `geotiff`** si `.tif` nécessaire → [[04-decisions]].
4. **Générer terrain** (GLB + heightfield + collision + manifest).
5. **Valider en `?mapDebug`** contre la checklist [[11-phase-0-terrain]] (Pitons, cirques, ravines, littoral ouest).
6. **Note iteration** dans `docs/obsidian/iterations/`.

## Critère pour débloquer la suite

Terrain validé visuellement + heightfield aligné = feu vert Phase 1.

## Ensuite (ordre strict)

1. Phase 1 — découpage zones + blockout départ ([[12-phase-1-level-design]]).
2. Phase 2 — boucle gameplay 1 joueur serveur-validé ([[13-phase-2-gameplay]]).
3. Phase 3 — contenu zone de départ ([[14-phase-3-contenu]]).
4. Phase 4 — multijoueur ([[15-phase-4-multijoueur]]).
5. Phases 5–6 — polish + prod ([[16-phase-5-6-prod]]).
6. Phase 7 — live ops ([[17-phase-7-liveops]]).

## Dettes / décisions en attente

- [ ] Dépendance `geotiff` (oui/non).
- [ ] Hébergement serveur Colyseus (Railway / Fly / VPS).
- [ ] Store de persistance joueurs.
- [ ] Moment de réintroduction avatar joueur + PNJ (décision explicite Shan).
- [ ] Facteur d'exagération Z terrain (à documenter).

## Garde-fous permanents

- Pas de réintroduction des anciens placeholders (Car Jaune, route, fences, arbres/rochers Kenney, tente, caisses, barils, feu, coffre, PNJ/avatar) sauf demande explicite.
- Pas de React/Next/moteur de jeu. Stack figée.
- Validation serveur + sécurité à chaque diff.
- MAJ Obsidian à chaque décision/scope/bug/playtest/pipeline.
