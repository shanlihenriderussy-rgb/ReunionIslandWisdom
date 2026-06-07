---
type: playtest
date: 2026-06-06 09:31 +04:00
build: local Vite 5173
result: go
tags:
  - playtest
  - level-design
  - saint-paul
  - saint-gilles
  - blockout
---

# Playtest - Blockout Saint-Paul / Saint-Gilles

## Setup

- Joueurs : serveur local actif avec joueurs connectes
- Device : desktop 1280x900 + mobile 390x844
- Navigateur : Playwright Chromium
- URL : `http://localhost:5173/?mapDebug`
- Duree : passe visuelle courte

## Captures

![[2026-06-06-west-blockout/westblockout-thirdperson-npc.png]]

![[2026-06-06-west-blockout/westblockout-mapdebug-npc.png]]

![[2026-06-06-west-blockout/westblockout-mobile-mapdebug-npc.png]]

## Parcours teste

- [x] Spawn de depart place sur Saint-Paul / Saint-Gilles : `x -78`, `z 6`.
- [x] Vue third-person rapprochee conservee.
- [x] Chemin principal visible entre littoral ouest, snack, arret car jaune, ravine, sortie sud.
- [x] Extension visuelle du chemin vers le point de vue Maido / Mafate.
- [x] Pentes echantillonnees depuis le heightfield RGE ALTI.
- [x] Limites naturelles placeholder posees avec rochers bas-poly.
- [x] Collisions locales ajoutees sur les marqueurs de limite.
- [x] PNJ de depart visibles sur le secteur ouest.
- [x] Prompt PNJ visible : `E - Parler a Tatie Snack`.
- [x] HUD objectif realigne : depart sur Tatie Snack, puis chemin Car Jaune, ravine, sortie sud.
- [x] Vue carte conservee pour se reperer.
- [x] Mobile `?mapDebug` charge sans chevauchement bloquant du HUD.

## Validation technique

| Signal | Valeur | OK ? |
| --- | --- | --- |
| Source terrain | `IGN RGE ALTI D974` | oui |
| Zone depart runtime | `saint-paul-saint-gilles` | oui |
| Spawn client | `WEST_BLOCKOUT_SPAWN` | oui |
| Spawn serveur | zone content ouest | oui |
| Chemin blockout | ruban terrain-following | oui |
| Extension Maido | ruban de terre jusqu'a `(-36,8)` | oui |
| Collisions blockout | obstacles circulaires sur limites naturelles | oui |
| Interaction PNJ | prompt visible + touche `E` branchee | oui |
| Objectif HUD | Tatie Snack -> Car Jaune -> ravine / sortie sud | oui |
| TypeScript | `corepack pnpm typecheck` | oui |
| Lint | `corepack pnpm lint` | oui |
| Build | `corepack pnpm build` | oui |

## Bugs / limites

| ID | Prio | Symptome | Repro ? |
| --- | --- | --- | --- |
| PT-2026-06-06-01 | P2 | Les nametags joueurs/PNJ peuvent encore se chevaucher en zone dense. | oui |
| PT-2026-06-06-02 | P2 | Le serveur spawn au bon endroit, mais ne suit pas encore le heightfield pour toute la simulation de mouvement. | oui |
| PT-2026-06-06-03 | P3 | En vue carte mobile, le blockout ouest est tres petit car l'ile complete reste affichee. | oui |
| PT-2026-06-06-04 | P3 | Les rochers de limite sont placeholders ; ils devront devenir falaises, ravines, murs naturels ou vegetation de bord de chemin. | oui |
| PT-2026-06-06-05 | P3 | Le HUD progresse par dialogue PNJ ; il faudra remplacer la fin par checkpoints geographiques quand l'interaction `inspect` existe. | oui |

## Decision

- Resultat : go.
- Justification : le secteur ouest a maintenant une premiere boucle jouable, lisible en third-person, avec chemin, limites, PNJ et prompt.

## Actions

- [ ] Transformer les marqueurs de limite en vrais obstacles de relief : ravine, falaise, vegetation dense.
- [x] Construire la premiere quete HUD autour de Tatie Snack, Car Jaune et sortie sud.
- [ ] Remplacer la progression finale par checkpoints geographiques.
- [ ] Brancher la hauteur terrain cote serveur pour les deplacements.
- [ ] Reduire les chevauchements de nametags avant un test 2 joueurs humain.

## Recheck HUD - 2026-06-07

- Serveurs locaux relances : client `http://localhost:5173/`, serveur `ws://localhost:2567`.
- Smoke HTTP : page Vite `200`, bundle HUD servi avec `Parle a Tatie Snack`, journal `Premier tour Saint-Paul / Saint-Gilles`.
- Contenu servi : quete `premier-tour-saint-paul-saint-gilles`, ligne Tatie Snack alignee sur snack -> Car Jaune -> ravine -> sortie sud.
- `corepack pnpm typecheck` : OK.
- `corepack pnpm lint` : OK.
- `corepack pnpm --filter @riw/game-client build` : OK, warning taille chunk Vite non bloquant.

## Recheck chemin terre - 2026-06-07

- Sentier principal reroute : `18` points, longueur `114.56` unites monde.
- Nouvelle fin : `Point de vue Maido / Mafate` a `x -36`, `z 8`, hauteur terrain ~`9.86`.
- Rendu : ruban de terre plus opaque, lisse, vertex colors centre / bords.
- Terrain-aware : densification + ajustement local par cout de pente sur `lareunion-relief-collision.json`.
- Belvedere : marqueur `maido-viewpoint` + cone de vue vers le centre de Mafate.
- Vegetation : transition mi-hauteur Maido active (`maidoMid`, `maidoRim`), sans palmiers dominants sur le rempart.
