---
type: iteration
date: 2026-05-31
scope: clean-level-base
tags:
  - iteration
  - level-design
  - assets
  - terrain
---

# Base propre assets + level design

## Decision

- Retirer les props de placeholder de la map.
- Retirer aussi les personnages de la map.
- Garder le terrain Reunion comme base principale.
- Garder `packages/assets/sources/lareunion/LaReunion.stl` seulement comme placeholder temporaire.
- Basculer le relief final vers IGN RGE ALTI D974.
- Ajouter uniquement :
  - la Vierge placeholder ;
  - des plages sable placeholder sur l'ouest / sud-ouest ;
  - les PNJ existants pour continuer a tester le dialogue.

## Changements faits

- Supprime du rendu :
  - route ;
  - Car Jaune placeholder ;
  - barrieres ;
  - signpost ;
  - arbres ;
  - rochers ;
  - tente ;
  - caisses ;
  - baril ;
  - feu ;
  - coffre.
- Supprime les colliders de ces anciens props.
- Supprime le rendu des PNJ, du joueur local et des joueurs distants.
- Garde un pivot invisible pour camera/deplacement de debug.
- Ajoute `ViergePlaceholder` en mesh procedural.
- Ajoute deux bandes sable procedurales :
  - `SaintPaulBeachPlaceholder` ;
  - `SaintGillesBeachPlaceholder`.
- Regenerer le relief :
  - source STL : `packages/assets/sources/lareunion/LaReunion.stl` ;
  - `gridX: 160` ;
  - `gridZ: 144` ;
  - `verticalExaggeration: 1` ;
  - flatten spawn reduit : rayon `5`, blend `7`.
- Desactive le cast shadow du terrain pour retirer l'artefact carre au spawn.

## Captures

- Vue joueur : ![[2026-05-31-clean-level-base-assets/clean-player-view.png]]
- Vue debug map : ![[2026-05-31-clean-level-base-assets/clean-mapdebug.png]]
- Vue sans personnage : ![[2026-05-31-clean-level-base-assets/clean-player-view-no-character.png]]
- Map sans personnage : ![[2026-05-31-clean-level-base-assets/clean-mapdebug-no-characters.png]]
- Zoom lateral : ![[2026-05-31-clean-level-base-assets/mapdebug-zoom-control.png]]

## Regles level design a partir de maintenant

- Aucun prop placeholder permanent sans role de niveau ou de quete.
- Chaque asset doit etre rattache a :
  - zone ;
  - quete ;
  - gameplay ;
  - budget perf ;
  - owner artistique.
- Les plages sont des repères de biome, pas encore des assets finals.
- La Vierge est un landmark temporaire. Remplacer par GLB dedie plus tard.
- Les PNJ restent des personnages de test tant que les roles/tenues ne sont pas designes.

## Zones a designer ensuite

| Zone | Intention | Assets a definir |
| --- | --- | --- |
| Saint-Denis Hub | social, onboarding | architecture creole, mobilier urbain, signaletique |
| Saint-Paul / Saint-Gilles | cote, sable, lagon | plage, filaos, kiosques, rochers basaltiques |
| Route du Littoral | event bouchon | route, cones, voitures stylisees, Car Jaune final |
| Volcan / Plaine des Sables | exploration dramatique | basalte, scories, fumee, panneaux sentier |

## Actions suivantes

- [ ] Replacer les PNJ par zone au lieu du cluster central.
- [ ] Remettre les personnages seulement apres terrain fiable.
- [ ] Definir la liste d'assets par quete.
- [ ] Designer le GLB final de la Vierge.
- [ ] Remplacer les plages procedurales par meshes propres colles au littoral.
- [ ] Ajouter une carte de biomes : cote ouest, volcan, nord urbain, ravines.
- [ ] Revoir l'objectif HUD actuel qui pointe encore vers Chauffeur Car Jaune.
- [x] Ajouter scroller lateral pour zoom/dezoom camera.
