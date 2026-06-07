# Asset Pipeline 3D

## Format runtime

```txt
GLB uniquement
```

## Assets installes

Sources :

- `packages/assets/sources/kenney/kenney_mini-characters.zip`
- `packages/assets/sources/kenney/kenney_platformer-kit.zip`
- `packages/assets/sources/kenney/kenney_survival-kit.zip`
- `packages/assets/sources/lareunion/LaReunion.stl`
- `packages/assets/sources/lareunion/lareunion-osm-outline.geojson`

Extraction vendor :

- `packages/assets/vendor/kenney/mini-characters`
- `packages/assets/vendor/kenney/platformer-kit`
- `packages/assets/vendor/kenney/survival-kit`

Runtime Vite :

- `apps/game-client/public/assets/vendor/kenney/mini-characters/glb`
- `apps/game-client/public/assets/vendor/kenney/platformer-kit/glb`
- `apps/game-client/public/assets/vendor/kenney/survival-kit/glb`
- `apps/game-client/public/assets/terrain/lareunion/chunks`
- `apps/game-client/public/assets/terrain/lareunion/lareunion-vector-map.glb`

Manifest :

- `packages/assets/src/index.ts`

Licence :

- Kenney Mini Characters : CC0.
- Kenney Platformer Kit : CC0.
- Kenney Survival Kit : CC0.

## Regle licence CC0 (figee)

CC0 1.0 (`https://creativecommons.org/publicdomain/zero/1.0/`) = domaine public, renonciation au copyright.

Autorise :

- usage commercial (jeu monetise) ;
- modification / remix / integration GLB, textures, code ;
- redistribution, meme dans un produit ferme ;
- aucune attribution legalement obligatoire.

Ne couvre PAS (verifier a part) :

- marques / logos -> droit des marques (interdit par [[bible-reunion]] : marques reelles sans accord) ;
- visages / personnes -> droit a l'image ;
- brevets.

Regle projet :

- CC0 = licence par defaut acceptee pour assets externes.
- Toute autre licence (CC-BY, MIT, proprietaire) -> decision explicite dans [[04-decisions]] avant import.
- Verifier que l'uploadeur avait le droit de poser le CC0 (un asset vole re-publie CC0 reste contrefait).
- Sources fiables privilegiees : Kenney, Poly Haven, OpenGameArt (licence claire).
- Tracer source + licence pour CHAQUE asset, meme sans obligation legale (preuve de provenance).
- Attribution courtoise recommandee meme si non requise.

## Donnees terrain — IGN RGE ALTI D974 (Licence Ouverte / Etalab 2.0)

Source relief officielle. **N'est PAS du CC0.**

- Dataset : `RGEALTI 2-0 5M ASC RGR92UTM40S-REUN89 D974 2023-09-05`, 128 tuiles ASC, 5 m, ~940 Mo decompresse.
- Emplacement local : `packages/assets/sources/lareunion/rgealti/` (git-ignore, non versionne).
- Licence : **Licence Ouverte / Etalab 2.0** -> usage commercial OK, modification OK, redistribution OK,
  mais **attribution obligatoire** : mentionner "IGN" / "RGE ALTI(R) (c) IGN" dans les credits du jeu.
- A faire : ajouter la mention IGN dans les credits in-game + page legale au lancement.
- Sorties generees (versionnables) : `apps/game-client/public/assets/terrain/lareunion/` (GLB, heightfield, collision, chunks).

Usage Survival Kit :

- details de campement ;
- props de marche / sentier ;
- rochers / arbres / herbes ;
- caisses / tonneaux / panneaux ;
- base pour zones Mafate, Volcan, Route du Littoral.

## Pipeline

```txt
Blender
-> export GLB
-> glTF Transform
-> meshopt
-> validation
-> manifest
-> chargement Three.js
```

Carte La Reunion :

```txt
packages/assets/sources/lareunion/lareunion-osm-outline.geojson
-> node tools/build-lareunion-vector-map.mjs
-> silhouette OSM simplifiee 11427 -> 584 points
-> echelle targetLongestSide 155
-> apps/game-client/public/assets/terrain/lareunion/lareunion-vector-map.glb
-> packages/assets/src/index.ts
-> world.ts
```

Carte relief + collision :

```txt
packages/assets/sources/lareunion/lareunion-osm-outline.geojson
+ packages/assets/sources/lareunion/LaReunion.stl
-> node tools/build-lareunion-relief-map.mjs
-> apps/game-client/public/assets/terrain/lareunion/lareunion-relief-map.glb
-> apps/game-client/public/assets/terrain/lareunion/lareunion-relief-collision.json
-> apps/game-client/src/game/collision.ts
```

Relief STL garde en source secondaire :

```txt
packages/assets/sources/lareunion/LaReunion.stl
-> node tools/build-lareunion-terrain.mjs
-> extraction peau superieure
-> relief verticalExaggeration 0.55
-> centre de l'ile cale a y=0
-> 4 chunks GLB runtime (~1.17 MB chacun)
-> packages/assets/src/index.ts
-> world.ts
```

## Budgets V1

- Avatar joueur : moins de 1.5 MB.
- PNJ : moins de 1 MB.
- Prop courant : moins de 300 KB.
- Zone initiale : moins de 25 MB chargee.
- Texture mobile : 1024 px max.
- Collision proxy separe.

## Nommage

```txt
zone_saint_denis_hub_v001.glb
prop_barquette_cari_v001.glb
npc_tatie_snack_v001.glb
avatar_default_v001.glb
```

## Checklist import

- [ ] echelle OK
- [ ] pivot OK
- [ ] orientation OK
- [ ] materiaux limites
- [ ] textures compressees
- [ ] collision proxy
- [ ] LOD si necessaire
