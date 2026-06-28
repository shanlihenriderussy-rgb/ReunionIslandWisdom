# Backlog

## Graphismes — voir [[25-graphismes-ameliorations]]

Synthèse priorisée complète : [[25-graphismes-ameliorations]] (audit Codex 2026-06-25).
Ordre P1 acté : (1) HUD mock caché (lève no-go audit) → (2) nappe lave + fumerolles `depthWrite:false` → (3) désactiver GLB monolithique si streamer actif.

- [x] Fix : vegetation Ouest qui flottait — pose desormais sur les heightfields de chunks (relief visible = sol joueur) au lieu de `reliefCollision`. Voir [[iterations/2026-06-27-fix-vegetation-flottante]]. (2026-06-27, signale par screenshot Shan ; a confirmer visuel)
- [x] Fix : bosquets Mafate / Maido flottants — suppression du `y` fixe, pose par heightfield de chunk. Voir [[iterations/2026-06-27-fix-bosquets-mafate-hauteur]]. (2026-06-27, reprise apres fix Claude ; a confirmer visuel)
- [x] HUD : vraie mini-carte temps reel (joueur, chemin, zones, marqueurs, cibles, autres joueurs) + journal de quete non mock. Voir [[iterations/2026-06-27-hud-minicarte-runtime]]. (2026-06-27)
- [x] Littoral : lisser les bords pixellises de l'ile — snap des sommets de rive sur l'outline OSM au build (`build-lareunion-dem-terrain.mjs`), garde-fou anti-flip. `pnpm terrain:dem`, typecheck/lint/build et runtime `?mapDebug` OK. Voir [[iterations/2026-06-28-littoral-lisse-embarcadere]]. (2026-06-28)
- [x] Embarcadere generique cote est (~(65,33)) : jetee blockout procedurale + surfaces marchables tablier/ponton. Role gameplay a definir. Voir [[iterations/2026-06-28-littoral-lisse-embarcadere]]. (2026-06-28)
- [x] Biomes restants V0 : Route Littoral, Saint-Denis, Piton des Neiges, Mafate, Salazie, Cilaos, Plaine des Palmistes, Sud Sauvage. Blockouts proceduraux + collisions/surfaces minimales. Voir [[iterations/2026-06-28-biomes-blockout-v0]]. (2026-06-28)
- [ ] Routes/sentiers entre biomes drapes sur le relief (fin des barres droites flottantes au-dessus des vallees) + surfaces marchables alignees sur le trace. Livre via la passe biomes V1 (`terrainAwarePath` / `relaxPathAgainstSlope` / `buildDrapedRibbon`). Verif `?mapDebug` a faire. Voir [[iterations/2026-06-28-biomes-propres-v1]]. (2026-06-28)

## Bugs priorises (P0-P3)

Grille et process : voir [[03-playtests]]. Detail par bug : [[_templates/bug]].

### P0 — bloquant (no-go)

- (aucun connu)

### P1 — majeur (no-go sauf contournement)

- [x] Remplacer le relief STL par un MNT fiable IGN RGE ALTI D974. (FAIT 2026-06-05, ADR-004 RESOLU + ChunkStreamer ADR-005 ; ligne laissee non cochee par erreur.)
- [ ] Audit visuel global no-go : aligner zone de depart, objectif HUD, label zone, PNJ et couches monde. Voir [[playtests/2026-06-25-audit-visuel-global]].
- [x] Fix interaction `E` : serveur authoritative realigne temporairement sur la zone Ouest, sinon il refusait les PNJ par distance. Voir [[iterations/2026-06-25-fix-interaction-e]].
- [x] Fix interaction `E` / bouton parler : fallback dialogue local si Colyseus est offline ou lent. Voir [[iterations/2026-06-26-interaction-e-fallback]].
- [x] Fix connexion online locale : `Server.listen()` Colyseus officiel + compat reservation serveur 0.17 / client JS 0.16. Voir [[iterations/2026-06-26-interaction-e-fallback]].
- [x] Mobile : reduire le panneau dialogue en bottom sheet compacte, lisible sans masquer le joueur. Voir [[iterations/2026-06-27-dialogue-mobile-bottom-sheet]].
- [ ] Migrer la progression de quete dialogue vers un etat serveur authoritative avant recompenses/inventaire.
- [ ] TEST PROD N1 : faire une passe manuelle Chrome/PWA + captures, car l'automatisation navigateur a timeout. Bloque le GO production complet. Voir [[playtests/2026-06-27-test-prod-n1]].

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
- [x] Definir le modele de donnees objets (catalogue structure `item-catalog.json` + `itemDefinitionSchema` Zod partage). Voir [[iterations/2026-06-26-equipment-item-catalog]].
- [x] Durcir `itemDefinitionSchema` : invariant inverse slot (seules categories equipables `equipement`/`instrument` -> slot != aucun ; autres -> slot `aucun`). Voir [[iterations/2026-06-27-fix-equipment-invariant-slot]].
- [ ] Ajouter inventaire serveur (etat joueur : objets possedes + equipes, Zod, authoritative).
- [ ] Relier `rewardTitle` des quetes a un id du catalogue (recompense -> objet).
- [ ] Ajouter emotes.

## Combat PvE leger — voir [[21-systeme-de-jeu]] / ADR-015

- [x] Protocole combat partage (Zod) : `attackIntent`, `combatant`, HP joueur, `combatConfig`, `combatTargetDefinition`.
- [x] Data cibles par zone (`combat-targets.json`, depart Fournaise) + validation gouvernance.
- [x] `CombatSystem` serveur authoritative : attaque (portee+cooldown+degats), riposte cible, mort/respawn. Cable dans `ReunionWorldRoom`.
- [x] Rendu client des cibles (procedural basalte + barre de vie billboard, `render/combatants.ts`). (slice 2, 2026-06-27)
- [x] Barre de vie joueur dans le HUD (reelle, valeurs serveur, distincte du mock). (slice 2)
- [x] Input attaque (touche F + bouton tactile) + envoi `attack` (cible la plus proche a portee). (slice 2)
- [x] FIX : degats non provoques (joueur perdait des PV sans agir) -> aggro sur coup (`targetAggroDurationMs`). (2026-06-27)
- [x] FIX : spawn client par defaut sur la Fournaise (aligne serveur, ADR-008/013) ; Ouest = `?visualZone=ouest`. (2026-06-27)
- [x] Feedback de coup : flash cible + anim de mort + flash joueur (deltas PV snapshot). (slice 3, 2026-06-27)
- [x] Son combat : SFX procedural Web Audio (`audio/sfx.ts`), aucun asset/dependance. (slice 3)
- [x] Recompense a la destruction : souvenir envoye serveur-authoritative (`targetDefeated`) -> notif HUD. (slice 3)
- [ ] Stocker reellement les souvenirs gagnes (depend de l'inventaire serveur).
- [ ] Equilibrage combat au ressenti (playtest live) ; ajuster `combatConfig` + data cible.
- [ ] Relier destruction de cible a une recompense quete.
- [ ] Equilibrage (HP, degats, respawn) une fois le rendu valide en live.
- [ ] Verifier praticabilite/placement des cibles Fournaise en `?mapDebug`.
- [ ] Couleur distincte du bouton attaque mobile (styles.css, differe pour limiter le clobber).
- [x] Aligner la barre de vie combat sur le design system (composant `.riw-gauge`, token `--color-health`) au lieu de styles inline. (2026-06-27)
- [x] **Combat dormant resolu** : 3 cibles intro posees en zone Ouest le long du sentier blockout (`galet-roulant-1`, `remous-ravine-1`, `embacle-ravine-1`), difficulte croissante. Sur sentier (lateral <= 2.1), hors colliders. (2026-06-27)
- [ ] Valider visuellement les cibles Ouest en `?mapDebug` (ancrage sol, pas dans l'eau/falaise) + ressenti au spawn.
- [x] `activeEvent` derive de la zone de depart reelle (`eveil-${startZone.id}`) — plus de Fournaise en depart Ouest. (2026-06-27)
- [ ] Objectif HUD : `START_QUEST_TITLE` = "Éveil de la Fournaise" encore present alors que les etapes sont Ouest (renommer le titre). Domaine HUD/objectif. Confirme au test prod N1 : serveur `activeEvent = eveil-fournaise`, HUD `START_QUEST_TITLE = Éveil de la Fournaise`.

## Tech

- [x] Ajouter pipeline DEM : RGE ALTI ASC -> heightfield JSON -> GLB terrain.
- [x] Ajouter support GeoTIFF build-time (`geotiff`) au pipeline DEM. Voir [[04-decisions]] ADR-017.
- [x] Acter projection/recentrage terrain dans les manifests générés (RGR92 / UTM40S, centre UTM, scale monde). Voir [[11-phase-0-terrain]].
- [ ] Regenerer les assets terrain publics pour inclure les nouveaux champs projection/worldMapping/lodLevels.
- [ ] Generer LOD terrain niveau 1 mobile-low + selection runtime selon distance/perf.
- [ ] Mesurer budget terrain seul : 60 fps desktop / 30 fps mobile.
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
- [x] Retirer le GLB monolithique 18 Mo : runtime non charge si streaming valide (`world.ts shouldUseChunkStreaming`, Codex) + retire du package zip (`package-web-release.ps1`). dist/dev gardent le fallback. (2026-06-27) Confirme test prod N1 : `assets/terrain/lareunion/lareunion-relief-map.glb` = 17,42 Mo dans le zip v0.1.1.
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
- [ ] Tester installation Chrome/Edge depuis le zip servi localement. Test prod N1 : zip v0.1.1 valide, mais installation Chrome non verifiee (outil navigateur timeout).
- [ ] Decider si prochaine etape = zip serveur separe ou Tauri 2 Windows.

## Bugs visuels

- [x] Fix visuel screenshots ouest : sentier adapte au devers, props inclines, vegetation moins noire, terrain chunks adoucis. Voir [[iterations/2026-06-25-west-visual-slope-shader-fix]].
- [x] Passe B1 fidelite references : lagon/shoreline visibles en vue normale, ponton, barque, cases creoles procedurales, sentier plus sable. Voir [[iterations/2026-06-25-codex-fidelite-visuelle-b1]].
- [x] P1 : choisir la zone active de build (Fournaise ou Ouest) et synchroniser spawn + objectifs + zone label + focus carte. Voir [[iterations/2026-06-27-spawn-zone-sync]].
- [ ] P1 : mettre les couches monde non actives derriere flag debug (addWestBlockout, addFournaiseBlockout, scenic, overlays).
- [ ] P1 : desactiver PNJ/minimap/gauges/hotbar mockes tant qu'ils ne sont pas portes par le gameplay.
- [x] P1 : empecher le chargement du GLB monolithique quand le terrain streame par chunks est actif. Implemente via sonde `shouldUseChunkStreaming()` dans `world.ts`. Voir [[iterations/2026-06-26-glb-monolithique-guard]].
- [ ] P2 : revalider densite vegetation, couleur noire residuelle, chemin orange et plateformes sable apres nouvelle capture.
- [ ] P2 : revalider la ressemblance B1 par capture desktop/mobile apres la passe Codex.
- [x] Rendre marchables les grandes plateformes Ouest + l'embarcadere est via surfaces rectangulaires de collision. Voir [[iterations/2026-06-28-littoral-lisse-embarcadere]]. (2026-06-28)
- [x] Refaire les biomes hors Ouest en V1 propre : inspection biome par biome, chemins drapes et ajustes au denivele, moins de props decoratifs. Voir [[iterations/2026-06-28-biomes-propres-v1]]. (2026-06-28)
- [ ] Playtest visuel de chaque biome V1 : `route-littoral`, `saint-denis`, `mafate`, `salazie`, `cilaos`, `plaine-palmistes`, `sud-sauvage`.
- [ ] Revalider en PWA / Chrome apres build hors sandbox.
- [x] Package web robuste : staging versionne pour eviter les dossiers verrouilles par serveur local.
