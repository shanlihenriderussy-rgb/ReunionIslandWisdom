# References visuelles

Source locale :

```txt
docs/Refs
```

Regle :

- Lire ces references avant toute decision de direction artistique, biome, asset ou level design.
- Ne pas copier tel quel.
- Extraire palette, silhouette, densite, matiere, lisibilite.
- Tout asset final doit rester coherent avec la zone cible.

## Moodboards par zone

| Zone | Fichier | Usage |
| --- | --- | --- |
| Global | [B0. Global](<../Refs/Moodboards par zone/B0. Global/B0. Global.png>) | Ton general, coherence monde |
| Saint-Paul / Saint-Gilles | [B1. Saint-Paul Saint-Gilles](<../Refs/Moodboards par zone/B1. Saint-Paul  Saint-Gilles — littoral ouest (zone de départ)/B1. Saint-Paul  Saint-Gilles — littoral ouest (zone de départ).png>) | Zone de depart, littoral ouest, sable, lagon |
| Piton de la Fournaise | [B2. Piton de la Fournaise](<../Refs/Moodboards par zone/B2. Piton de la Fournaise — volcan actif/B2. Piton de la Fournaise — volcan actif.png>) | Volcan, scories, basalte, lumiere dramatique |
| Mafate | [B3. Cirque de Mafate](<../Refs/Moodboards par zone/B3. Cirque de Mafate — montagne isolée/B3. Cirque de Mafate — montagne isolée.png>) | Montagne isolee, sentiers, ravines |
| Salazie | [B4. Cirque de Salazie](<../Refs/Moodboards par zone/B4. Cirque de Salazie — eau & cascades/B4. Cirque de Salazie — eau & cascades.png>) | Eau, cascades, vegetation humide |
| Cilaos | [B5. Cirque de Cilaos](<../Refs/Moodboards par zone/B5. Cirque de Cilaos — thermes & montagne/B5. Cirque de Cilaos — thermes & montagne.png>) | Thermes, relief montagneux, village |
| Saint-Denis | [B6. Saint-Denis](<../Refs/Moodboards par zone/B6. Saint-Denis — hub urbain créole/B6. Saint-Denis — hub urbain créole.png>) | Hub urbain creole |
| Route du Littoral | [B7. Route du Littoral](<../Refs/Moodboards par zone/B7. Route du Littoral — axe côtier/B7. Route du Littoral — axe côtier.png>) | Axe cotier, route, ocean, tension visuelle |

## Style asset boards

| Board | Fichier | Usage |
| --- | --- | --- |
| Palette de couleurs par zone | [Palette de couleurs par zone](<../Refs/Style asset boards/Palette de couleurs par zone/Palette de couleurs par zone.png>) | Palette source pour biomes, lighting, materials |

## Design system HUD

| Source | Fichier | Usage |
| --- | --- | --- |
| HUD Design System | [tokens](<../../design-system/hud/tokens.css>) / [components](<../../design-system/hud/components.css>) | Tokens UI, surfaces HUD, boutons, dialogues, status, zoom, chat |

## Relief source

| Source | Fichier | Usage |
| --- | --- | --- |
| Relief Reunion | [Relief Reunion](<../Refs/Relief Réunion.png>) | Placement des biomes : littoral ouest bas, massif central/Piton des Neiges, cirques Mafate-Salazie-Cilaos, Fournaise sud-est |

## Dimensions

| Fichier | Dimensions | Poids |
| --- | ---: | ---: |
| B0 Global | 1672 x 941 | 2229 KB |
| B1 Saint-Paul / Saint-Gilles | 1672 x 941 | 2106 KB |
| B2 Piton de la Fournaise | 1672 x 941 | 1975 KB |
| B3 Mafate | 1672 x 941 | 1780 KB |
| B4 Salazie | 1672 x 941 | 2242 KB |
| B5 Cilaos | 1672 x 941 | 2172 KB |
| B6 Saint-Denis | 1672 x 941 | 2401 KB |
| B7 Route du Littoral | 1672 x 941 | 2289 KB |
| Palette couleurs | 1254 x 1254 | 991 KB |

## Integration projet

- Terrain fiable d'abord : [[iterations/2026-05-31-relief-source-audit]].
- Preview 3D runtime : [[iterations/2026-05-31-refs-3d-preview]].
- PJ + kits Kenney : [[iterations/2026-05-31-pj-assets-vue-jouable]].
- Relief + biomes : [[iterations/2026-05-31-relief-biomes-placement]].
- HUD : [[23-design-system-hud]].
- Level design ensuite : zones, chemins, contraintes camera.
- Assets apres : un asset = une zone + une quete + un role gameplay.

## Checklist avant ajout visuel

- [ ] La zone cible est identifiee.
- [ ] La reference `docs/Refs` correspondante a ete consultee.
- [ ] La palette ne contredit pas `09-direction-artistique`.
- [ ] L'asset n'est pas decoratif gratuit.
- [ ] La source/licence est tracee.
- [ ] Obsidian est mis a jour si decision ou scope.
