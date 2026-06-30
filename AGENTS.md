# AGENTS.md - Reunion Island Wisdom

## Mission

MMORPG 3D web/PWA situe a La Reunion.
Stack stricte : pnpm workspace, Vite + TypeScript + Three.js, Colyseus, Zod, Obsidian.

Priorite actuelle :

1. terrain fiable IGN RGE ALTI D974 ;
2. level design propre par zone ;
3. gameplay serveur authoritative ;
4. contenu Reunion credible.

Ne transforme pas ce repo en demo generique.

## Lecture obligatoire

Avant patch :

1. `CLAUDE.md`
2. `docs/obsidian/00-dashboard.md`
3. `docs/obsidian/09-direction-artistique.md`
4. le `AGENTS.md` le plus proche du fichier touche
5. les fichiers touches

Pour UI/HUD : lire aussi `docs/obsidian/23-design-system-hud.md`.
Pour assets : lire aussi `docs/obsidian/05-asset-pipeline.md`.
Pour serveur/gameplay : lire aussi `docs/obsidian/13-phase-2-gameplay.md`.

## Worktrees permanents

Ne pas travailler a deux dans le meme dossier.

```txt
Prod / integration locale :
C:\Users\Shan li\Documents\Reunion Island Wisdom
branch: main
etat: peut etre dirty, ne pas supposer clean

Sandbox versions / experimentations :
C:\Users\Shan li\Documents\RIW-worktrees\sandbox
branch: codex&claude/sandbox-versions
usage: upgrades, tests visuels, essais isolables
note: remote origin branche peut etre absent/gone

Iterations continues :
C:\Users\Shan li\Documents\RIW-worktrees\iterations
branch: codex&claude/iterations-permanent
usage: petites passes gameplay, content, docs, validations continues
```

Regle :

- Claude priorise analyse, direction, critique, docs Obsidian.
- Codex priorise implementation, validation, packaging, notes techniques.
- Si deux agents tournent : choisir un worktree different.
- Si un fichier est deja modifie par l'autre agent : ne pas l'ecraser. Lire le diff, puis travailler autour.

## Jalonnage parallele

Chaque passe non triviale cree une note propre :

```txt
docs/obsidian/iterations/YYYY-MM-DD-agent-sujet.md
```

Format court :

```txt
# YYYY-MM-DD HH:mm - Agent - Sujet

## Zone
## Diff
## Validation
## Risques
## Suite
```

Ne pas tenir un journal global modifie par deux agents en continu.
Utiliser une note par passe pour limiter les conflits.

## Architecture

```txt
apps/game-client   Vite + Three.js + DOM HUD
apps/game-server   Colyseus authoritative
packages/shared    protocoles, constantes, schemas Zod
packages/content   JSON zones, quetes, items, PNJ, emotes
packages/assets    sources, manifests, pipeline assets
docs/obsidian      source de verite produit/design/decisions
```

## Regles dures

- Pas de React, Next, Babylon, Unity, PlayCanvas.
- Pas de secret cote client.
- Pas de logique sensible dans le client.
- Pas de `localStorage` pour secret ou donnees sensibles.
- Pas de `any` TypeScript sans commentaire justifie.
- Pas d'asset sans zone + quete + role gameplay + budget perf + licence.
- Pas de props/personnages random.
- Pas de PNJ visibles sauf demande explicite ou gameplay valide.
- Pas de refonte sans annonce explicite.
- Pas de commit/push sans demande explicite.
- Jamais `git reset --hard`, jamais `push --force`.

## Validation

Diff content/shared/server :

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
```

Diff client :

```powershell
corepack pnpm --filter @riw/game-client typecheck
corepack pnpm --filter @riw/game-client lint
corepack pnpm --filter @riw/game-client build
```

Diff content :

```powershell
corepack pnpm validate:content
```

Si visuel : validation navigateur `http://localhost:5173/` ou `?mapDebug` quand possible.
Si impossible : dire clairement "validation statique seulement".

## Obsidian

Mettre a jour Obsidian si changement projet :

- note iteration dediee ;
- synthese publique dans `docs/obsidian/22-synthese-publique-neophyte.md` ;
- ADR/backlog seulement si decision durable.

Texte public : simple, non technique, impact concret.

## Securite a chaque diff

Verifier :

- XSS ;
- CSRF si route HTTP future ;
- IDOR ;
- SSRF ;
- injection ;
- secrets exposes ;
- triche client ;
- prompt injection si IA future ;
- validation Zod serveur ;
- cooldowns ;
- distance interaction serveur.
