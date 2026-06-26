# 2026-06-26 - Coherence references / jeu

## But

Renforcer la coherence graphique entre les boards de reference et la build jouable.

## Points traites

- P1 - Zone active unique par defaut : la build demarre cote Ouest, donc les props Fournaise passent derriere `?visualZone=fournaise` ou `?visualZone=all`.
- P1 - Le rendu Ouest reste la reference par defaut : blockout, scenic, lagon, vegetation, HUD public.
- P2 - Sentier Ouest moins "route posee" : largeur reduite, couleurs moins saturees, bords irreguliers.
- P2 - Cadrage exploration remonte : camera plus haute, lecture lagon/relief meilleure.
- P2 - Cadrage mobile separe : portrait plus proche du personnage, HUD objectif/statut resserre.
- P2 - Canopée Ouest moins envahissante au bord du sentier : hauteur reduite, clearance augmentee.
- P1 - Collision alignee sur les heightfields chunks RGE ALTI : le spawn Ouest passe de `-0.42` global a `5.682` reel chunk 8.
- P1 - Spawn replace sur Tatie Snack (`-78.5, 7.5`) : hauteur chunk stable `1.16`, pas la bosse `5.68` a cote.
- P1 - Runtime rebascule sur spawn/camera/objectif Ouest : plus d'auto-progression Fournaise dans la build Ouest.

## Flags utiles

- `?visualZone=west` : implicite, build publique Ouest.
- `?visualZone=fournaise` : test visuel volcan seul.
- `?visualZone=all` : debug, toutes les couches prototype visibles.
- `?hudMock` : HUD mock complet pour captures design, masque par defaut.
