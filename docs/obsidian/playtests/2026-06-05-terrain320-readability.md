---
type: playtest
date: 2026-06-05 21:37 +04:00
build: local Vite 5173
result: go
tags:
  - playtest
  - terrain
  - mapdebug
  - readability
---

# Playtest - Terrain 320x288 readability

## Setup

- Joueurs : 4 connectes dans le serveur local
- Device : desktop 1280x900 + mobile 390x844
- Navigateur : Playwright Chromium
- URL : `http://localhost:5173/?mapDebug`
- Duree : passe visuelle courte

## Captures

![[2026-06-05-terrain320-readability/mapdebug-terrain320.png]]

![[2026-06-05-terrain320-readability/thirdperson-terrain320.png]]

![[2026-06-05-terrain320-readability/mobile-mapdebug-terrain320.png]]

## Parcours teste

- [x] Chargement carte `?mapDebug`
- [x] Chargement vue jouable third-person
- [x] Capture mobile `?mapDebug`
- [x] Relief plus lisible que la passe `220 x 198`
- [x] Cirques/ravines plus contrastes
- [x] Volcan plus identifiable
- [x] Pas de ruban sable dur
- [x] Camera third-person rapprochee conservee

## Validation technique

| Signal | Valeur | OK ? |
| --- | --- | --- |
| Manifest terrain | `source: IGN RGE ALTI D974`, 16 chunks | oui |
| Mesh | `gridX 320`, `gridZ 288` | oui |
| Props total | 43 | oui |
| Props terrestres hors contour | 0 | oui |
| Props autorises en eau | `CC0_West_PirateDock`, `CC0_West_RowBoat` | oui |
| TypeScript | `corepack pnpm --filter @riw/game-client typecheck` | oui |
| Lint | `corepack pnpm --filter @riw/game-client lint` | oui |
| Build | `corepack pnpm --filter @riw/game-client build` | oui |

## Bugs / limites

| ID | Prio | Symptome | Repro ? |
| --- | --- | --- | --- |
| PT-2026-06-05-03 | P2 | Le bord de l'ile garde un aspect encore legerement crantele en vue carte tres zoomee. | oui |
| PT-2026-06-05-04 | P2 | Le rendu est plus lisible mais encore trop "carte terrain". Le vrai saut visuel viendra du blockout par dioramas et assets de zone. | oui |

## Decision

- Resultat : go.
- Justification : la lecture du relief est nettement meilleure et le budget chunks reste raisonnable.

## Actions

- [ ] Demarrer le blockout Saint-Paul / Saint-Gilles.
- [ ] Definir chemins, pentes praticables, limites naturelles.
- [ ] Ajouter assets specifiques seulement apres validation du chemin principal.
