# 25 — Programme installable + pipeline MCP build/cook

Date : 2026-06-25
Statut : base posee + web/desktop valides

## Decision

Basculer Reunion Island Wisdom vers un mode **programme distribuable** :

- client web installable en PWA ;
- build statique zippable ;
- programme desktop Windows via Tauri 2 ;
- pipeline `build / cook / package` explicite ;
- contrat MCP local pour cadrer les agents Claude + Codex comme une chaine de production.

Ce n'est pas un changement de moteur.
Le moteur reste : Vite + TypeScript + Three.js + Colyseus.

## Pourquoi

Objectif : arreter de traiter le projet comme une simple demo dev.
On veut un artefact livrable, testable, transmissible.

Mode vise : inspiration Unreal Engine :

- `build` = compiler ;
- `cook` = preparer les fichiers distribuables ;
- `package` = produire un zip installable/testable ;
- `outliner / backlog / phases` = suivi projet ;
- MCP = contrat local pour agents qui executent sans inventer le pipeline.

## Implementation V1

Fichiers :

- `apps/game-client/index.html` : liens manifest, icones, theme-color.
- `apps/game-client/src/main.ts` : enregistrement du service worker en production.
- `apps/game-client/public/sw.js` : cache app shell + assets statiques same-origin.
- `apps/game-client/public/manifest.webmanifest` : manifeste PWA.
- `tools/package-web-release.ps1` : build optionnel + verification + zip.
- `mcp/riw-build-cook.mcp.json` : contrat MCP local build/cook/package.
- `README.md` : commandes release.

Commandes :

```powershell
corepack pnpm release:web
corepack pnpm cook:web
corepack pnpm package:web
corepack pnpm cook:desktop
```

Sortie :

```txt
output/reunion-island-wisdom-web-<version>-<timestamp>.zip
apps/game-client/src-tauri/target/release/bundle/msi/Reunion Island Wisdom_<version>_x64_en-US.msi
apps/game-client/src-tauri/target/release/bundle/nsis/Reunion Island Wisdom_<version>_x64-setup.exe
```

## Limites V1

- Le `.exe`/`.msi` Windows existent, mais ne sont pas signes.
- Le zip contient le client web statique, pas le serveur Colyseus.
- Le serveur multijoueur reste lance a part.
- `output/` reste ignore par Git.
- `src-tauri/target/` reste ignore par Git.
- Le service worker cache des assets du client ; a surveiller si les GLB grossissent.

## Securite

- Aucun secret ajoute.
- Aucun appel reseau externe ajoute.
- Aucun dataset brut RGE ALTI dans le zip.
- Pas de logique serveur deplacee cote client.

## Suite

1. Tester install PWA Chrome/Edge.
2. Installer le MSI/EXE Tauri sur Windows et verifier le premier lancement.
3. Sortir le GLB monolithique 18 Mo du client.
4. Ajouter un zip serveur separe seulement apres decision.
## Validation 2026-06-25 03:19

Commande lancee hors sandbox Codex :

```powershell
corepack pnpm release:web
```

Resultat :

- typecheck client : OK ;
- lint client : OK ;
- build Vite : OK, 91 modules transformes ;
- zip genere : `output/reunion-island-wisdom-web-0.1.0-20260625-031928.zip` ;
- taille zip : 25,5 Mo.

Point perf observe :

- le zip contient encore `assets/terrain/lareunion/lareunion-relief-map.glb` (~18,3 Mo) en plus des chunks terrain ;
- dette prioritaire : retirer ce GLB monolithique du build client quand le streamer RGE ALTI est suffisant.
## Correctif package 2026-06-25 03:49

Probleme :

- `release:web` echouait si `output/reunion-island-wisdom-web` etait servi par `python -m http.server`.
- Windows verrouille le dossier courant du serveur local, donc `Remove-Item` ne pouvait pas le supprimer.

Correction :

- Le script cree un dossier staging versionne : `output/reunion-island-wisdom-web-<version>-<timestamp>`.
- Le zip porte le meme nom, mais contient maintenant `index.html` directement a la racine pour eviter le piege du dossier imbrique.
- Le dossier stable `output/reunion-island-wisdom-web` n'est plus ecrase.

Validation :

- `corepack pnpm package:web` : OK.
- Zip genere : `output/reunion-island-wisdom-web-0.1.0-20260625-035327.zip`.
## Validation flat zip 2026-06-25 03:53

- `corepack pnpm package:web` : OK.
- Zip genere : `output/reunion-island-wisdom-web-0.1.0-20260625-035327.zip`.
- Verification archive : `index.html`, `manifest.webmanifest`, `sw.js`, `README_INSTALL.txt` sont a la racine du zip.
- Effet : si Shan extrait le zip dans `output/test-riw` puis lance `python -m http.server 5173` depuis ce dossier, le navigateur charge le jeu au lieu d'afficher un directory listing.

## Validation desktop 2026-06-25 05:55

Commandes lancees :

```powershell
corepack pnpm install
corepack pnpm --filter @riw/game-client typecheck
corepack pnpm --filter @riw/game-client lint
corepack pnpm cook:web
corepack pnpm cook:desktop
```

Resultat :

- install pnpm : OK ;
- typecheck client : OK ;
- lint client : OK ;
- cook web : OK ;
- cook desktop Tauri : OK ;
- app release : `apps/game-client/src-tauri/target/release/riw.exe` ;
- MSI : `apps/game-client/src-tauri/target/release/bundle/msi/Reunion Island Wisdom_0.1.0_x64_en-US.msi` (22,82 Mo) ;
- setup EXE : `apps/game-client/src-tauri/target/release/bundle/nsis/Reunion Island Wisdom_0.1.0_x64-setup.exe` (21,76 Mo).

Warnings :

- chunk JS Vite > 500 kB ;
- binaire non signe -> SmartScreen probable ;
- GLB monolithique encore present dans le bundle.
