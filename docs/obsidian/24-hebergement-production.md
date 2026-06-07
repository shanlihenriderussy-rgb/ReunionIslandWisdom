# 24 — Hébergement & Production

> Doc maître infra. Lié à [[16-phase-5-6-prod]] [[04-decisions]] [[02-backlog]] [[00-dashboard]].
> Créé : 2026-06-07. Statut : scaffold posé, déploiement à exécuter par Shan.

## 0. Résumé en une phrase

Le jeu se découpe en **deux choses à héberger séparément** : un **client statique** (Vite + Three.js, des fichiers à servir) et un **serveur temps réel** (Colyseus, un process Node qui reste allumé pour gérer les WebSockets). On ne peut pas mettre les deux au même endroit.

## 1. Pourquoi deux hébergements

```txt
┌──────────────────────────┐         wss:// (WebSocket)        ┌───────────────────────────┐
│  CLIENT (navigateur)     │  ───────────────────────────────▶ │  SERVEUR Colyseus (Node)  │
│  Vite + Three.js (PWA)   │   matchmaking + snapshots monde    │  autoritatif, rooms        │
│  = fichiers statiques     │ ◀───────────────────────────────  │  = process qui tourne 24/7 │
│  HTML / JS / GLB / JSON   │                                    │                            │
└──────────────────────────┘                                    └───────────────────────────┘
        Cloudflare Pages                                                   Fly.io
   (CDN, gratuit, bande passante                              (machine Node toujours allumée,
    illimitée, idéal assets 3D)                                WebSocket persistant, region jnb)
```

- **Le client** = juste des fichiers. Un CDN les sert vite, partout, gratuitement. Pas de calcul serveur.
- **Le serveur** = du calcul vivant. Il garde l'état du monde en mémoire, décide des positions, valide les actions. Il doit rester allumé et accepter des connexions WebSocket longue durée.

Un hébergement « serverless » (Vercel, Netlify Functions, Cloudflare Workers classiques) **ne convient pas au serveur** : les fonctions s'arrêtent après chaque requête, donc pas de WebSocket persistant, pas d'état monde en mémoire.

## 2. Décision actée (voir ADR-007 dans [[04-decisions]])

| Brique | Hébergeur | Gratuit ? | Pourquoi |
|--------|-----------|-----------|----------|
| Client statique | **Cloudflare Pages** | Oui, bande passante illimitée | Assets 3D lourds (~59 Mo de dist), CDN mondial, build depuis Git |
| Serveur Colyseus | **Fly.io** | Oui (allowances), payant si scale | WebSocket natif, pas de cold-sleep, region **jnb** (Johannesburg) la plus proche de La Réunion |

Alternatives écartées :
- **Vercel client** : possible, mais quota bande passante 100 Go/mois — risqué avec des GLB lourds. Cloudflare = illimité. (Vercel reste un fallback valable.)
- **Render serveur** : gratuit mais la machine s'endort après 15 min d'inactivité → ~50 s de cold start → inacceptable pour du temps réel.
- **Railway** : crédit ~5 $/mois qui s'épuise vite.

## 3. Ce qui a déjà été préparé dans le repo (2026-06-07)

### Serveur (`apps/game-server/`)
- `src/index.ts` : ajout d'un **endpoint HTTP `/health`** (200 « ok ») pour les health checks Fly, et bind explicite sur `HOST`/`PORT` (`0.0.0.0:2567`). Le matchmaking Colyseus 0.16 passe par l'upgrade WebSocket, donc pas de conflit avec ce listener HTTP et **pas de CORS HTTP à gérer**.
- `package.json` : script **`start` = `tsx src/index.ts`**. `tsx` déplacé en dépendance de prod.
- `Dockerfile` : image `node:22-alpine`, install pnpm filtré (`@riw/game-server...` → serveur + `@riw/shared` + `@riw/content` seulement, pas le client), exécution via `pnpm start`.
- `fly.toml` : app `riw-game-server`, region `jnb`, port interne 2567, `force_https`, machine toujours allumée (`auto_stop_machines = false`, `min_machines_running = 1`), health check sur `/health`.
- `.dockerignore` : exclut datasets, dist, docs, assets client du contexte de build.

> **Point technique important.** `@riw/shared` et `@riw/content` exposent directement leur `src/index.ts` (pas de `dist`). Un `tsc` du serveur ne produit donc pas un `dist/` autonome exécutable par `node` (les imports workspace resteraient des `.ts` non résolus). **Solution retenue : exécuter en prod via `tsx`** (déjà utilisé en dev), qui résout les `.ts` workspace au runtime. Simple, zéro nouvelle archi. Optimisation future possible : bundler le serveur avec esbuild pour un `dist` autonome.

### Client (`apps/game-client/`)
- `.env.example` : modèle, `VITE_GAME_SERVER_URL` vide en dev (fallback `ws://localhost:2567`).
- `.env.production` : `VITE_GAME_SERVER_URL=wss://riw-game-server.fly.dev`, lu par `vite build`.
- Aucun changement de code : `NetworkClient.ts` lit déjà `import.meta.env.VITE_GAME_SERVER_URL`.

## 4. Procédure de déploiement — SERVEUR (Fly.io)

À exécuter par Shan depuis la **racine du monorepo**. Une seule fois pour l'install CLI, puis `fly deploy` à chaque mise à jour.

```powershell
# 0. Installer flyctl (une fois)
#    https://fly.io/docs/flyctl/install/  (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# 1. Se connecter / créer le compte
fly auth signup   # ou: fly auth login

# 2. Créer l'app SANS déployer (réutilise apps/game-server/fly.toml)
fly launch --no-deploy --copy-config --name riw-game-server --region jnb

# 3. Déployer (build Docker côté Fly)
fly deploy --config apps/game-server/fly.toml --dockerfile apps/game-server/Dockerfile

# 4. Vérifier
fly status
fly logs
#    Health check : https://riw-game-server.fly.dev/health  -> "ok"
```

Notes :
- Si la region `jnb` est indisponible : remplacer par `cdg` (Paris) dans `fly.toml`.
- Fly demande une CB pour vérifier l'identité même sur les allowances gratuites. Tant qu'on reste sur 1 petite machine `shared-cpu-1x` 512 Mo, le coût est nul ou symbolique.
- `min_machines_running = 1` = pas de sleep. C'est volontaire (MMO temps réel).

## 5. Procédure de déploiement — CLIENT (Cloudflare Pages)

Deux voies. La voie Git est la bonne cible (déploiement auto à chaque push).

### Voie A — Cloudflare Pages connecté à Git (recommandé)
Dans le dashboard Cloudflare → Workers & Pages → Create → Pages → connecter le repo, puis configurer :

```txt
Framework preset      : None
Build command         : corepack pnpm install --frozen-lockfile && corepack pnpm --filter @riw/game-client build
Build output directory : apps/game-client/dist
Root directory        : /              (racine du monorepo)
Variables (Production) : VITE_GAME_SERVER_URL = wss://riw-game-server.fly.dev
Node version          : 22             (variable NODE_VERSION = 22 si besoin)
```

### Voie B — Déploiement manuel via Wrangler (test rapide)
```powershell
# Build local
corepack pnpm install
corepack pnpm --filter @riw/game-client build

# Publier le dossier dist
npx wrangler pages deploy apps/game-client/dist --project-name riw-game-client
```

Vérification : ouvrir l'URL `*.pages.dev`, regarder la console réseau → la connexion doit partir en `wss://riw-game-server.fly.dev`.

## 6. Sécurité (zéro confiance)

- **Aucun secret côté client.** Tout ce qui est `VITE_*` est public. `VITE_GAME_SERVER_URL` n'est qu'une URL → OK.
- **`wss://` obligatoire en prod** (TLS). Fly termine le TLS, Cloudflare aussi. Jamais de `ws://` non chiffré en prod.
- **Le serveur reste autoritatif** : positions, interactions, distances, cooldowns validés serveur (déjà le cas dans `ReunionWorldRoom.ts`). Le client n'envoie que des intentions.
- **Validation Zod** sur tous les messages entrants (déjà en place).
- **Origin check (à ajouter plus tard)** : restreindre les connexions WS à l'origine Cloudflare via `verifyClient`/contrôle d'`Origin` côté serveur, pour limiter les clients pirates. Backlog.
- **Secrets serveur** (futur : DB Supabase, clés) → `fly secrets set CLE=valeur`, jamais dans le repo ni le Dockerfile.
- Checklist complète : voir `CLAUDE.md` section Sécurité.

## 7. Limites / risques connus

- **Asset monolithique 18 Mo** (`lareunion-relief-map.glb`) toujours dans `public/` alors que le `ChunkStreamer` utilise les chunks. Sous la limite Cloudflare (25 Mo/fichier) mais inutile → candidat à suppression du build pour alléger. (Backlog tech.)
- **Gratuit = OK pour dev / playtest / démo.** Un vrai MMO avec joueurs concurrents → passage payant côté serveur Fly (RAM/CPU/plusieurs machines). Le client restera gratuit.
- **État monde en mémoire** : un redéploiement serveur = rooms réinitialisées (joueurs déconnectés). Pas de persistance encore (Supabase prévu, backlog).
- **Une seule machine** = pas de haute dispo. Si la machine tombe, le jeu est down le temps du restart. Acceptable au stade actuel.

## 7bis. Intégration continue (CI) — `.github/workflows/ci.yml`

Posé le 2026-06-07. Sur chaque **PR** et chaque **push sur `main` / `master`** :

```txt
1. checkout
2. setup pnpm 10.12.1 + Node 22 (cache pnpm)
3. pnpm install --frozen-lockfile
4. pnpm -r typecheck
5. pnpm -r lint
6. pnpm -r build
```

- Reproduit la Definition of Done ([[00-dashboard]]).
- `concurrency` annule les runs obsolètes d'une même branche/PR.
- **Ne déploie rien lui-même** : le déploiement est géré par `deploy.yml` (section 7ter).
- Pré-requis : le repo doit être poussé sur GitHub pour que le workflow s'active.

## 7ter. Déploiement automatique — `.github/workflows/deploy.yml`

Posé le 2026-06-07. Déclenché **après un CI vert** sur `main` / `master` (`workflow_run`), donc on ne déploie jamais du code qui ne passe pas typecheck + lint + build.

Deux jobs en parallèle :

```txt
deploy-server  -> Fly.io     : flyctl deploy --remote-only (build sur les builders Fly)
deploy-client  -> Cloudflare : pnpm build client + wrangler pages deploy apps/game-client/dist
```

**Double garde de sécurité** : les jobs ne s'exécutent que si
`vars.DEPLOY_ENABLED == 'true'` **ET** le CI a réussi. Tant que la variable n'est
pas posée, les jobs sont *skippés* (pas de build rouge avant configuration).

Secrets GitHub à créer (Settings → Secrets and variables → Actions) :

| Type | Nom | Comment l'obtenir |
|------|-----|-------------------|
| Variable | `DEPLOY_ENABLED` | la mettre à `true` quand prêt à déployer |
| Secret | `FLY_API_TOKEN` | `fly tokens create deploy` |
| Secret | `CLOUDFLARE_API_TOKEN` | dashboard Cloudflare, permission **Pages: Edit** |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | dashboard Cloudflare (barre latérale) |

Pré-requis Cloudflare : le projet Pages `riw-game-client` doit exister une fois
(créé via la voie A section 5, ou `wrangler pages project create riw-game-client`).

## 9. Runbook — pousser sur GitHub et activer la chaîne

État repo au 2026-06-07 : dépôt git local, branche **`master`**, **aucun commit**, **aucun remote**. Le `.gitignore` exclut les fichiers temp (`_tmp_*`, `output/`, `Sans titre.*`, notes de date racine).

À exécuter par Shan (compte GitHub requis — ne peut pas être fait à sa place) :

```powershell
# 1. (Optionnel mais recommandé) renommer master -> main
git branch -M main

# 2. Premier commit
git add -A
git commit -m "chore: scaffold hebergement prod (Fly.io + Cloudflare) + CI/CD"

# 3. Creer le repo GitHub puis y relier le local
#    Via GitHub CLI :
gh repo create reunion-island-wisdom --private --source=. --remote=origin --push
#    OU manuellement : creer le repo sur github.com, puis :
git remote add origin https://github.com/<user>/reunion-island-wisdom.git
git push -u origin main

# -> Le workflow CI se declenche automatiquement au push.
```

Une fois le CI vert et les secrets posés (`DEPLOY_ENABLED=true` + tokens), chaque
push sur `main` déclenche CI puis déploiement automatique serveur + client.

## 8. Reste à faire (suivi)

- [ ] Exécuter le déploiement serveur Fly.io (Shan, compte requis).
- [ ] Exécuter le déploiement client Cloudflare Pages (Shan, compte requis).
- [ ] Vérifier client prod ↔ serveur prod en `wss://`.
- [x] CI : typecheck + lint + build sur PR/push main (GitHub Actions).
- [x] Job `deploy` automatique sur `main` après CI vert (`deploy.yml`, gated `DEPLOY_ENABLED`).
- [ ] Pousser le repo sur GitHub (Shan) → active CI.
- [ ] Poser secrets Fly/Cloudflare + `DEPLOY_ENABLED=true` (Shan) → active déploiement auto.
- [ ] Origin check WS côté serveur.
- [ ] Retirer le GLB monolithique du build client.
- [ ] Monitoring (logs Fly + Sentry).
- [ ] Persistance joueurs (Supabase) avant prod publique.
