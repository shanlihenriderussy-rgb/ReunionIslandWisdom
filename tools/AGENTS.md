# AGENTS.md - tools

## Secteur

Pipeline terrain + scripts build/lancement.
Priorite projet #1 : terrain fiable IGN RGE ALTI D974.

Fichiers pivots :

```txt
build-lareunion-dem-terrain.mjs   # source cible : RGE ALTI D974 (.asc, .tif via geotiff)
build-lareunion-relief-map.mjs    # fallback STL (non fiable, secondaire)
build-lareunion-terrain.mjs
build-lareunion-vector-map.mjs
package-web-release.ps1
launch-game.ps1 / stop-game.ps1
build-desktop-release.ps1 / launch-desktop.ps1
```

## Lecture obligatoire

Avant patch tools :

1. `../CLAUDE.md`
2. `../docs/obsidian/11-phase-0-terrain.md`
3. `../docs/obsidian/05-asset-pipeline.md`
4. `../docs/obsidian/iterations/2026-05-31-relief-source-audit.md`
5. le script touche

## Source terrain

```txt
Source cible : packages/assets/sources/lareunion/rgealti/  (NON versionne, ~940 Mo)
Outline      : packages/assets/sources/lareunion/lareunion-osm-outline.geojson
Fallback STL : packages/assets/sources/lareunion/LaReunion.stl  (ne pas designer dessus)
```

Sorties `build-lareunion-dem-terrain.mjs` :

```txt
apps/game-client/public/assets/terrain/lareunion/lareunion-relief-map.glb
apps/game-client/public/assets/terrain/lareunion/lareunion-relief-collision.json
apps/game-client/public/assets/terrain/lareunion/lareunion-heightfield.json
apps/game-client/public/assets/terrain/lareunion/relief-map-manifest.json
apps/game-client/public/assets/terrain/lareunion/chunks/manifest.json
```

## Regles tools

- Ne pas ameliorer le STL comme source finale.
- Ne pas designer le level final sur le STL.
- Priorite : ingerer / valider RGE ALTI D974.
- `.tif/.tiff` necessite la dependency `geotiff` (deja en devDependencies).
- Ne pas telecharger / regenerer un gros dataset sans demande explicite de Shan.
- Ne jamais ecraser une source non verifiee dans `sources/lareunion/`.
- Sorties terrain (`public/assets/terrain/`) = generees, regenerables ; sources = a proteger.
- Pas de secret dans les scripts ; pas d'API key en dur.
- Scripts PowerShell : pas de logique gameplay, packaging/lancement seulement.

## Commandes

```powershell
corepack pnpm terrain:dem    # node tools/build-lareunion-dem-terrain.mjs
corepack pnpm terrain:stl    # node tools/build-lareunion-relief-map.mjs (fallback)
```

## Verification terrain obligatoire (apres run)

Ouvrir `http://localhost:5173/?mapDebug` et confirmer :

- Piton des Neiges visible ;
- Piton de la Fournaise visible ;
- cirques Mafate / Cilaos / Salazie lisibles ;
- ravines lisibles ;
- littoral ouest Saint-Paul / Saint-Gilles coherent.

Si run headless / screenshot inconclusif : annoncer "validation statique seulement", ne pas conclure que le relief est valide.

## Jalon

Toucher le pipeline terrain = note dediee `../docs/obsidian/iterations/YYYY-MM-DD-agent-sujet.md` + entree publique dans `../docs/obsidian/22-synthese-publique-neophyte.md`.
