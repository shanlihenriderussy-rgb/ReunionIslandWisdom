---
type: iteration
date: 2026-05-31
scope: relief-source-audit
tags:
  - iteration
  - terrain
  - dem
  - level-design
---

# Audit sources relief Reunion

## Probleme

Le relief actuel issu de `packages/assets/sources/lareunion/LaReunion.stl` est insuffisant :

- formes incompletes ou incorrectes ;
- denivele trop approximatif pour designer les zones ;
- artefacts possibles selon projection / simplification STL ;
- pas assez fiable pour placer les biomes et les quetes.

Decision immediate :

- ne plus investir dans le STL comme source finale ;
- garder le STL seulement comme placeholder local ;
- basculer vers un vrai MNT/DEM.

## Sources explorees

| Source | Resolution | Type | Statut | Note |
| --- | ---: | --- | --- | --- |
| IGN RGE ALTI | 1 m / 5 m | MNT | priorite 1 | Source officielle France/Outre-mer. Meilleure base pour La Reunion. |
| Copernicus DEM GLO-30 | 30 m | DSM | fallback | Global, plus simple, mais inclut vegetation/bati. Moins precis pour ravines/cirques. |
| OpenTopography | 30 m+ selon dataset | portail/API | fallback outil | Utile pour recuperer Copernicus/SRTM/NASADEM par bbox si besoin. |
| SRTM / NASADEM | 30 m | DEM global | fallback bas | Suffisant pour silhouette globale, trop grossier pour level design local. |

## Source cible

Priorite : **IGN RGE ALTI 1m - D974 La Reunion**.

Raisons :

- MNT officiel ;
- resolution adaptee aux ravines, cirques, littoral et pentes ;
- donnees publiques sous Licence Ouverte ;
- couvre les territoires ultramarins dont La Reunion.

Liens :

- data.gouv : https://www.data.gouv.fr/datasets/rge-alti-r
- cartes.gouv / IGN : https://cartes.gouv.fr/rechercher-une-donnee/dataset/IGNF_RGE-ALTI
- fiche RGE ALTI : https://geoservices.ign.fr/rgealti
- telechargement 1M D974 ASC RGR92UTM40S-REUN89 :
  - `RGEALTI_2-0_1M_ASC_RGR92UTM40S-REUN89_D974_2023-09-05.7z.001`
  - `RGEALTI_2-0_1M_ASC_RGR92UTM40S-REUN89_D974_2023-09-05.7z.002`
- telechargement 5M D974 ASC RGR92UTM40S-REUN89 :
  - `RGEALTI_2-0_5M_ASC_RGR92UTM40S-REUN89_D974_2023-09-05.7z`

## Fallbacks

Copernicus DEM GLO-30 :

- https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM
- https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM.html

OpenTopography :

- https://www.opentopography.org/start

## Pipeline cible

1. Recuperer RGE ALTI D974.
2. Extraire les `.asc` dans `packages/assets/sources/lareunion/rgealti/`.
3. Lancer :

```powershell
corepack pnpm terrain:dem
```

4. Convertir ASC/GeoTIFF vers grille runtime.
5. Reprojeter vers repere jeu :
   - source probable : RGR92 / UTM 40S ;
   - jeu : x/z centre ile, metres normalises.
6. Generer :
   - `lareunion-heightfield.json` pour collisions ;
   - `lareunion-relief-map.glb` pour rendu ;
   - `lareunion-biomes-mask.json` pour plages / foret / volcan.
7. Verifier :
   - Piton des Neiges ;
   - Piton de la Fournaise ;
   - cirques Mafate / Cilaos / Salazie ;
   - ravines ;
   - littoral ouest Saint-Paul / Saint-Gilles.

## Actions

- [ ] Remplacer `LaReunion.stl` par RGE ALTI D974 comme source terrain.
- [ ] Ajouter script `tools/build-lareunion-dem-terrain.mjs`.
- [ ] Garder `tools/build-lareunion-relief-map.mjs` seulement en fallback STL.
- [ ] Ajouter verification de points altimetriques connus.
- [ ] Refaire les plages apres generation DEM correcte.
- [ ] Revoir emplacement de la Vierge apres reprojection fiable.
