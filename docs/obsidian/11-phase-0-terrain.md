# 11 — Phase 0 : Fondations terrain

> Lié à [[10-build-plan]] [[01-roadmap]] [[04-decisions]].
> Note streamer : [[iterations/2026-05-31-terrain-streamer-prereq]].
> Statut : SOURCE IGN GENEREE + STREAMER BRANCHE + SCALE 220 + MESH 320x288 + COULEURS TERRAIN BAKEES. Reglage relief fin encore a faire.

## Objectif

Terrain fiable issu de **IGN RGE ALTI D974**, validé visuellement en `?mapDebug`.
Le STL (`LaReunion.stl`) est un fallback non fiable. Interdit comme source finale.

## Pipeline cible

```txt
Source : packages/assets/sources/lareunion/rgealti/   (.asc OK, .tif/.tiff OK via geotiff)
Script : tools/build-lareunion-dem-terrain.mjs
Cmd    : corepack pnpm terrain:dem
```

Sorties :

```txt
apps/game-client/public/assets/terrain/lareunion/lareunion-relief-map.glb
apps/game-client/public/assets/terrain/lareunion/lareunion-relief-collision.json
apps/game-client/public/assets/terrain/lareunion/lareunion-heightfield.json
apps/game-client/public/assets/terrain/lareunion/relief-map-manifest.json
apps/game-client/public/assets/terrain/lareunion/chunks/manifest.json
apps/game-client/public/assets/terrain/lareunion/chunks/lareunion-terrain-*.glb
apps/game-client/public/assets/terrain/lareunion/chunks/lareunion-terrain-*.json
```

## Statut technique actuel

- Dataset RGE ALTI present : **128 tuiles** `RGEALTI 2-0 5M ASC RGR92UTM40S-REUN89 D974 2023-09-05`
  (~940 Mo decompresse), dans `packages/assets/sources/lareunion/rgealti/`.
- Header verifie : tuiles 1000x1000, cellsize 5 m, projection RGR92 UTM40S, NODATA -99999.
- Support GeoTIFF acte le 2026-06-27 : dependance build-time `geotiff`, lecture bbox/nodata/resolution.
- Projection/recentrage acte le 2026-06-27 : manifest = RGR92 / UTM zone 40S (EPSG:2975), centre UTM + `metersToWorldScale`.
- Contrat LOD acte le 2026-06-27 : manifests compatibles `lodLevels`, niveau 0 full genere, niveau 1 mobile-low a produire.
- Generation `corepack pnpm terrain:dem` terminee le 2026-06-05.
- `chunks/manifest.json` porte bien `source: IGN RGE ALTI D974`.
- `relief-map-manifest.json` porte bien `source: IGN RGE ALTI D974`.
- Terrain genere en **16 chunks** (`4 x 4`) + heightfield par chunk.
- Altitudes source detectees : min `-231.03 m`, max `3002.21 m`.
- GLB principal : `4 666 152` octets apres passage mesh `320 x 288` + couleurs vertex.
- ChunkStreamer runtime branche dans `apps/game-client/src/game/ChunkStreamer.ts`.
- Validation code client le 2026-06-05 : `typecheck`, `lint`, `build` OK.
- Validation visuelle carte le 2026-06-05 : capture `output/playwright/mapdebug-terrain320.png`.
- Materiau terrain : vertex colors bakees dans les GLB, lues par `ChunkStreamer`.
- Normales chunks : reprises depuis le mesh global pour limiter les hachures/coutures entre blocs.
- Couche sable : fusionnee au terrain dans le generateur DEM, plus de ruban vectoriel runtime.
- Couleurs 2026-06-05 21:37 : altitude + secteurs + pente. Les falaises/cretes ressortent mieux sans ajouter de geometrie runtime.

Commande utilisee :

```txt
corepack pnpm terrain:dem -- --targetLongestSide 220 --gridX 320 --gridZ 288 --chunkCountX 4 --chunkCountZ 4 --verticalExaggeration 1.15
```

Perf a corriger : le parsing ASCII via readline+regex est trop lent. Optimiser
(lecture buffer/split direct) si la regeneration doit etre frequente.

Reste a faire :

- [x] Confirmer fin de generation (`chunks/manifest.json` -> `source: IGN RGE ALTI D974`).
- [x] Valider visuellement en `?mapDebug` (Pitons, cirques, ravines, littoral ouest). Capture Playwright OK le 2026-06-05.
- [ ] Ajuster `verticalExaggeration` si relief trop plat/trop raide.
- [x] Generer des couleurs/materials par biome dans le pipeline DEM, sans coutures fortes entre chunks.
- [x] Augmenter la resolution mesh de `220 x 198` a `320 x 288`.
- [x] Brancher le ChunkStreamer runtime sur `chunks/manifest.json` (gate `source === IGN RGE ALTI D974`).

## Tâches

- [x] Récupérer dataset RGE ALTI D974 (résolution 5 m visée, 25 m acceptable au départ).
- [x] Ingestion `.asc` → vérifier bornes géo, no-data, échelle Z.
- [x] Ajouter support `.tif/.tiff` (dépendance `geotiff`) — décision package actée dans [[04-decisions]] ADR-017.
- [x] Normaliser projection (UTM 40S / RGR92) et recentrage monde dans les manifests générés.
- [x] Préparer génération GLB + heightfield + collision + manifest.
- [x] Préparer génération chunks GLB + heightfield par chunk pour streamer.
- [x] Générer réellement les sorties depuis RGE ALTI D974.
- [x] Régler premiere échelle horizontale jouable (`targetLongestSide 220`).
- [ ] Régler exagération verticale fine apres playtest marche/camera.
- [ ] LOD terrain (chunks) pour perf mobile. Contrat manifest prêt ; génération niveau 1 à faire.

## Critères de sortie (validation obligatoire)

- [x] Piton des Neiges visible.
- [x] Piton de la Fournaise visible.
- [x] Cirques Mafate / Cilaos / Salazie lisibles en lecture globale du relief.
- [x] Ravines lisibles.
- [x] Littoral ouest Saint-Paul / Saint-Gilles cohérent.
- [x] Props terrestres alignes a l'île apres scale 220 : 0 prop terrestre hors contour collision.
- [ ] Heightfield aligné au mesh en test de marche longue (collision = visuel).
- [x] Budget perf cible fixe : terrain seul 60 fps desktop / 30 fps mobile.
- [ ] Budget perf mesure : terrain seul < cible FPS mobile.
- [x] ChunkStreamer compile et refuse les manifests non IGN.

## Risques

- Dataset lourd → ne pas committer brut, garder en source ignorée + manifest.
- Projection erronée → littoral décalé.
- Z trop exagéré → relief faux mais joli (à éviter, documenter le facteur).
