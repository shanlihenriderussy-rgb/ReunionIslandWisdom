# 2026-06-28 - Biomes propres V1

## Contexte

- Retour Shan : le rendu de tous les biomes en blockout global etait visuellement mauvais.
- Probleme : trop de props proceduraux visibles ensemble, gros aplats, liaisons trop cartographiques.
- Decision : refaire les biomes un par un, avec chemins de liaison adaptes au relief.

## Diff

- `apps/game-client/src/render/biomeScenic.ts` remplace le blockout V0 par une couche V1 plus sobre :
  - un signal court par biome ;
  - une empreinte drapee sur le terrain ;
  - moins d'objets, tous rattaches a la lecture de zone ;
  - chemins densifies, puis ajustes lateralement vers les pentes les plus douces ;
  - surfaces marchables decoupees en petits segments pour suivre le denivele.
- `apps/game-client/src/render/world.ts` accepte maintenant les modes :
  - `?visualZone=route-littoral&mapDebug`
  - `?visualZone=saint-denis&mapDebug`
  - `?visualZone=mafate&mapDebug`
  - `?visualZone=salazie&mapDebug`
  - `?visualZone=cilaos&mapDebug`
  - `?visualZone=plaine-palmistes&mapDebug`
  - `?visualZone=sud-sauvage&mapDebug`
  - `?visualZone=all&mapDebug` pour audit global uniquement.

## Liaisons V1

- Ouest -> Route du Littoral -> Saint-Denis.
- Saint-Denis -> Salazie -> Plaine des Palmistes -> Fournaise.
- Ouest -> Mafate -> Piton des Neiges -> Cilaos.
- Cilaos -> Sud Sauvage -> Fournaise.
- Salazie -> Piton des Neiges.

## Tests

- `corepack pnpm --filter @riw/game-client typecheck` OK.
- `corepack pnpm --filter @riw/game-client lint` OK.
- Build et playtest navigateur a faire apres cette passe.

## Risques

- Ce n'est pas encore une vertical slice finale par biome.
- Les chemins evitent mieux les pentes, mais restent proceduraux et doivent etre ajustes par captures.
- Collision encore blockout : surfaces rectangulaires, pas mesh/Rapier.

## Suite

1. Ouvrir chaque URL `visualZone=<biome>&mapDebug`.
2. Corriger un biome a la fois selon capture.
3. Ajouter ensuite role de quete + assets definitifs, pas avant.
