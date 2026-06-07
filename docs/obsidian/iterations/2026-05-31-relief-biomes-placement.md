# 2026-05-31 17:38 - Relief et emplacements biomes

## Source analysee

- Image prioritaire : `docs/Refs/Relief Réunion.png`.
- Moodboards zones : `docs/Refs/Moodboards par zone/`.
- Palette : `docs/Refs/Style asset boards/Palette de couleurs par zone/`.

## Lecture relief

- Nord : Saint-Denis en zone basse littorale.
- Nord-ouest : Route du Littoral entre Le Port et Saint-Denis, avec relief proche de la mer.
- Ouest : Saint-Paul / Saint-Gilles-les-Bains sur cote basse, lagon, plage.
- Centre / nord-ouest interieur : Piton des Neiges et Cirque de Mafate.
- Nord-est interieur : Cirque de Salazie, humide, ravines, cascades.
- Sud interieur : Cirque de Cilaos, relief ferme autour du massif central.
- Est interieur : Plaine des Palmistes comme couloir vegetal entre les deux massifs.
- Sud-est : Piton de la Fournaise / Enclos Fouque / Champ de lave.
- Sud / sud-est : Sud Sauvage humide vers Saint-Joseph / Saint-Philippe.

## Coordonnees runtime

| Biome | Centre X/Z | Rayon | Reference |
| --- | ---: | ---: | --- |
| Saint-Paul / Saint-Gilles | `-64, -6` | `21` | B1 |
| Route du Littoral | `-36, 43` | `15` | B7 |
| Saint-Denis | `3, 54` | `14` | B6 |
| Piton des Neiges | `0, 1` | `15` | B0/B3/B5 |
| Mafate | `-22, 16` | `17` | B3 |
| Salazie | `16, 25` | `17` | B4 |
| Cilaos | `-13, -16` | `17` | B5 |
| Plaine des Palmistes | `28, 4` | `15` | B0/B4 |
| Piton de la Fournaise | `38, -32` | `24` | B2 |
| Sud Sauvage | `8, -50` | `18` | B0 |

## Integration code

- Biomes declares dans `apps/game-client/src/world/biomes.ts`.
- HUD zone dynamique via position joueur.
- Vue `?mapDebug` affiche des zones colorees translucides pour valider les emplacements.
- Props CC0 repositionnes sur ces zones, sans pretendre etre le level design final.

## Limite

Le relief visuel reste une base provisoire tant que le pipeline IGN RGE ALTI D974 n'a pas les fichiers sources locaux. Les emplacements biomes sont cales sur l'image relief, pas sur un heightfield IGN final.
