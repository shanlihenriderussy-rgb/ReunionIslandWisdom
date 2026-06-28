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

## Release v0.1.1 — combat (2026-06-27)

Contenu de cette version : combat PvE leger (ADR-015) + rendu cibles + barre de vie + input attaque (F) + fix « PV perdus sans raison » (aggro sur coup) + depart par defaut a la Fournaise.

Prepare cote repo (fait) :

- `package.json` racine + `apps/game-client/package.json` : version `0.1.0` -> `0.1.1`.
- `apps/game-client/public/sw.js` : `CACHE_NAME` -> `riw-app-shell-v0.1.1`. **Indispensable** : sans ce bump, Chrome resert l'ancienne PWA depuis le cache (le fetch des assets est cache-first).

A executer par Shan sous Windows (le build est PowerShell/Windows, pas executable dans le sandbox Linux) :

```powershell
# 1. (si besoin) reparer les deps + repris le lien @riw/shared ecrase pour les tests
corepack pnpm install

# 2. supprimer le fichier de test temporaire laisse par le sandbox (EPERM cote Linux)
Remove-Item -LiteralPath ".\_combat-sanity.mts" -ErrorAction SilentlyContinue

# 3. controles avant build
corepack pnpm --filter @riw/game-client typecheck
corepack pnpm --filter @riw/game-client lint
corepack pnpm typecheck   # shared + content + server (combat)

# 4. build + cook + zip web
corepack pnpm release:web
```

Sortie attendue : `output/reunion-island-wisdom-web-0.1.1-<timestamp>.zip` (index.html + sw.js v0.1.1 a la racine).

### Installer / mettre a jour la PWA via Chrome

1. Servir le client :
   - simple : `corepack pnpm launch:web` (build + serveur statique + ouvre le navigateur) ;
   - ou manuel : extraire le zip puis `python -m http.server 5173` depuis le dossier, ouvrir `http://localhost:5173`.
2. Dans Chrome : icone « Installer » dans la barre d'adresse (ou menu ⋮ -> « Installer Reunion Island Wisdom »).
3. Mise a jour d'une PWA deja installee : recharger l'onglet. Le nouveau `sw.js` (v0.1.1) s'active et purge l'ancien cache (handler `activate`). Au besoin, fermer/rouvrir l'app installee.

### Important : le combat exige le serveur

- La PWA = client seul. Les cibles et les degats viennent du serveur Colyseus (autoritaire).
- Local : `corepack pnpm dev` lance client + serveur. Sans serveur, pas de cibles ni de combat (snapshot vide).
- Prod : le client packagé parle a `VITE_GAME_SERVER_URL` (`wss://riw-game-server.fly.dev`, cf. ADR-007) ; le serveur doit etre deploye/allume.
- Depart : Fournaise par defaut (les cibles y sont). `?visualZone=ouest` pour le blockout Ouest.

### Limites / dette (inchangees)

- GLB monolithique 18 Mo encore dans le bundle (dette perf prioritaire).
- Binaire desktop non signe (hors scope Chrome PWA).
- Build non rejouable dans le sandbox (PowerShell + toolchain Windows + troncature mount ADR-014).

### Correctifs build observes sous Windows (2026-06-27)

- `packages/content` : scripts `build` / `typecheck` appelaient `pnpm validate:content` (pnpm nu absent du PATH -> `'pnpm' n'est pas reconnu`). Remplaces par `tsx scripts/validate-content.ts` directement. `corepack pnpm typecheck` passe maintenant sans `corepack enable`.
- `vite build` peut echouer `ENOTEMPTY: dist\assets` (verrou fichier : OneDrive qui synchronise `Documents`, ou serveur statique tenant `dist`). Parade : couper le serveur (`corepack pnpm stop:web`), `Remove-Item -Recurse -Force apps\game-client\dist`, mettre OneDrive en pause, puis relancer `corepack pnpm release:web`.
- Validation client confirmee : `@riw/game-client` typecheck + lint = OK (code combat propre sous tsc/eslint reels).

Typecheck serveur (latent, pre-existant, surface par `corepack pnpm typecheck`) :

- `apps/game-server/tsconfig.json` etait en `module/moduleResolution: NodeNext`, alors que toute la base monorepo est en `Bundler` (les packages exportent `src/index.ts` brut). NodeNext exigeait l'attribut `with { type: "json" }` sur les imports JSON de `@riw/content` -> TS1543 sur TOUTES les imports (pas seulement la cible combat). Fix : retirer la surcharge NodeNext, le serveur herite de la base (Bundler). Le serveur tourne via `tsx` (runtime, types ignores) -> aucun impact runtime, juste le typecheck aligne.
- `ReunionWorldRoom.ts` : `startZone` etait `Zone | undefined` (`noUncheckedIndexedAccess`) ; mes usages respawn l'ont rendu visible. Fix : garde au chargement (`if (!startZone) throw`) -> narrowing pour tout le module.
- Ces deux points ne bloquaient ni le zip (`release:web` = typecheck client seul) ni le runtime.
