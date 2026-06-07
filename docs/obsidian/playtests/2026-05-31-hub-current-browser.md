---
type: playtest
date: 2026-05-31
build: local dev - client Vite localhost:5173 + Colyseus localhost:2567
result: no-go mobile
tags:
  - playtest
  - browser
  - hub
---

# Playtest hub actuel - Browser

## Setup

- Joueurs : 1
- Desktop : Browser, 1280x720
- Mobile : Browser viewport, 390x844
- URL : `http://localhost:5173/`
- Debug relief : `http://localhost:5173/?mapDebug`
- Duree : ~35 min
- Console : 0 erreur, 0 warning bloquant

## Captures

- Desktop hub : ![[2026-05-31-hub-current-assets/desktop-hub.png]]
- Relief debug : ![[2026-05-31-hub-current-assets/desktop-relief-mapdebug.png]]
- Mobile hub : ![[2026-05-31-hub-current-assets/mobile-hub.png]]
- Mobile pause : ![[2026-05-31-hub-current-assets/mobile-pause.png]]

## Parcours teste

- [x] Connexion : pastille `En ligne - 1` OK.
- [x] Deplacement desktop : WASD par Browser OK.
- [x] Camera desktop : drag souris OK.
- [x] Relief : ile + cote + relief visibles en `mapDebug`.
- [x] Collisions : props/fences bloquent globalement le joueur.
- [x] Prompt PNJ : prompt visible proche PNJ (`E - Parler a Ancien Volcan` observe).
- [x] Pause mobile : bouton tactile OK, panneau lisible.
- [ ] Interaction PNJ dialogue : non validee proprement dans Browser.
- [ ] Mobile gameplay : no-go, pas de controle de deplacement tactile.

## Findings

| ID | Prio | Symptome | Repro | Owner probable |
| --- | --- | --- | --- | --- |
| PT-2026-05-31-01 | P1 | Mobile injouable sans clavier. Aucun joystick, bouton action, ni controle tactile de mouvement. | Ouvrir 390x844, tenter de jouer au hub. Seul pause + chat sont tactiles. | `InputController`, HUD mobile |
| PT-2026-05-31-02 | P1 | Overlay pause mobile affiche uniquement des controles desktop (`WASD`, `Souris`, `E`, `Entree`). | Mobile > bouton pause. | `hud.ts`, copy responsive |
| PT-2026-05-31-03 | P2 | Camera desktop peut etre trop proche des props et du joueur pres des fences/barils. Le personnage et les props prennent beaucoup de champ. | Desktop > avancer vers zone fences/baril > tourner/approcher. | `camera.ts`, collision camera |
| PT-2026-05-31-04 | P2 | Collision visuelle approximative sur petits props : le joueur semble entrer legerement dans certains volumes avant blocage. Pas de traversée observee. | Desktop > pousser contre fence/baril/props. | `collision.ts`, proxies props |
| PT-2026-05-31-05 | P2 | Dialogue PNJ non valide dans ce run Browser. Prompt visible cote client, mais interaction `E` automatisee n'a pas ouvert le panneau. A retester au clavier physique pour separer bug input/serveur d'une limite Browser. | Desktop > approcher PNJ > `E` via Browser CUA. | `InputController`, `NetworkClient`, serveur interact |
| PT-2026-05-31-06 | P3 | Relief bien present en debug, mais peu lisible depuis camera joueur. La route/plaza restent tres plates face au relief de l'ile. | Desktop normal puis `?mapDebug`. | `world.ts`, art direction terrain |

## Notes visuelles

- Silhouette Reunion OK en debug.
- Cote/ocean lisibles.
- Hub lisible au premier chargement desktop.
- Bus jaune identifiable.
- Marqueur quete visible et utile.
- HUD desktop lisible, poids raisonnable.
- HUD mobile lisible, mais le chat prend le bas de l'ecran et renforce l'absence de controles tactiles.

## Decision

- Resultat : no-go mobile, go desktop sous reserve.
- Justification : le hub desktop est presentable pour revue visuelle. Le mobile ne peut pas etre considere jouable sans input tactile. L'interaction PNJ doit etre revalidee au clavier physique ou via test E2E capable de maintenir les touches.

## Actions

- [ ] Ajouter input mobile : joystick gauche + bouton action `Parler`.
- [ ] Adapter la pause mobile : copy tactile, pas desktop.
- [ ] Ajouter collision camera ou zoom-out auto pres des props.
- [ ] Ajuster proxies props/fences si on garde ces assets dans le hub.
- [ ] Ajouter test manuel PNJ : prompt proche -> `E` -> dialogue -> objectif accompli.
- [ ] Ajouter capture desktop apres dialogue Chauffeur Car Jaune.
