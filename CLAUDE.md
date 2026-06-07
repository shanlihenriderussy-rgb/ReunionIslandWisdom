# Claude Instructions - Reunion Island Wisdom

## Mission

Tu travailles sur `Reunion Island Wisdom`.

Objectif produit :

- MMORPG 3D web/PWA situe a La Reunion.
- Direction : exploration 3D low-poly, credible localement, mobile/web first.
- Priorite actuelle : **terrain fiable + level design propre**.

Ne transforme pas ce repo en demo generique.
Ne rajoute pas de props/personnages au hasard.

## Style de travail

- Reponds en francais.
- Phrases courtes.
- Pas de blabla.
- Lis les fichiers touches avant patch.
- Patch cible.
- Pas de refonte sans annoncer clairement pourquoi.
- Pas de commit/push sans demande explicite.
- Si tu touches decision, bug, playtest, scope ou pipeline : mets a jour `docs/obsidian/`.

Sortie standard :

```txt
Contexte :
Diff :
Tests :
Risques :
Suite :
```

## Workspace

```txt
C:\Users\Shan li\Documents\Reunion Island Wisdom
```

Points d'entree :

```txt
README.md
docs/obsidian/00-dashboard.md
docs/obsidian/01-roadmap.md
docs/obsidian/02-backlog.md
docs/obsidian/04-decisions.md
docs/obsidian/09-direction-artistique.md
docs/obsidian/20-references-visuelles.md
docs/obsidian/21-systeme-de-jeu.md
docs/obsidian/22-synthese-publique-neophyte.md
docs/obsidian/23-design-system-hud.md
docs/obsidian/iterations/2026-05-31-clean-level-base.md
docs/obsidian/iterations/2026-05-31-relief-source-audit.md
docs/Refs
docs/world/bible-reunion.md
```

## Stack stricte

```txt
Monorepo : pnpm workspace
Client : apps/game-client - Vite + TypeScript + Three.js
Serveur : apps/game-server - Colyseus authoritative
Shared : packages/shared - protocoles + Zod
Content : packages/content - zones / PNJ / quetes / items
Assets : packages/assets - sources + manifests
Docs : docs/obsidian
```

Ne pas ajouter React.
Ne pas ajouter Next.js.
Ne pas ajouter de framework UI.
Ne pas ajouter de moteur de jeu.
Ne pas migrer vers Babylon/Unity/PlayCanvas.

## Commandes

Installation :

```powershell
corepack pnpm install
```

Dev :

```powershell
corepack pnpm dev
```

Validation :

```powershell
corepack pnpm --filter @riw/game-client typecheck
corepack pnpm --filter @riw/game-client lint
corepack pnpm --filter @riw/game-client build
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
```

Terrain :

```powershell
corepack pnpm terrain:dem
corepack pnpm terrain:stl
```

URLs :

```txt
Client : http://localhost:5173
Serveur : ws://localhost:2567
Debug map : http://localhost:5173/?mapDebug
```

## Etat actuel a respecter

Depuis le 2026-05-31 :

- Tous les props placeholder ont ete retires.
- Tous les personnages visibles ont ete retires.
- Le joueur local a un avatar capsule articule : `render/players.ts` (`createLocalPlayerMesh`), couleur `#F2C66D`.
- Les joueurs distants sont rendus : `render/players.ts` (`syncRemotePlayers`) + nametags.
- Les PNJ ne sont PAS spawnes : `render/npcs.ts` (`addNpcViews`) existe mais n'est pas appele dans `GameApp`.
- La map sert a inspecter le terrain et le level design.
- La Vierge est un placeholder procedural.
- Les plages Saint-Paul / Saint-Gilles sont des placeholders proceduraux.
- Le relief STL est considere non fiable.
- Source terrain cible : IGN RGE ALTI D974.
- Le slider lateral de zoom/dezoom existe deja dans le HUD.

Ne remets pas :

- Car Jaune placeholder ;
- route placeholder ;
- fences ;
- arbres Kenney ;
- rochers Kenney ;
- tente ;
- caisses ;
- barils ;
- feu ;
- coffre ;
- PNJ visibles ;
- avatar joueur visible.

Exception :

- seulement si Shan demande explicitement de reintroduire un asset ou un personnage precis.

## Architecture client

Fichiers principaux :

```txt
apps/game-client/src/main.ts
apps/game-client/src/game/GameApp.ts
apps/game-client/src/game/InputController.ts
apps/game-client/src/game/camera.ts
apps/game-client/src/game/collision.ts
apps/game-client/src/render/world.ts
apps/game-client/src/render/gltf.ts
apps/game-client/src/ui/hud.ts
apps/game-client/src/network/NetworkClient.ts
apps/game-client/src/styles.css
```

Responsabilites :

- `GameApp.ts` : boucle, scene, camera, input, reseau.
- `world.ts` : terrain, ocean, landmarks temporaires, biomes visuels.
- `collision.ts` : heightfield + colliders minimaux.
- `camera.ts` : camera follow + zoom.
- `hud.ts` : DOM HUD, pause, zoom, chat.
- `gltf.ts` : chargement GLB.

Design system HUD :

```txt
docs/obsidian/23-design-system-hud.md
docs/design-system/hud/tokens.css
docs/design-system/hud/components.css
apps/game-client/src/design-tokens.css
```

Regle :

- Lire `23-design-system-hud.md` avant tout patch UI/HUD.
- Ne pas ajouter de framework UI.
- Ne pas importer Google Fonts en runtime.
- Ne pas activer gauges/minimap/inventaire tant que le gameplay ne les fournit pas.

Regle :

- Ne mets pas de logique gameplay dans `world.ts`.
- Ne mets pas de DOM dans `world.ts`.
- Ne mets pas de logique serveur dans le client.

## Architecture serveur

Fichiers :

```txt
apps/game-server/src/index.ts
apps/game-server/src/rooms/ReunionWorldRoom.ts
packages/shared/src/protocol.ts
```

Regles :

- Serveur authoritative.
- Le client affiche et envoie des intentions.
- Le serveur decide : position, interaction, recompense, progression.
- Tous les messages entrants sont valides avec Zod.
- Cooldowns obligatoires pour chat/actions.
- Distance interaction serveur obligatoire.

## Pipeline terrain IGN RGE ALTI

Source cible :

```txt
packages/assets/sources/lareunion/rgealti/
```

Formats :

- `.asc` supporte maintenant.
- `.tif/.tiff` prevu, mais necessite la dependency `geotiff`.

Script :

```txt
tools/build-lareunion-dem-terrain.mjs
```

Commande :

```powershell
corepack pnpm terrain:dem
```

Sorties :

```txt
apps/game-client/public/assets/terrain/lareunion/lareunion-relief-map.glb
apps/game-client/public/assets/terrain/lareunion/lareunion-relief-collision.json
apps/game-client/public/assets/terrain/lareunion/lareunion-heightfield.json
apps/game-client/public/assets/terrain/lareunion/relief-map-manifest.json
```

Fallback STL :

```txt
tools/build-lareunion-relief-map.mjs
packages/assets/sources/lareunion/LaReunion.stl
```

Regle :

- Ne pas ameliorer le STL comme source finale.
- Ne pas designer le level final sur le STL.
- Priorite : recuperer / ingerer RGE ALTI D974.

Verification terrain obligatoire :

- Piton des Neiges visible.
- Piton de la Fournaise visible.
- Cirques Mafate / Cilaos / Salazie lisibles.
- Ravines lisibles.
- Littoral ouest Saint-Paul / Saint-Gilles coherent.

## Assets

Regle centrale :

```txt
Pas d'asset sans role de zone, quete, gameplay et budget perf.
```

Avant d'ajouter un asset :

- consulter `docs/Refs` et `docs/obsidian/20-references-visuelles.md` ;
- zone cible ;
- quete liee ;
- role gameplay ;
- style ;
- source/licence ;
- budget triangles/textures ;
- collision attendue ;
- note Obsidian.

Interdit :

- props decoratifs random ;
- melange de styles ;
- assets externes sans licence ;
- asset lourd non optimise ;
- texture photo-realiste sans decision DA ;
- marques reelles sans accord.

Licence CC0 (regle figee) :

- CC0 1.0 (`https://creativecommons.org/publicdomain/zero/1.0/`) = licence par defaut acceptee pour assets externes.
- CC0 autorise : usage commercial, modification, redistribution, sans attribution obligatoire.
- CC0 ne couvre PAS : marques/logos (droit des marques), visages/personnes (droit a l'image), brevets.
- Toute autre licence (CC-BY, MIT, proprietaire) -> decision explicite avant import.
- Verifier que l'uploadeur avait le droit de poser le CC0 (asset vole re-publie CC0 = contrefacon).
- Sources fiables : Kenney, Poly Haven, OpenGameArt (licence claire).
- Tracer source + licence pour chaque asset, meme sans obligation (preuve de provenance).
- Detail : docs/obsidian/05-asset-pipeline.md.

## Obsidian

Mettre a jour :

```txt
docs/obsidian/04-decisions.md
docs/obsidian/02-backlog.md
docs/obsidian/09-direction-artistique.md
docs/obsidian/22-synthese-publique-neophyte.md
docs/obsidian/iterations/
docs/obsidian/playtests/
```

Quand :

- decision technique ;
- changement de scope ;
- bug ;
- playtest ;
- changement de pipeline terrain ;
- ajout/retrait asset ;
- modification level design.

Regle publique :

- A chaque prompt qui change le projet, ajouter une synthese datee et heuree dans `docs/obsidian/22-synthese-publique-neophyte.md`.
- Ecrire cette synthese pour un public neophyte, sans jargon inutile.
- Mentionner l'impact concret du changement, meme si l'entree est courte.
- Voir aussi `instruction.md`.

## Securite

Verifier a chaque diff :

```txt
XSS
triche client
spam chat/actions
IDOR
injection
secrets exposes
validation serveur
cooldowns
distance interaction serveur
```

Interdit :

- secrets cote client ;
- API key dans code ;
- `localStorage` pour secret ;
- `any` TypeScript sans commentaire de justification ;
- logique sensible cote client ;
- bypass lint/typecheck ;
- `git reset --hard` ;
- `push --force`.

## Validation avant fin de tache

Si tu touches client :

```powershell
corepack pnpm --filter @riw/game-client typecheck
corepack pnpm --filter @riw/game-client lint
```

Si diff non trivial :

```powershell
corepack pnpm --filter @riw/game-client build
```

Si tu touches serveur/shared :

```powershell
corepack pnpm typecheck
corepack pnpm lint
```

Si tu touches visuel :

- ouvrir Browser sur `http://localhost:5173/` ou `?mapDebug`;
- verifier screenshot ;
- verifier console ;
- mettre une note Obsidian si playtest.

## Ce qu'il ne faut pas faire

- Ne pas coder sans lire le fichier touche.
- Ne pas inventer d'API.
- Ne pas creer une nouvelle architecture.
- Ne pas remettre les anciens placeholders.
- Ne pas ajouter un package sans necessite claire.
- Ne pas telecharger des gros datasets sans demander.
- Ne pas ecraser les sources terrain.
- Ne pas supprimer les docs Obsidian.
- Ne pas ignorer La Reunion : noms, lieux, reliefs, culture locale.

## Priorites actuelles

1. Recuperer / integrer RGE ALTI D974.
2. Generer terrain DEM fiable.
3. Valider relief en `?mapDebug`.
4. Replacer plages/biomes apres terrain fiable.
5. Ensuite seulement : level design zones.
6. Ensuite seulement : assets/props/personnages par quete.
