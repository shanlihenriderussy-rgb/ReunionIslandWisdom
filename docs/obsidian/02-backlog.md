# Backlog

## Graphismes — voir [[25-graphismes-ameliorations]]

Synthèse priorisée complète : [[25-graphismes-ameliorations]] (audit Codex 2026-06-25).
Ordre P1 acté : (1) HUD mock caché (lève no-go audit) → (2) nappe lave + fumerolles `depthWrite:false` → (3) désactiver GLB monolithique si streamer actif.

## Bugs priorises (P0-P3)

Grille et process : voir [[03-playtests]]. Detail par bug : [[_templates/bug]].

### P0 — bloquant (no-go)

- (aucun connu)

### P1 — majeur (no-go sauf contournement)

- [ ] Remplacer le relief STL par un MNT fiable IGN RGE ALTI D974.
- [ ] Audit visuel global no-go : aligner zone de depart, objectif HUD, label zone, PNJ et couches monde. Voir [[playtests/2026-06-25-audit-visuel-global]].
- [x] Fix interaction `E` : serveur authoritative realigne temporairement sur la zone Ouest, sinon il refusait les PNJ par distance. Voir [[iterations/2026-06-25-fix-interaction-e]].
- [x] Fix interaction `E` / bouton parler : fallback dialogue local si Colyseus est offline ou lent. Voir [[iterations/2026-06-26-interaction-e-fallback]].
- [x] Fix connexion online locale : `Server.listen()` Colyseus officiel + compat reservation serveur 0.17 / client JS 0.16. Voir [[iterations/2026-06-26-interaction-e-fallback]].
- [ ] Mobile : reduire le panneau dialogue en bottom sheet compacte, lisible sans masquer le joueur.
- [ ] Migrer la progression de quete dialogue vers un etat serveur authoritative avant recompenses/inventaire.

### P2 — mineur (go possible)

- [x] Realigner le HUD/objectif : depart sur Tatie Snack, puis parcours Saint-Paul / Saint-Gilles sans dependance a l'ancien placeholder route/bus.

### P3 — cosmetique / confort

- [ ] level-design : ajouter un seuil "sur le sentier" (`isOnWestPath` via `lateral`) pour gater l'affichage du lieu courant — sinon `normalized` reste dans [0,1] meme loin du chemin. (FIX a venir, cf. iterations/2026-06-07-test-progression-sentier-ouest)

## Zone Fournaise (depart) — voir [[12-phase-1-level-design]] / ADR-008

- [x] Faire du Piton de la Fournaise la zone de depart (spawn rebord cratere world 65.9/-37, verifie RGE ALTI).
- [x] Objectif HUD V1 volcan (rebord Dolomieu -> Enclos Fouque -> cone -> vue Piton des Neiges).
- [ ] Brancher l'auto-progression de l'objectif sur la position joueur (proximite rebord / cone).
- [x] Materialiser les marqueurs de zone : props procéduraux basalte/scories + 3 repères objectif (`render/fournaise.ts`).
- [ ] Verifier praticabilite des pentes du cone en `?mapDebug` + au spawn.
- [ ] Instancing rochers Fournaise si besoin perf mobile.
- [x] Fumerolles low-poly statiques (`makeFumarole`, 5 seedees, vapeur translucide) — livre 2026-06-24, cf. iterations/2026-06-24-fournaise-fumerolles. Version particules animees reste optionnelle (decision DA avant).
- [x] Fumerolles `depthWrite:false` + garde-fou clearance cairn/cone (`FUMAROLE_MIN_CLEAR`) — livre 2026-06-26, cf. iterations/2026-06-26-fix-fumerolle-clearance.
- [ ] TEST : verifier fumerolles en `?mapDebug` (ancrage sol, opacite, pas de chevauchement marqueurs) — controle visuel restant apres build Windows.

## Gameplay

- [ ] Implementer `PlayerView` logique invisible.
- [ ] Ajouter objectif court sans PNJ pour tester la boucle exploration.
- [ ] Ajouter interaction serveur generique `inspect`.
- [ ] Ajouter premier event serveur `bouchon-route-littoral`.
- [x] Ajouter interaction PNJ avec touche `E`.
- [ ] Varier les verbes d'interaction par cible : parler, inspecter, observer, ramasser.
- [ ] Ajouter un feedback "hors ligne - progression non sauvegardee" quand un dialogue local s'ouvre sans serveur.
- [ ] Ajouter un choix simple dans le premier dialogue avant validation objectif.
- [ ] Ajouter quete "Bouchon Route du Littoral".
- [ ] Ajouter inventaire serveur.
- [ ] Ajouter emotes.

## Tech

- [ ] Ajouter pipeline DEM : RGE ALTI ASC/GeoTIFF -> heightfield JSON -> GLB terrain.
- [ ] Ajouter Rapier pour collisions.
- [ ] Ajouter interpolation reseau plus propre.
- [ ] Ajouter Supabase Auth.
- [ ] Ajouter sauvegarde joueur.
- [ ] Ajouter Sentry.

## Infra / Prod

Detail complet : [[24-hebergement-production]]. Decision : [[04-decisions]] ADR-007.

- [x] Acter archi hebergement : Cloudflare Pages (client) + Fly.io (serveur).
- [x] Scaffold serveur Fly.io : `Dockerfile`, `fly.toml`, `.dockerignore`, `/health`, `start` (tsx).
- [x] Scaffold client : `.env.production` + `.env.example` (`VITE_GAME_SERVER_URL`).
- [ ] Deployer serveur Fly.io (compte Shan requis).
- [ ] Deployer client Cloudflare Pages (compte Shan requis).
- [ ] Verifier client prod <-> serveur prod en `wss://`.
- [x] CI GitHub Actions : typecheck + lint + build sur PR/push main (`.github/workflows/ci.yml`).
- [x] CD GitHub Actions : deploy auto Fly + Cloudflare apres CI vert (`deploy.yml`, gated `DEPLOY_ENABLED`).
- [ ] Pousser le repo sur GitHub (compte Shan) -> active CI ; branche `master` -> `main`.
- [ ] Poser secrets `FLY_API_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` + var `DEPLOY_ENABLED=true`.
- [ ] Origin check WS cote serveur (anti-clients pirates).
- [ ] Retirer le GLB monolithique 18 Mo du build client.
- [ ] Monitoring : logs Fly + Sentry.

## Contenu Reunion

- [ ] Relire [[../world/bible-reunion|Bible Reunion]].
- [ ] Remplir [[../world/memes-valides|memes valides]].
- [ ] Ajouter lexique creole.
- [ ] Valider references avec 3 testeurs locaux.

## Assets

- [ ] Definir matrice assets par zone / quete / personnage.
- [ ] Designer GLB final de la Vierge.
- [ ] Remplacer plages procedurales par meshes propres sur Saint-Paul / Saint-Gilles.
- [ ] Definir style low-poly.
- [ ] Creer avatar capsule V1.
- [ ] Creer 5 props Reunion.
- [ ] Definir budgets GLB.

## Programme installable

- [x] Brancher manifest PWA + icones dans `index.html`.
- [x] Ajouter service worker client statique.
- [x] Ajouter script zip `tools/package-web-release.ps1`.
- [x] Ajouter contrat MCP local `mcp/riw-build-cook.mcp.json`.
- [x] Valider `corepack pnpm release:web` hors sandbox : zip OK `output/reunion-island-wisdom-web-0.1.0-20260625-031928.zip`.
- [ ] Tester installation Chrome/Edge depuis le zip servi localement.
- [ ] Decider si prochaine etape = zip serveur separe ou Tauri 2 Windows.

## Bugs visuels

- [x] Fix visuel screenshots ouest : sentier adapte au devers, props inclines, vegetation moins noire, terrain chunks adoucis. Voir [[iterations/2026-06-25-west-visual-slope-shader-fix]].
- [x] Passe B1 fidelite references : lagon/shoreline visibles en vue normale, ponton, barque, cases creoles procedurales, sentier plus sable. Voir [[iterations/2026-06-25-codex-fidelite-visuelle-b1]].
- [ ] P1 : choisir la zone active de build (Fournaise ou Ouest) et synchroniser spawn + objectifs + zone label + focus carte.
- [ ] P1 : mettre les couches monde non actives derriere flag debug (addWestBlockout, addFournaiseBlockout, scenic, overlays).
- [ ] P1 : desactiver PNJ/minimap/gauges/hotbar mockes tant qu'ils ne sont pas portes par le gameplay.
- [ ] P1 : empecher le chargement du GLB monolithique quand le terrain streame par chunks est actif.
- [ ] P2 : revalider densite vegetation, couleur noire residuelle, chemin orange et plateformes sable apres nouvelle capture.
- [ ] P2 : revalider la ressemblance B1 par capture desktop/mobile apres la passe Codex.
- [ ] Revalider en PWA / Chrome apres build hors sandbox.
- [x] Package web robuste : staging versionne pour eviter les dossiers verrouilles par serveur local.
