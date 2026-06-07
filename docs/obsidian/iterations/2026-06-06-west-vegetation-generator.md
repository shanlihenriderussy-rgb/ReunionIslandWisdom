# 2026-06-06 - Generateur vegetation ouest + fixes PNJ/collisions

## Contexte
Retours playtest zone Saint-Paul / Saint-Gilles : PNJ en T-pose, PNJ trop grands,
props places sans logique, contours pixellises, collisions trop larges.

## Corrige
- **Echelle PNJ** : `render/npcs.ts` targetHeight 1.7 -> 0.72 (= avatar joueur).
- **Idle PNJ** : `updateNpcIdle()` (clip GLB "idle" si present, sinon respiration procedurale),
  appele dans la boucle `GameApp`. Fin de la T-pose figee.
- **Props "aleatoires"** : ancien semis `worldObjects` + semis cure `westScenic` RETIRES.
  Remplaces par un generateur seede deterministe.

## Nouveau systeme de vegetation (decisions Shan)
- `world/westVegetation.ts` : generateur SEEDE (mulberry32, seed 97431), data pure.
  Pose le long du chemin blockout (centerline), 2 cotes, especes selon eloignement
  (sous-bois pres, canopee loin), + barrieres naturelles sur les boundary markers.
- `render/westVegetation.ts` : ancrage AUTO sur heightfield, filtres eau (< -0.2),
  pente (> 0.85 rejetee), corridor chemin (pathClearance), colliders SERRES sur la
  base reelle (tronc palmier 0.28, herbe 0.14, rocher 0.75, falaise 1.05-1.4).
- Densite "luxuriante" : ~0.9 sample/unite x 2 cotes x 1-2 clusters.
- Colliders remontes a `WorldCollision.addColliders()` une fois poses (callback ColliderSink).

## Collisions
- `collision.ts` : retire WORLD_OBJECT_COLLIDERS + WEST_SCENIC_COLLIDERS.
  Garde WEST_BLOCKOUT (limites) + colliders vegetation injectes au runtime.
- Rayons serres = fini les blocages dans le vide autour des troncs.

## Update 2026-06-07 - Vegetation mi-hauteur Maido

- `world/westVegetation.ts` ajoute un etagement :
  - cote ouest basse : palmiers, buissons tropicaux, herbes, rochers sable ;
  - mi-hauteur Maido : buissons de hauts, herbes, arbres sobres, rochers non sable ;
  - rempart Maido / Mafate : vegetation plus basse et ouverte pour garder le point de vue lisible.
- Seuils runtime :
  - `maidoMid` : `x >= -56` et `z >= -24` ;
  - `maidoRim` : `x >= -46` et `z >= -5`.
- Controle generation seedee :
  - cote : 216 candidats ;
  - mi-hauteur : 47 candidats, surtout `uplandBush`, `uplandGround`, `uplandRock` ;
  - rempart : 20 candidats, sans grands palmiers.

## Reste / a valider en reload
- Contours pixellises de la map : non traite ici (lie a la silhouette OSM basse-res, a part).
- verticalExaggeration / ZoneManager : en attente.
- Tuning densite/seed apres rendu reel.

## Decision placement (repondu par Shan)
- Repartir de zero / ancrage auto-sol / colliders serres / densite luxuriante /
  barrieres naturelles visibles / generation par seed.

---

# 2026-06-06 - Refonte HUD : inventaire en modale + UX copy

## Probleme
HUD du bas empilait dialogue + inventaire + menu + quete + info en PERMANENCE -> mur d'UI illisible.
Inventaire non separe du menu pause.

## Corrige (apps/game-client/src/ui/hud.ts + styles.css)
- `bottomGrid` ne garde que le cartouche dialogue (masque hors dialogue) + notifications.
- Nouvelle MODALE centree (`hud-modal-overlay` / `hud-modal-shell`) : inventaire (+ detail objet)
  et journal de quetes, un seul ecran a la fois, fond clic-pour-fermer.
- Systeme `showModal/closeModals/toggleModal` independant de la pause.
- Touches : I = sac, J = quetes, M = carte, Entree = chat, Echap = ferme (modale > dialogue > pause).
- Panneau "Menu" vertical retire (redondant avec la barre d'icones haut-centre).
- Inventaire : titre dynamique `Sac a dos · N / 40`, bouton fermer.
- Dialogue masque par defaut, affiche seulement quand un PNJ parle ; reset centralise `resetDialogue()`.

## UX copy (/design:ux-copy)
- Libelles -> verbes/actions : "Sac a dos", "Journal de quetes", "Ouvrir la carte", "Reglages", "Quitter la partie".
- "Cadre de Dialogue" -> "Conversation" ; "Fenetre Info" -> "Details de l'objet".
- Notif d'accueil rappelle les raccourcis ; "non disponible" -> "arrive bientot".
- Pause liste les nouvelles touches (I/J/M).

## A valider chez Shan (sandbox desynchronise, tsc non fiable ici)
- `corepack pnpm --filter @riw/game-client typecheck && lint && build`.
- Reload : I ouvre/ferme le sac, J le journal, Echap ferme dans le bon ordre, bas d'ecran degage.
