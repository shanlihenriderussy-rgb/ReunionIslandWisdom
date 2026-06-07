# 2026-05-31 - PJ, kits Kenney et vues jouable/carte

## Imports

Sources ajoutees au projet :

- `packages/assets/sources/kenney/kenney_pirate-kit.zip`
- `packages/assets/sources/kenney/kenney_nature-kit.zip`

Assets vendores :

- `packages/assets/vendor/kenney/pirate-kit`
- `packages/assets/vendor/kenney/nature-kit`

Assets exposes client :

- `apps/game-client/public/assets/vendor/kenney/pirate-kit`
- `apps/game-client/public/assets/vendor/kenney/nature-kit`

## Licences

- Pirate Kit : Kenney, Creative Commons Zero, CC0.
- Nature Kit : Kenney, Creative Commons Zero, CC0.
- Credit conseille : Kenney / www.kenney.nl.

## Runtime

- Vue jouable restauree : camera follow sur le joueur.
- Vue carte conservee : bouton `Carte` / `Jouer`, raccourci `M`.
- Si l'URL contient `?mapDebug`, la vue demarre en carte.
- En vue carte, le controle du personnage est bloque.
- Joueur local visible.
- Joueurs distants visibles si le serveur renvoie plusieurs sessions.
- PNJ toujours absents.

## Echelle

Regle actuelle :

- Carte : environ 150 unites de large.
- PJ : `0.72` unite de haut.
- Collision PJ : rayon `0.22`.

But : le personnage doit rester minuscule compare a l'ile.

## Assets utilises maintenant

| Zone | Kit |
| --- | --- |
| Saint-Paul / Saint-Gilles | Pirate Kit : palmiers, ponton, barque, rochers sable |
| Salazie | Nature Kit : cascade, palmier, buissons, herbes |
| Fournaise | Nature Kit : falaises/rochers, placeholders |
| Littoral | Pirate Kit + Platformer Kit : epave, roches, signal |
| Joueur | Mini Characters : personnage GLB scale bas |

## Correctifs visuels

- Textures externes Kenney `Textures/colormap.png` copiees dans le dossier public.
- Sable genere depuis l'outline vectoriel `lareunion-relief-collision.json`.
- Anciens rubans de sable manuels retires.
- Materiaux jaunes de debug du terrain masques si presents.

## Collisions

- Les props CC0 partagent une definition unique `WORLD_OBJECT_PROPS`.
- Les collisions circulaires sont derivees de `WORLD_OBJECT_COLLIDERS`.
- Collision actuelle : approximation gameplay, pas encore collider GLB precis.

## Suite

- Remplacer les placeholders Fournaise par vrais assets volcaniques CC0/CC-BY.
- Choisir un avatar PJ definitif.
- Valider lisibilite desktop + mobile apres terrain IGN.
