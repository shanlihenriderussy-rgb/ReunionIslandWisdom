# 12 — Phase 1 : Level design zones

> Lié à [[10-build-plan]] [[11-phase-0-terrain]] [[06-world-links]] [[zones]] [[09-direction-artistique]].
> Statut : ZONE DE DÉPART = PITON DE LA FOURNAISE (2026-06-07). Blockout ouest conservé comme zone 2. Phase 0 terrain utilisable, assets encore placeholders.

## Objectif

Sur terrain fiable, découper l'île en zones jouables avec intention de gameplay, sans poser d'assets définitifs.

## Méthode

1. Repérage sur `?mapDebug` : marquer points d'intérêt réels (littoral ouest, cirques, volcan, hauts).
2. Définir **zone de départ** (hub) — proposition : littoral ouest Saint-Paul / Saint-Gilles (déjà placeholder procédural).
3. Blockout : volumes gris uniquement (navmesh, chemins, frontières), zéro prop décoratif.
4. Valider circulation joueur (pentes praticables, ravines = obstacles naturels).

## Zone de départ : Piton de la Fournaise (V1)

Mise a jour 2026-06-07 :

- **Décision** : le volcan devient la zone de départ du jeu (cf. [[04-decisions]] ADR-008). Le blockout ouest Saint-Paul / Saint-Gilles est conservé comme zone 2 (rien supprimé).
- Zone runtime : `piton-de-la-fournaise` (ajoutée dans `packages/content`).
- **Ancrage terrain vérifié** : le sommet de la Fournaise = pic sud-est du heightfield RGE ALTI = 2610 m à world `(65.9, -37)` (UTM E365976 / N7650350, sommet réel 2632 m). Mapping monde validé contre le spawn ouest existant.
- Spawn joueur : `x 65.9`, `y 9`, `z -35`, `yaw 3.14` (rebord nord du cratère Dolomieu, face au sommet/sud).
- `startZone` serveur → `piton-de-la-fournaise` (`ReunionWorldRoom.ts`). `activeEvent` → `eveil-fournaise`.
- Biome `fournaise` recentré sur le sommet vérifié (`biomes.ts`) → le bandeau de zone affiche « Piton de la Fournaise ».
- Objectif HUD V1 (observation, sans PNJ — cohérent avec l'état « PNJ non spawnés ») :
  1. Rejoindre le rebord du cratère Dolomieu.
  2. Observer l'Enclos Fouqué et le cône central.
  3. Repérer le Piton des Neiges au nord-ouest.
- **Aucun nouvel asset 3D** : on respecte le pipeline (terrain → level design → assets par quête). Le cratère est lu sur le terrain RGE ALTI brut.

Dette / suite Fournaise :

- Marqueurs de zone (rebord, cône, point de vue PdN) à matérialiser proprement (volumes gris d'abord).
- Auto-progression de l'objectif à brancher sur la position joueur (proximité rebord / cône), aujourd'hui inerte car liée au dialogue PNJ.
- Habillage basalte/scories + signal fumée : décision DA requise avant tout asset ([[09-direction-artistique]]).
- Vérifier la praticabilité des pentes du cône en `?mapDebug` et au spawn.

Mise a jour 2026-06-26 (départ Fournaise ACTIF en code) :

- Le spawn est réellement basculé sur la Fournaise (serveur + client), cf. [[04-decisions]] ADR-013.
- L'objectif HUD est désormais celui de la Fournaise (rebord Dolomieu → Enclos/cône → repère Piton des Neiges)
  et **auto-progresse selon la position du joueur** (plus de dépendance aux PNJ non spawnés).
- Validé en live : spawn sur le volcan, bandeau « Piton de la Fournaise », étapes 1+2 cochées au spawn.
- Dette : étapes 1+2 trop proches (repères < 3 m du spawn) ; spawn `snapToGround` avant collision async à surveiller.
- ⚠ Coordination : un agent Codex travaillait en parallèle dans la direction inverse (garder départ Ouest). À arbitrer.

Arbitrage 2026-06-26 (Shan) : **départ = Ouest** (Codex pilote l'Ouest : départ, spawn, fidélité B1). **Claude = zone Fournaise + continuité des autres zones**, sans toucher aux fichiers Ouest/spawn.

- Fournaise rapprochée du moodboard B2 (veines de lave, orgues basaltiques, lumière chaude) : [[iterations/2026-06-26-fournaise-b2-habillage]].
- Le départ Fournaise que Claude avait activé (ADR-013) est laissé à Codex pour réimposition du départ Ouest ; la zone Fournaise et ses repères/objectifs restent en place pour la continuité.

## Blockout Saint-Paul / Saint-Gilles V1

Mise a jour 2026-06-06 09:31 +04:00 :

- Zone de depart runtime : `saint-paul-saint-gilles`.
- Spawn joueur : `x -78`, `y 1.38`, `z 6`, `yaw -0.45`.
- Chemin principal : littoral ouest -> snack -> arret Car Jaune -> ravine -> sortie sud -> point de vue Maido / Mafate.
- Points chemin : `(-83,21)`, `(-80,16)`, `(-77,7)`, `(-73,-4)`, `(-70,-16)`, `(-66,-28)`, `(-60,-36)`, puis montee terrain-aware jusqu'a `(-36,8)`.
- Marqueurs quete : `lagon-lookout`, `snack-start`, `car-jaune-stop`, `ravine-gate`, `south-exit`, `maido-viewpoint`.
- Limites naturelles placeholder : rochers collisionnes cote mer, ravine et crete.
- PNJ de depart regroupes sur le parcours ouest, avec prompt visible proche du snack.
- Validation : [[playtests/2026-06-06-west-blockout]].

Mise a jour 2026-06-07 :

- Sentier reroute jusqu'au point de vue Maido / Mafate (`x -36`, `z 8`, hauteur ~`9.86`).
- Rendu chemin refait : ruban de terre opaque, lisse, centre clair et bords sombres.
- Le centre du ruban est densifie puis ajuste localement avec le heightfield pour rester sur les zones moins raides.
- Cible choisie comme replat haut sur le rempart ouest/sud-ouest de Mafate.
- Vegetation change a mi-hauteur Maido : moins de palmiers, plus de buissons/herbes/rochers de hauts, rempart plus ouvert.

Dette actuelle :

- Remplacer les rochers placeholders par vrais reliefs/vegetation/falaises.
- Brancher la hauteur terrain cote serveur sur toute la simulation, pas seulement au spawn.
- Reduire les chevauchements nametags avant test humain.

## Habillage scenic ouest V1

Mise a jour 2026-06-06 18:31 +04:00 :

- Ajout d'une couche scenic dediee au parcours Saint-Paul / Saint-Gilles.
- Les props sont posees en grappes autour des points de gameplay, pas reparties au hasard.
- Snack procedural place sur le chemin.
- Panneaux, rochers, palmiers, feuillages, ecume et patchs lagon ajoutent une lecture proche du moodboard B0 Global.
- Camera third-person abaissee pour une vue plus diorama.
- Note : [[iterations/2026-06-06-global-moodboard-runtime]].

## Base secteurs actuelle

Mise a jour 2026-06-05 :

- `saint-paul-saint-gilles` : secteur depart ouest, plage/lagon/ponton/barque, props terrestres uniquement sur l'île.
- `fournaise` : secteur volcan/basalte, rochers/vegetation rare.
- `salazie` : secteur vert humide, cascades et palmiers placeholder.
- `cirques` : secteur montagne/campement.
- `saint-denis` : secteur ville/place creole a construire.
- `route-littoral` : secteur falaise/ocean, epave autorisee en eau.
- `plaine-palmistes` : secteur hauts/foret.

Regle runtime : aucun prop decoratif dans l'eau. Exceptions : port, ponton, bateau, epave.

## Tâches

- [ ] Carte des zones macro (départ, hauts, cirques, volcan, côtes) → MAJ [[zones]].
- [ ] Définir frontières et transitions entre zones.
- [x] Blockout zone de départ (volumes gris + spawns + collisions).
- [ ] Définir échelle de déplacement (temps de traversée cible par zone).
- [x] Placeholders CC0 regroupes par secteurs.
- [ ] Remplacer les placeholders par assets de zone/quete valides.
- [ ] Note level design par zone dans [[02-backlog]] + iteration.

## Critères de sortie

- [ ] Zone de départ traversable du spawn aux 4 sorties sans blocage.
- [ ] Pentes/ravines cohérentes avec le relief réel.
- [ ] Aucune zone « trou » (joueur tombe hors monde).
- [x] Premier découpage validé en playtest interne ([[playtests/2026-06-06-west-blockout]]).

## Règles

- Pas d'asset sans rôle de zone/quête/gameplay/budget perf.
- Ancrage Réunion obligatoire : noms et lieux réels (voir [[bible-reunion]]).
