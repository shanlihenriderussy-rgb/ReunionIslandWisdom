---
type: playtest
date: 2026-06-05 21:08 +04:00
build: local Vite 5173
result: go
tags:
  - playtest
  - terrain
  - mapdebug
  - assets
---

# Playtest - Scale 220, sable bake, secteurs assets

## Setup

- Joueurs : 4 connectes dans le serveur local
- Device : desktop 1280x900 + mobile 390x844
- Navigateur : Playwright Chromium
- URL : `http://localhost:5173/?mapDebug`
- Duree : passe visuelle courte

## Captures

![[2026-06-05-scale220-baked-sand/mapdebug-scale220-baked-sand.png]]

![[2026-06-05-scale220-baked-sand/thirdperson-scale220-baked-sand.png]]

![[2026-06-05-scale220-baked-sand/mobile-mapdebug-scale220-baked-sand.png]]

## Parcours teste

- [x] Chargement carte `?mapDebug`
- [x] Chargement vue jouable third-person
- [x] Capture mobile `?mapDebug`
- [x] Relief lisible en vue carte
- [x] Bande jaune sable supprimee
- [x] Sable fusionne au terrain par vertex colors
- [x] Echelle carte augmentee (`targetLongestSide 220`)
- [x] Camera third-person rapprochee conservee
- [x] Props regroupes par secteurs
- [x] Props terrestres hors eau

## Validation technique

| Signal | Valeur | OK ? |
| --- | --- | --- |
| Manifest terrain | `source: IGN RGE ALTI D974`, 16 chunks | oui |
| Bounds collision | `x -110..110`, `z -102.14..102.14` | oui |
| Props total | 43 | oui |
| Props terrestres hors contour | 0 | oui |
| Props autorises en eau | `CC0_West_PirateDock`, `CC0_West_RowBoat` | oui |
| TypeScript | `corepack pnpm --filter @riw/game-client typecheck` | oui |
| Lint | `corepack pnpm --filter @riw/game-client lint` | oui |
| Build | `corepack pnpm --filter @riw/game-client build` | oui |

## Bugs / limites

| ID | Prio | Symptome | Repro ? |
| --- | --- | --- | --- |
| PT-2026-06-05-01 | P2 | Le sable bake reste discret en vue carte globale. A regler pendant le blockout ouest/sud avec des masques plus precis. | oui |
| PT-2026-06-05-02 | P3 | Warning build Vite : bundle client > 500 kB. Hors scope terrain, a traiter quand assets/runtime grossissent. | oui |

## Decision

- Resultat : go pour passer au blockout level design par secteur.
- Justification : terrain fiable, echelle monde augmentee, props hors eau, bandes sable supprimees, captures desktop/mobile lisibles.

## Actions

- [ ] Definir les chemins jouables dans `saint-paul-saint-gilles`.
- [ ] Poser des limites naturelles avec ravines/falaises au lieu de murs invisibles.
- [ ] Remplacer progressivement les placeholders CC0 par assets specifiques aux quetes.
- [ ] Tester la collision joueur sur une marche longue du littoral ouest vers les hauts.
