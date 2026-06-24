# 25 — Programme installable + pipeline MCP build/cook

Date : 2026-06-25
Statut : base posee

## Decision

Basculer Reunion Island Wisdom vers un mode **programme distribuable** :

- client web installable en PWA ;
- build statique zippable ;
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
```

Sortie :

```txt
output/reunion-island-wisdom-web-<version>-<timestamp>.zip
```

## Limites V1

- Ce n'est pas encore un `.exe` Windows.
- Le zip contient le client web statique, pas le serveur Colyseus.
- Le serveur multijoueur reste lance a part.
- `output/` reste ignore par Git.
- Le service worker cache des assets du client ; a surveiller si les GLB grossissent.

## Securite

- Aucun secret ajoute.
- Aucun appel reseau externe ajoute.
- Aucun dataset brut RGE ALTI dans le zip.
- Pas de logique serveur deplacee cote client.

## Suite

1. Valider `corepack pnpm release:web` hors sandbox si Vite bloque `spawn EPERM`.
2. Tester install PWA Chrome/Edge.
3. Ajouter un zip serveur separe ou un bundle desktop seulement apres decision.
4. Si vrai programme Windows voulu : etape suivante = Tauri 2, decision ADR dediee.
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