# 2026-06-27 - Terrain : GeoTIFF, projection et contrat LOD

## Objectif

Commencer les taches terrain restantes de [[11-phase-0-terrain]] :

- support `.tif/.tiff` ;
- projection RGR92 / UTM 40S explicite ;
- recentrage monde documente ;
- base LOD chunks pour perf mobile ;
- budget perf cible fixe.

## Changements

- Ajout de `geotiff` en dependance dev racine.
- `tools/build-lareunion-dem-terrain.mjs` :
  - lecture GeoTIFF renforcee : bbox valide, nodata, resolution, geoKeys ;
  - projection `RGR92 / UTM zone 40S` actee dans les manifests ;
  - recentrage par centre bbox UTM + `metersToWorldScale` ;
  - `worldMapping` ajoute aux sorties collision, heightfield, manifest global et chunks ;
  - `lodLevels` ajoute aux manifests ;
  - budget cible terrain seul : 60 fps desktop / 30 fps mobile.
- `ChunkStreamer` accepte maintenant un champ optionnel `lods` sans changer le rendu actuel.

## Non fait

- Pas de regeneration des gros assets terrain publics pendant ce patch.
- Pas encore de GLB/heightfield niveau 1 mobile-low.
- Pas encore de selection LOD dynamique selon distance ou FPS.
- Pas encore de playtest long marche/camera pour regler finement `verticalExaggeration`.

## Validation attendue

1. Regenerer le terrain avec `corepack pnpm terrain:dem`.
2. Verifier que les JSON publics contiennent `projection`, `worldMapping`, `lodLevels`.
3. Lancer `?mapDebug` et marcher longtemps sur relief + sentier.
4. Confirmer collision = visuel.
5. Noter FPS terrain seul desktop/mobile.
