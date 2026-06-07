# 2026-05-31 - Preview 3D depuis refs visuelles

## Objectif

Voir rapidement ce que les references `docs/Refs` peuvent donner en 3D dans le hub courant.

## Decision

- La preview procedurale `VisualRefsPreview` est rejetee.
- Raison : rendu trop cheap, pas assez proche d'une vraie direction 3D.
- Nouvelle base : assets GLB issus de banques CC0/CC.
- Interdit : bricoler des props 3D a la main dans le code runtime.

## Scope actuel

- Couche runtime : props `CC0_*` via `addCcAssetBankPreview`.
- Source locale : `packages/assets/vendor/kenney`.
- Licence lue : Kenney Platformer Kit / Survival Kit en Creative Commons Zero, CC0.
- Aucun PNJ.
- Aucune collision.
- Aucun asset definitif.
- Props temporaires uniquement pour juger echelle, camera, densite, silhouette.

## Traduction par zone actuelle

| Ref | Traduction 3D actuelle |
| --- | --- |
| B1 Saint-Paul / Saint-Gilles | Rochers, vegetation basse, arbre tall, sable existant |
| B2 Piton de la Fournaise | Rochers / pierres CC0 en attendant vrais assets volcaniques |
| B3 / B5 Mafate-Cilaos | Tente, panneau, clotures pour test d'echelle campement |
| B4 Salazie | Arbres tall, herbes, roches vertes |
| B6 Saint-Denis | Structures CC0 temporaires, non creoles |
| B7 Route du Littoral | Signal, roches, pierres pour test d'echelle |

## Banques CC a sourcer ensuite

| Besoin | Banque cible |
| --- | --- |
| Props generiques low poly | Kenney CC0 : https://kenney.nl/support |
| Rochers / falaises / vegetation tropicale | Poly Haven CC0 : https://polyhaven.com/license |
| Low-poly nature / batiments / personnages | Quaternius CC0 a verifier asset par asset |
| Batiments creoles | Asset custom ou kit CC compatible, a valider |
| Vierge / statue religieuse | Asset dedie CC0/CC-BY avec attribution tracee, sinon custom propre |
| Volcan / lave / scories | Asset bank volcanique CC0/CC-BY, pas de mesh procedural |

## Regle licence

- CC0 : OK direct, credit conseille mais non obligatoire.
- CC-BY : OK seulement si attribution tracee dans Obsidian + credits runtime/export.
- CC-BY-SA / NC / ND : eviter pour le jeu tant que le modele de diffusion n'est pas verrouille.
- Sketchfab / CGTrader / autres : verification asset par asset obligatoire.

## Regle de suite

Cette preview sert uniquement a tester des banques d'objets dans la map.
Elle ne doit pas devenir le level design final.

Ordre conseille :

1. Terrain IGN RGE ALTI D974 fiable.
2. Banque assets CC0/CC par biome.
3. Shortlist visuelle par zone.
4. GLB definitifs par zone.
5. Placement macro.
6. Collisions apres validation visuelle.
