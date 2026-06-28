# 2026-06-28 — Littoral lisse + embarcadere generique

## Contexte

- Bords de l'ile en escalier (« pixellises ») au litoral.
- Cause : le maillage terrain est decoupe cellule par cellule (`pointInPolygon` sur le centre de chaque cellule) dans `tools/build-lareunion-dem-terrain.mjs` -> silhouette en marches a la resolution de la grille (640x576, cellule ~0.34 u).
- Demande Shan : creer un port sur le littoral est (vu en jeu, zone Plaine des Palmistes, ~(65, 33)) et polir tous les bords pixellises de l'ile.
- Decisions Shan 2026-06-28 : (1) regenerer le terrain (lissage dans le build tool, pas overlay cosmetique) ; (2) embarcadere generique (pas Le Port, pas marina nommee).

## Diff

### Lissage littoral — `tools/build-lareunion-dem-terrain.mjs`

- Ajout d'une etape de lissage avant generation du mesh :
  - `computeKeptGrid` : grille des cellules gardees (test par centre, calcule 1x, partage mono + chunks).
  - `computeCoastSnap` : projette chaque sommet de rive sur l'outline OSM (`nearestPointOnOutline`), avec un **garde-fou anti-inversion** : tant qu'un triangle cotier change de signe d'aire, on divise par deux l'offset des sommets concernes (convergence vers l'original => 0 triangle retourne).
  - `sampleHeightWorld` : re-echantillonne la hauteur au point projete.
- `createReliefMesh` et `createReliefChunkMesh` : la triangulation passe par `cellKept` (identique au test par centre, plus rapide), et les sommets de rive utilisent la position projetee. Snap **deterministe et partage** mono/chunks -> pas de couture entre chunks, normales globales conservees.
- `outline` reste sauvegarde tel quel dans la collision (inchange). Les `heights` de la collision restent la grille brute (la physique ne bouge pas).

### Embarcadere — `apps/game-client/src/render/embarcadere.ts` (nouveau)

- Jetee blockout low-poly procedurale : tablier + 16 pieux + ponton en T + 2 bittes + garde-corps. ~700 triangles.
- Ancrage runtime : lit `reliefCollision`, trouve la cote la plus proche de (65, 33), oriente vers le large via la normale sortante de l'outline.
- Pas de personnage, pas d'asset externe, pas de licence a tracer (geometrie generee).
- `world.ts` : `addEmbarcadere(scene, onWalkableSurfaces)` appele dans `configureWorld` (independant du mode de zone).

### Surfaces marchables — `apps/game-client/src/game/collision.ts`

- Ajout d'un type de collision `WalkableSurface` : rectangle oriente avec `topY`.
- `WorldCollision` prend ces surfaces comme sol prioritaire (`sampleGround`) et comme zone walkable meme hors outline terrain (cas ponton sur l'eau).
- `apps/game-client/src/world/westBlockout.ts` declare les grandes dalles visibles du depart Ouest comme surfaces marchables.
- L'embarcadere remonte deux surfaces marchables synchronisees avec son placement runtime : tablier + ponton en T.
- Correctif 2026-06-28 : ajout du volume lateral sur les dalles (`blocksSides`) pour eviter de traverser les faces verticales.
- Les rochers/barrieres generes par `render/westVegetation.ts` remontent maintenant `climbableTopY` : ils restent collisionnables, mais peuvent servir de petit volume montable quand leur hauteur le permet.
- Les volumes montables portent une tolerance locale `stepUp` (0.72) : le seuil global de marche reste strict, mais les rochers/dalles designes comme montables ne se comportent plus comme des murs.
- Les anciens colliders statiques des marqueurs Ouest ont ete retires pour eviter un doublon non montable ; les colliders runtime poses au sol deviennent la source de verite.
- Passe suivante : `westScenic.ts` remonte aussi ses collisions runtime :
  - snack, cases creoles, panneaux, barque = colliders props non montables ;
  - petit ponton Ouest = surface marchable rectangulaire avec volume lateral.

## Tests

- Validation isolee du lissage sur l'outline reel (script `validate-coast-snap.mjs`) :
  - 2517 sommets de rive projetes, distance max 0.244 u.
  - **0 triangle retourne, 0 degenere** (garde-fou : 1 passe).
  - Perimetre silhouette : 881 -> 720 u (**-18 %** = plus lisse).
- `node --check` OK sur le bloc de helpers (code copie exact + stub THREE).
- A FAIRE cote Windows (sandbox sans deps) :
  - `corepack pnpm --filter @riw/game-client typecheck` + `lint` (module embarcadere).
  - `corepack pnpm terrain:dem` pour regenerer GLB + chunks + collision + manifest.
  - Verif visuelle `?mapDebug` : littoral lisse + embarcadere cote est.
- 2026-06-28 surfaces marchables :
  - `corepack pnpm typecheck` OK.
  - `corepack pnpm lint` OK.
  - `corepack pnpm build` OK.
  - Runtime `http://localhost:5173/?mapDebug` recharge OK, canvas present, pas d'erreur console (warnings Three connus).
  - Test isole : rectangle oriente pris comme sol (`center=3.25`, `rotatedInside=3.25`, `outside=0`).
  - Correctif volume/top : au spawn capture Shan `(-78.5, 7.5)`, hauteur runtime passee de `y=0.6` a `y=0.9` apres reload : joueur porte par la dalle haute au lieu de traverser la face.
  - Test direct `resolveMove` : rocher haut `climbableTopY=0.62` + `stepUp=0.72` -> joueur monte a `y=0.62`; meme rocher sans top -> obstacle a `x=1.22`.
  - Passe scenic : `corepack pnpm typecheck`, `lint`, `build` OK. Runtime `?mapDebug` recharge OK, canvas present, pas d'erreur console nouvelle.

## Risques

- `terrain:dem` ecrase `lareunion-relief-map.glb`, les `chunks/`, la collision et le manifest. Reversible via git.
- Collision physique = heightfield brut (grille), pas le mesh lisse : le bord jouable peut differer de quelques dizaines de cm du nouveau trait de cote. Acceptable au stade blockout.
- Les surfaces marchables sont des rectangles de gameplay, pas une collision mesh triangle par triangle. OK pour blockout ; Rapier reste la cible plus tard.
- Les rochers utilisent un top simplifie (`climbableTopY`) et non leur forme GLB exacte. Suffisant pour ne plus opposer "collisionnable" a "montable", mais a remplacer par vraies shapes si Rapier arrive.

## Suite

1. Shan : `pnpm terrain:dem` + verif `?mapDebug`.
2. Si OK : screenshot avant/apres dans une playtest note.
3. Plus tard : role gameplay de l'embarcadere (quete peche/transport ?), garde-corps bloquants, eventuel passage du COAST_SNAP_MAX si une baie etroite reste en marche.
