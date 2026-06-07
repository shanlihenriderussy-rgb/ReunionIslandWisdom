# 2026-05-31 - Prerequis streamer terrain

## Decision

Le streamer terrain ne doit pas consommer les chunks issus de `LaReunion.stl`.

Raison :

- source relief non fiable ;
- chunks sans heightfield associe ;
- collision pas garantie alignee au mesh ;
- impossible de valider les cirques/ravines correctement.

## Source valide

Source obligatoire :

```txt
packages/assets/sources/lareunion/rgealti/
```

Formats acceptes :

- `.asc` : support actif.
- `.tif/.tiff` : support prevu, dependance `geotiff` requise si utilise.

## Pipeline streamer pret

Commande :

```txt
corepack pnpm terrain:dem -- --gridX 220 --gridZ 198 --chunkCountX 4 --chunkCountZ 4 --verticalExaggeration 1.15
```

Sorties streamer :

```txt
apps/game-client/public/assets/terrain/lareunion/chunks/manifest.json
apps/game-client/public/assets/terrain/lareunion/chunks/lareunion-terrain-0.glb
apps/game-client/public/assets/terrain/lareunion/chunks/lareunion-terrain-0.json
...
```

Chaque chunk contient :

- `file` : GLB terrain ;
- `heightfield` : JSON de hauteurs du chunk ;
- `bounds` : limites monde ;
- `gridX/gridZ` local ;
- `triangles/runtimeVertices/bytes`.

## Blocage actuel

`corepack pnpm terrain:dem` echoue car aucun `.asc/.tif` n'est present dans le dossier RGE ALTI.

Message attendu :

```txt
Aucun .asc/.tif trouve dans packages/assets/sources/lareunion/rgealti
```

## Regle runtime

- `terrainAssets.laReunion.chunkManifest` pointe vers le manifeste chunks.
- Le streamer doit refuser un manifeste dont `source` n'est pas `IGN RGE ALTI D974`.
- Les chunks STL restent fallback visuel uniquement.
