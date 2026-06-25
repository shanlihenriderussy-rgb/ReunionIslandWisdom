---
type: playtest
date: 2026-06-25
build: local workspace, post-fix-ouest
result: no-go
tags:
  - playtest
  - audit-visuel
  - no-go
---

# Audit visuel global - 2026-06-25

## Setup

- Joueurs : 1
- Device : Windows desktop
- Navigateur : captures utilisateur Chrome / app window
- URL : zip local / serveur local
- Duree : audit statique + captures fournies

## Limite du test

- Le rendu live automatise est bloque dans l'environnement Codex Windows :
  - Vite local : ports bloques selon contexte (`EACCES`) ou job non persistant entre shells.
  - Playwright : package JS non disponible (`ENOTCACHED`).
  - Chrome headless / chrome-headless-shell : crashpad / platform channel en acces refuse.
- Audit base sur :
  - captures utilisateur du 2026-06-25 ;
  - inspection du code runtime ;
  - documentation projet (`CLAUDE.md`, design HUD, backlog).

## Verdict

- Resultat : no-go visuel.
- Cause principale : la scene affiche une zone ouest/Saint-Paul pendant que le HUD, les objectifs et une partie du contenu racontent encore la Fournaise.
- Le jeu fonctionne, mais la lecture produit est incoherente : le joueur ne sait plus ou il est, quel objectif suivre, ni quelle zone est la vraie zone de depart.

## Bugs et incoherences

| ID | Prio | Symptome | Evidence | Owner | Fix recommande |
| --- | --- | --- | --- | --- | --- |
| VIS-001 | P1 | Depart reel cote Ouest, objectif HUD Fournaise. | `GameApp.ts` demarre sur `WEST_BLOCKOUT_SPAWN` lignes 94-95 ; `hud.ts` affiche Dolomieu/Enclos/Piton lignes 215-223. | `GameApp.ts`, `hud.ts`, contenu zones | Choisir une seule zone de depart pour la build : Fournaise ou Ouest. Brancher spawn + objectif + labels ensemble. |
| VIS-002 | P1 | PNJ visibles alors que la doc dit qu'ils ne doivent pas etre spawnes. | `CLAUDE.md` ligne 128 ; `GameApp.ts` appelle `addNpcViews` ligne 100. | `GameApp.ts`, `render/npcs.ts` | Desactiver PNJ par defaut ou les placer derriere un flag debug/content-ready. |
| VIS-003 | P1 | Trop de couches monde chargees en meme temps : relief global, ouest, scenic ouest, vegetation, Fournaise, overlays biome. | `world.ts` lignes 50-59. | `render/world.ts` | Ajouter un `ZoneVisualMode` : active zone seulement, debug layers explicites. |
| VIS-004 | P1 | Risque d'overlap terrain monolithique / chunks streames, coutures et patches rectangulaires visibles. | `world.ts` charge `LaReunionReliefMap` async lignes 64-66 ; `ChunkStreamer.ts` retire le monolithe lignes 83-86 et 177/189. | `render/world.ts`, `ChunkStreamer.ts` | Ne plus charger le GLB monolithique quand le streamer IGN est actif. |
| VIS-005 | P1 | HUD trop lourd pour une vertical slice : jauges, hotbar, minimap, XP et inventaire mockes. | `hud.ts` level 25 ligne 108, HP/Mana 122/133, minimap 166-197, hotbar 234-274. `CLAUDE.md` interdit gauges/minimap/inventaire non portes par gameplay ligne 195. | `ui/hud.ts`, `styles.css` | Mode HUD minimal par defaut. Garder gauges/minimap/hotbar en debug ou quand gameplay branche. |
| VIS-006 | P1 | Objectif non raccorde au gameplay et a la zone active. | `hud.ts` objectifs Fournaise 215-223 ; progression via dialogues PNJ 947-951 ; `GameApp.ts` zone label dynamique 153-156. | `ui/hud.ts`, `game/GameApp.ts`, `packages/content` | Creer un provider d'objectif par zone, puis progression par position joueur. |
| VIS-007 | P2 | Label zone dynamique contredit l'objectif. | Screenshot : `Saint-Paul / Saint-Gilles` ou `Cirque de Mafate` avec objectif Dolomieu. Code : `hud.setZone(biome.label)` ligne 156. | `GameApp.ts`, `hud.ts` | Si zone != objectif actif, cacher l'objectif ou basculer l'objectif. |
| VIS-008 | P2 | Minimap decorative et trompeuse. | `hud.ts` cree une ile CSS statique lignes 166-197. | `ui/hud.ts`, `styles.css` | Cacher minimap tant qu'elle ne represente pas joueur/zone. |
| VIS-009 | P2 | Vegetation encore trop dense et silhouettes sombres sur les captures. | Captures utilisateur : masses noires autour chemin/plateformes. Fix shader deja partiel dans `gltf.ts` et `westVegetation.ts`. | `render/westVegetation.ts`, `render/gltf.ts` | Revalider en image. Ajouter budget densite par zone et couleur min par material. |
| VIS-010 | P2 | Chemin orange trop epais / trop brillant par endroits ; lecture "route posee" plus que sentier. | Captures utilisateur. | `render/westBlockout.ts` | Reduire saturation/brillance, ajouter variations et bords plus doux apres validation slope. |
| VIS-011 | P2 | Plateformes sable/beige coupees trop verticalement, effet blocs poses sur pente. | Captures utilisateur. | `render/westBlockout.ts` | Revoir epaisseur, bevel, ancrage par normales terrain, ou remplacer par zones peintes dans terrain. |
| VIS-012 | P2 | Prompt interaction et chat en position absolue fixe, risque collision hotbar/dialogue/mobile. | `hud.ts` bottom `240px` lignes 515-535 ; CSS a aussi plusieurs bottom fixes. | `ui/hud.ts`, `styles.css` | Integrer prompts dans layout HUD responsive, pas en pixels fixes. |
| VIS-013 | P2 | Vue carte/mobile possiblement trop loin du gameplay, avec focus ouest meme si depart Fournaise. | `GameApp.ts` map camera lerp vers `WEST_BLOCKOUT_SPAWN` lignes 188-190. | `GameApp.ts` | Focus map = zone active, pas constante ouest. |
| VIS-014 | P3 | Format code introduit par patch precedent : fonctions collees sans ligne vide dans fichiers west. | `westBlockout.ts`, `westVegetation.ts`. | render west | Nettoyer format au prochain patch visuel. |
| VIS-015 | P3 | Zip client contient encore l'ancien GLB monolithique lourd. Impact perf/temps de chargement. | Backlog ligne "Retirer le GLB monolithique 18 Mo". | pipeline terrain/package | Exclure GLB monolithique quand chunks officiels valides. |

## Lecture des captures

- Les corrections slope/shader ouest vont dans le bon sens, mais ne suffisent pas a rendre la scene coherente.
- Les gros problemes visibles ne sont pas seulement des shaders :
  - la direction de jeu active n'est pas unique ;
  - le HUD vend un autre lieu que le terrain ;
  - trop de couches prototype restent visibles ensemble ;
  - certains composants UI mockes ressemblent a des features finales.

## Decision

- Resultat : no-go pour une build de demo publique.
- Go interne possible seulement si la build est presentee comme debug/prototype.

## Actions prioritaires

- [ ] P1 - Verrouiller la zone de depart de la prochaine build : Fournaise ou Ouest.
- [ ] P1 - Aligner spawn, camera, objectif, label zone, map focus et PNJ sur cette zone.
- [ ] P1 - Mettre les couches monde non actives derriere un flag debug.
- [ ] P1 - Desactiver PNJ, minimap, jauges, hotbar XP si non raccordes au gameplay.
- [ ] P1 - Supprimer la course GLB monolithique / chunks.
- [ ] P2 - Revalider par captures desktop + mobile apres correction.
