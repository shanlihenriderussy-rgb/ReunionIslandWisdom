# Decisions

## ADR-001 - Jeu 3D navigateur

Date : 2026-05-29

Decision :

- Client 3D : Vite + TypeScript + Three.js.
- Serveur : Colyseus authoritative.
- UI : DOM.
- Assets : GLB.

Pourquoi :

- controle direct de la boucle jeu ;
- perf plus previsible ;
- bon fit MMORPG 3D web leger.

Consequence :

- pas de logique sensible cote client ;
- pipeline assets strict obligatoire ;
- zones instanciees pour tenir la charge.

## ADR-002 - Snapshots serveur manuels

Date : 2026-05-29

Decision :

- Broadcast `snapshot` manuel via Colyseus.
- Validation Zod sur messages entrants et snapshots cote client.

Pourquoi :

- plus robuste dans ce setup TS/tsx que le serializer schema Colyseus.
- plus facile a debugger au debut.

Consequence :

- il faudra optimiser delta/compression plus tard.

## ADR-003 - Base propre assets + relief STL

Date : 2026-05-31

Decision :

- Retirer les props placeholder du hub.
- Garder le terrain Reunion comme socle visuel.
- Utiliser `LaReunion.stl` comme source de denivele.
- Ajouter seulement des landmarks/biomes temporaires :
  - Vierge placeholder ;
  - sable ouest / sud-ouest.

Pourquoi :

- eviter de figer un mauvais level design autour d'assets generiques ;
- repartir d'une ile lisible avant de placer les quetes ;
- designer chaque prop selon zone, quete et personnage.

Consequence :

- le Car Jaune, la route, les fences et props Kenney sont retires du hub ;
- le HUD/objectif actuel reste a realigner ;
- une passe assets par niveau est necessaire avant prochaine vertical slice.

## ADR-004 - Relief : basculer du STL vers MNT officiel

Date : 2026-05-31

Decision :

- Ne pas garder `LaReunion.stl` comme source finale de relief.
- Utiliser IGN RGE ALTI D974 comme source cible.
- Garder Copernicus DEM GLO-30 / OpenTopography seulement comme fallback.

Pourquoi :

- le STL actuel donne un relief incomplet ou incorrect pour le level design ;
- La Reunion exige des ravines, cirques, pentes et littoraux lisibles ;
- un MNT officiel est plus fiable qu'un mesh STL placeholder.

Consequence :

- creer un nouveau pipeline DEM ;
- revalider les plages, la Vierge et les zones apres reprojection ;
- reporter le placement precis des assets/quetes apres terrain fiable.

Statut 2026-05-31 : RESOLU. Dataset RGE ALTI 5M ASC D974 (128 tuiles, ~940 Mo) integre ; terrain genere
(mesh global + 16 chunks + manifeste streamer `source: IGN RGE ALTI D974`). STL abandonne comme source.
Streamer runtime branche (ADR-005). Licence dataset : Licence Ouverte / Etalab 2.0 (attribution IGN
requise, distinct du CC0). Voir [[11-phase-0-terrain]] et [[05-asset-pipeline]].

## ADR-005 - Architecture systeme de jeu par zones + streaming chunks

Date : 2026-05-31

Statut : accepte ; ChunkStreamer IMPLEMENTE le 2026-06-05 (terrain RGE ALTI fiable disponible).

Decision :

- architecture cible zones + streaming chunks documentee dans [[20-systeme-jeu-zones]] ;
- couches : ZoneManager / ChunkStreamer / PlayerView / Hud ;
- streamer active uniquement sur manifeste RGE ALTI valide.

Implementation :

- `apps/game-client/src/game/ChunkStreamer.ts` : fetch `chunks/manifest.json`,
  GATE `source === "IGN RGE ALTI D974"` + `kind === "terrain-stream-manifest"`,
  retire le mesh monolithique `LaReunionReliefMap`, charge anneau radius 1 autour du joueur,
  decharge hors radius+1 (hysteresis), file `maxConcurrent` 2, dispose geometry/materials.
- Cable `GameApp` : `init()` au start, `update(playerPos)` boucle, `dispose()`.
- Collision reste globale (`lareunion-relief-collision.json` RGE ALTI) : streamer = visuel.
- Correctif 2026-06-05 : `update()` retire aussi le mesh monolithique pour eviter une course async
  avec le chargement GLB initial de `configureWorld()`.
- Correctif 2026-06-05 : en vue Carte, le streamer charge tous les chunks pour eviter une ile
  partielle avec bords rectangulaires ; en vue Jouer, il garde l'anneau autour du joueur.
- Correctif 2026-06-05 : le streamer ignore les chunks `triangles <= 0` pour eviter des artefacts
  visuels sur les zones hors ile.

Reste :

- ZoneManager / PlayerView / refactor `world.ts` en builder de zone : encore differes (1 seule zone active).
- LOD anneau exterieur basse resolution : futur.
- Validation visuelle `?mapDebug` au prochain reload.

## ADR-006 - HUD : bandeau zone + overlay debug

Date : 2026-05-31

Statut : accepte, implemente.

Decision :

- ajouter au HUD (`apps/game-client/src/ui/hud.ts`) :
  - `setZone(label)` -> bandeau zone (haut centre) ;
  - `setDebug(info|null)` -> overlay fps / zone / position, visible uniquement en vue carte.

Pourquoi :

- lisibilite zone active pour le level design ;
- diagnostic perf/position en `?mapDebug` sans console.

Consequence :

- `GameApp.updateDebugOverlay` alimente l'overlay (fps lisse sur 0.5 s) ;
- overlay rendu via `textContent` uniquement (pas d'`innerHTML`) : pas d'injection ;
- typecheck + lint client OK.

## ADR-007 - Hebergement prod : Cloudflare Pages (client) + Fly.io (serveur)

Date : 2026-06-07

Statut : accepte ; scaffold pose dans le repo, deploiement reel a executer par Shan.

Decision :

- Client statique (Vite + Three.js) -> **Cloudflare Pages**.
- Serveur Colyseus (Node, WebSocket persistant) -> **Fly.io**, region `jnb` (Johannesburg, la plus proche de La Reunion ; fallback `cdg` Paris).
- Le client parle au serveur en `wss://riw-game-server.fly.dev` via `VITE_GAME_SERVER_URL`.

Pourquoi :

- deux natures differentes : le client = fichiers statiques (CDN suffit) ; le serveur = process vivant gardant l'etat monde en memoire + connexions WS longue duree ;
- serverless (Vercel/Netlify/Workers) exclu pour le serveur : pas de WebSocket persistant ;
- Cloudflare Pages : bande passante illimitee, adapte aux GLB lourds (~59 Mo de dist), build depuis Git ;
- Fly.io : WebSocket natif, machine sans cold-sleep (`min_machines_running = 1`), region proche de l'ocean Indien ;
- Render ecarte (sleep 15 min -> cold start ~50 s, incompatible temps reel) ; Railway ecarte (credit faible).

Implementation (2026-06-07) :

- `apps/game-server/src/index.ts` : endpoint HTTP `/health` (200 "ok") + bind `HOST`/`PORT` sur `0.0.0.0:2567`. Matchmaking Colyseus 0.16 via upgrade WebSocket -> pas de CORS HTTP.
- `apps/game-server/package.json` : script `start = tsx src/index.ts`, `tsx` passe en dependance de prod.
- `apps/game-server/Dockerfile` + `.dockerignore` + `fly.toml`.
- `apps/game-client/.env.production` (`VITE_GAME_SERVER_URL=wss://...`) + `.env.example`.

Contrainte technique notable :

- `@riw/shared` et `@riw/content` exposent leur `src/index.ts` (pas de `dist`) -> un `tsc` du serveur ne donne pas un `dist` autonome runnable par `node`. Prod via `tsx` (resolution `.ts` workspace au runtime). Bundle esbuild = optimisation future.

Consequence :

- gratuit suffisant pour dev/playtest/demo ; scale serveur = payant plus tard ;
- redeploiement serveur = rooms reinitialisees (pas de persistance encore -> Supabase backlog) ;
- 1 seule machine = pas de haute dispo au depart ;
- procedure complete : voir [[24-hebergement-production]].

## ADR-008 - Zone de depart = Piton de la Fournaise

Date : 2026-06-07

Statut : accepte, implemente (V1 framing, sans nouvel asset).

Decision :

- la zone de depart du jeu devient le Piton de la Fournaise (sud-est) au lieu du littoral ouest ;
- le blockout ouest Saint-Paul / Saint-Gilles est CONSERVE comme zone 2 (rien supprime).

Pourquoi :

- demande explicite de Shan : commencer la partie sur le volcan ;
- le volcan est le point d'interet le plus iconique et lisible sur le terrain RGE ALTI ;
- permet de tester l'experience de depart sur un relief fort (cratere, cone, vue massif).

Ancrage terrain (verifie) :

- sommet Fournaise = pic sud-est du heightfield = 2610 m a world `(65.9, -37)` (UTM E365976 / N7650350, sommet reel 2632 m) ;
- mapping monde valide contre le spawn ouest existant (`x = (E-309997.5)/70000*220-110`, `z = (N-7630002.5)/65000*198-99`).

Implementation :

- `packages/content` : zone `piton-de-la-fournaise`, spawn `{65.9, 9, -35, yaw 3.14}` (rebord nord cratere Dolomieu) ;
- `apps/game-server/.../ReunionWorldRoom.ts` : `startZone` -> fournaise, `activeEvent` -> `eveil-fournaise` ;
- `apps/game-client/.../ui/hud.ts` : objectif V1 (rebord -> Enclos Fouque -> cone -> vue Piton des Neiges) + notifs + panneau quete ;
- `apps/game-client/.../world/biomes.ts` : biome `fournaise` recentre sur le sommet verifie -> bandeau de zone correct ;
- `apps/game-client/.../game/GameApp.ts` : label de zone par defaut.

Consequence :

- aucun nouvel asset 3D (respect pipeline terrain -> level design -> assets par quete) ;
- l'auto-progression de l'objectif reste inerte (liee au dialogue PNJ, non spawnes) : a brancher sur la position joueur ;
- detail level design : voir [[12-phase-1-level-design]].

## ADR-009 - Distribution programme installable : PWA + zip + MCP build/cook

Date : 2026-06-25
Statut : accepte, V1 posee

Decision :

- Ajouter une couche distribution sans changer de moteur.
- Cible V1 : PWA web installable + zip statique reproductible.
- Ajouter un contrat MCP local `mcp/riw-build-cook.mcp.json` pour cadrer Claude/Codex en pipeline build/cook/package.
- Reporter le vrai `.exe` Windows/Tauri a une decision dediee.

Pourquoi :

- Shan veut un tournant programme installable/zippable, style production engine.
- Le projet doit produire un artefact testable, pas seulement tourner en dev.
- PWA + zip respecte la stack actuelle et evite d'ajouter Rust/Tauri trop tot.

Consequence :

- `apps/game-client/index.html` reference manifest/icones.
- `sw.js` active une base offline/cache pour le client statique.
- `tools/package-web-release.ps1` cree `output/reunion-island-wisdom-web-*.zip`.
- `package.json` expose `cook:web`, `package:web`, `release:web`.
- Serveur Colyseus reste separe et authoritative.

Risques :

- Cache service worker a surveiller avec les gros GLB.
- Build Vite peut encore etre bloque par sandbox Windows (`spawn EPERM`) ; validation hors sandbox necessaire si present.

## ADR-010 - Programme desktop installable : wrapper Tauri (.msi/.exe)

Date : 2026-06-25
Statut : accepte (decision explicite Shan), scaffold pose, build Windows valide le 2026-06-25.

Decision :

- Ajouter un wrapper desktop Tauri 2 par-dessus le client web existant.
- Cible : installeurs Windows `.msi` (WiX) et `.exe` (NSIS).
- Le client reste un client web pur ; Tauri ne fait qu'embarquer le `dist` dans une WebView native.
- Le serveur Colyseus reste distant et authoritative (choix Shan : client -> serveur distant, pas de serveur embarque).

Pourquoi :

- Shan a choisi explicitement "les deux" : PWA web installable + programme desktop.
- Leve l'exception stack figee de [[CLAUDE]] (interdiction React/Next/moteur) : Tauri n'est ni un framework UI ni un moteur de jeu, c'est une coque de distribution. Decision tracee ici comme requis.
- Tauri (Rust + WebView systeme) reste leger vs Electron, coherent avec la cible mobile/web first.

Implementation :

- `apps/game-client/src-tauri/` : `Cargo.toml`, `tauri.conf.json` (v2), `src/main.rs`, `src/lib.rs`, `build.rs`, `capabilities/default.json`, `icons/` (ico + png).
- CSP Tauri : `connect-src` limite a `self` + `wss://riw-game-server.fly.dev` (TLS only) ; `script-src 'self' 'wasm-unsafe-eval'` pour le wasm Rapier.
- `apps/game-client/package.json` : scripts `tauri`, `tauri:dev`, `tauri:build` + devDep `@tauri-apps/cli`.
- racine `package.json` : `desktop:dev`, `cook:desktop`.
- `mcp/riw-build-cook.mcp.json` : phase `cook-desktop` ajoutee (requires rust + tauri-cli, platform windows).

Validation build (machine Shan, Windows) :

- `corepack pnpm install` : OK.
- `corepack pnpm --filter @riw/game-client typecheck` : OK.
- `corepack pnpm --filter @riw/game-client lint` : OK.
- `corepack pnpm cook:web` : OK.
- `corepack pnpm cook:desktop` : OK.
- Artefacts :
  - `apps/game-client/src-tauri/target/release/riw.exe` ;
  - `apps/game-client/src-tauri/target/release/bundle/msi/Reunion Island Wisdom_0.1.0_x64_en-US.msi` (22,82 Mo) ;
  - `apps/game-client/src-tauri/target/release/bundle/nsis/Reunion Island Wisdom_0.1.0_x64-setup.exe` (21,76 Mo).

Consequence :

- 1 seule base de code client pour 3 sorties : web hebergeable, PWA installable, desktop `.msi/.exe`.
- Le `target/` Rust est ignore (gitignore src-tauri) ; ne pas committer les binaires.
- Signature de code Windows non couverte (SmartScreen affichera un avertissement) : decision signature reportee.
- A faire ensuite : sortir le GLB 18 Mo du bundle (poids installeur), tester WebView2 au premier lancement.

Update 2026-06-26 :

- `corepack pnpm cook:desktop` pointe maintenant vers `tools/build-desktop-release.ps1`.
- Si le binding natif `@tauri-apps/cli-win32-x64-msvc` est bloque par Windows Application Control, le script bascule sur `cargo build --release`.
- Ce fallback produit `apps/game-client/src-tauri/target/release/riw.exe`.
- Limite : MSI/NSIS ne sont regeneres que si Tauri CLI complet passe.

## ADR-011 - Perf rendu Ouest : InstancedMesh + ordre des chantiers perf

Date : 2026-06-26
Statut : accepte (decision explicite Shan), instancing implemente, validation runtime sous Windows a faire.

Decision :

- Vegetation Ouest (palmiers/rochers) rendue en `InstancedMesh` : 1 GLB -> N instances,
  regroupees par URL, au lieu de N props = N sous-arbres = N draw calls.
- Ordre acte des chantiers perf :
  1. Instancing palmiers/rochers Ouest (ce ADR).
  2. Audit perf draw calls.
  3. Code-splitting bundle (Vite/Rolldown ; lazy-load Rapier/Colyseus/Tauri non concernes runtime ; separer `mapDebug` du runtime public).
  4. LUT color grading : seulement en polish DA, apres stabilisation camera + biomes + materiaux.

Pourquoi :

- Shan precise : l'instancing corrige FPS mobile, draw calls, densite palmiers/rochers,
  stabilite rendu Ouest. Il NE corrige PAS le warning `bundle > 500 kB` (chantier 3 distinct).
- LUT reportee : trop tot risquerait de masquer les vrais problemes de lumiere, contraste
  et lisibilite terrain. A traiter en dernier (polish), pas maintenant.

Implementation :

- `render/gltf.ts` : `buildGltfInstances(url, specs, options)` — charge le GLB une fois,
  applique `materialMode`, rejoue `normalizeModel` sur un template unique pour calculer
  les matrices par feuille, retourne 1 `InstancedMesh` par mesh unique. `computeBoundingSphere`
  pour un culling correct. Aucune duplication des maths de placement.
- `render/westVegetation.ts` : candidats acceptes regroupes par URL (`specsByUrl`),
  `instanceSpecFor` remplace `createProp`. Colliders inchanges (donnees, pas de draw call).

Validation (sanity three reel, sandbox) :

- Position monde instance vs ancien prop : delta 1.3e-15 (identique).
- Reset `scale=1` entre instances : scales `[1.5, 0.75, 3.0]` == modeles neufs (pas de derive).
- typecheck/lint/build/FPS reels : a relancer sous Windows. Cf. [[iterations/2026-06-26-instancing-vegetation]].

Consequence :

- Moins de draw calls cote Ouest ; materiaux/geometries partages entre instances.
- Limite : pas d'animation par-instance (vegetation statique, OK). Si besoin futur de
  vent par-prop, prevoir shader d'instance ou retour cible a des meshes individuels.

## ADR-012 - HUD : rayons carres (0-5 px), direction « bois grave tropical »

Date : 2026-06-26
Statut : accepte (demande explicite Shan), implemente CSS, validation runtime sous Windows a faire.

Decision :

- Tous les rayons de l'UI HUD passent en coins nets : 0 a 5 px max. Plus de pilule (999px), plus de rond (50%).
- Direction tonale : moins « app moderne lisse », plus tampon/tiki/affiche serigraphiee, lecture bois grave tropical.
- Geometrie pilotee par tokens centraux dans `design-tokens.css` (et copie `docs/design-system/hud/tokens.css`).

Pourquoi :

- demande explicite de Shan : rectangulaire, rayon 0 ou 5 max, ton plus tropical / moins moderne / plus original ;
- le HUD actuel etait tres arrondi (r-lg 18, r-xl 26, pilule, disques) = signature trop generique « app » ;
- carrer les coins + garder contours epais et ombres « lip » = lecture artisanale (bois grave / tampon), coherente avec la DA tropicale.

Implementation :

- `apps/game-client/src/design-tokens.css` section 6 RAYONS :
  `--r-sm:0 / --r-md:3 / --r-lg:5 / --r-xl:5 / --r-2xl:5 / --r-pill:5 / --r-disc:5` + nouveau `--r-dot:2` (points/indicateurs).
- `apps/game-client/src/styles.css` et `apps/game-client/src/components.css` : remplacement des rayons en dur hors-cible
  (`50%`, `999px`, `6px`, `8px`, coin asymetrique chat `... 4px`) par les tokens ≤ 5 ou `--r-dot`.
- Copies design-system synchronisees : `docs/design-system/hud/tokens.css` + `docs/design-system/hud/components.css`.
- Aucun changement de couleur, police, layout, contour ou ombre : seul le rayon bouge.

Verification :

- grep de controle : zero `border-radius` > 5 px, zero `50%`, zero `999px` dans les CSS (src + docs) ;
- equilibre des accolades CSS OK ;
- typecheck/lint/build client + capture `?mapDebug` : a relancer sous Windows.

Consequence :

- HUD plus blocky / grave, moins « moderne » ; pastilles d'etat et points deviennent de petits carres (2 px) ;
- minimap, avatar, boutons ronds, joystick, bouton action : carres a coin doux (5 px) — ces composants restent non actifs tant que le gameplay ne les porte pas ;
- direction reversible (tout passe par les tokens). Prochain levier tonal possible si Shan valide : durcir le contour ou ajouter une trame bois/serigraphie sur les panneaux.
- Detail : [[23-design-system-hud]].

Update 2026-06-26 (levier tonal applique) :

- Ajout d'une trame serigraphie / tapa sur le primitif panneau basalte : token `--hud-weave`
  (double `repeating-linear-gradient` croise, faible opacite) pose en couche de fond de `.riw-panel`
  via `background: var(--hud-weave), var(--hud-panel)`.
- Touche les panneaux basalte live (carte joueur, objectif, quete, info). Les panneaux bois (`.riw-wood`,
  dialogue/inventaire) gardent leur grain existant.
- Behind-content (couche `background`, pas de pseudo-element) : zero impact lisibilite/layout, `backdrop-filter` conserve.
- Reversible : retirer `var(--hud-weave)` du background ou vider le token.

Update 2026-06-26 (trame v2 + lisibilite plein soleil) :

- Trame montee d'un cran : opacites 4%/12% -> 8%/22%, pas 6px -> 5px (plus visible sans bruit).
- Panneaux basalte solidifies pour la lecture plein soleil : `--hud-panel` 82% -> 90% (`rgb(24 22 20 / 90%)`),
  `--hud-panel-raise` 86% -> 90%. Effet « verre » reduit = plus carved, plus lisible sur scene claire (plage Ouest).
- Verifie en live (`pnpm dev`, localhost:5173) : panneau objectif nettement plus lisible, coins carres confirmes, multijoueur OK.
- Filet de securite : `typecheck` + `lint` client = verts (CSS only, aucune regression TS/ESLint).

## ADR-013 - Depart Fournaise active + objectif auto-progressif par position

Date : 2026-06-26
Statut : accepte (cadrage explicite Shan), implemente, valide en live (`pnpm dev`).

Contexte :

- ADR-008 declarait la Fournaise zone de depart, mais le code spawnait encore a l'Ouest :
  serveur `startZone = saint-paul-saint-gilles`, et client `cameraPivot` initialise sur
  `WEST_BLOCKOUT_SPAWN`. L'objectif HUD etait west-code et inerte (declenche par PNJ non spawnes).

Decision (cadrage Shan) :

- Depart : basculer reellement sur la Fournaise.
- Habillage : procedural basalte/scories/fumee (deja present dans `render/fournaise.ts`) — DA actee.
- Boucle : objectif observation auto-progressif par position, sans PNJ.

Implementation :

- Serveur `ReunionWorldRoom.ts` : `startZone` -> `piton-de-la-fournaise`, `activeEvent` -> `eveil-fournaise`.
- `render/fournaise.ts` : export `FOURNAISE_SPAWN` (= zone content) + `FOURNAISE_OBJECTIVE_POINTS`
  (rebord 65.9/-35, cone 65.9/-37, repere PdN 63/-33) en source unique.
- `GameApp.ts` : spawn local sur `FOURNAISE_SPAWN` (au lieu de WEST), label zone par defaut Fournaise,
  nouvelle methode `updateFournaiseObjective()` appelee chaque frame : proximite joueur -> `hud.setObjectiveStage`.
  `WEST_BLOCKOUT_SPAWN` conserve : encore utilise par la camera map-debug (L262-264).
- `ui/hud.ts` : 3 etapes Fournaise (rebord Dolomieu -> Enclos/cone -> repere Piton des Neiges),
  notifications + titre quete (`Eveil de la Fournaise`) + corps quete reecrits, expose `setObjectiveStage` sur le controller.
  `setObjectiveStage` reste monotone (pas de regression d'etat).

Validation :

- Live : spawn sur le volcan confirme, bandeau « Piton de la Fournaise », etapes 1+2 auto-cochees au spawn
  (rebord = spawn, cone a ~2 m), etape 3 a la marche vers le repere. Multijoueur OK.
- `typecheck` client + racine (assets/content/shared/server/client) = verts. `lint` client = vert.

Dette / suite :

- Spawn (65.9, 9, -35) : `snapToGround` est applique avant le chargement async de la collision. A surveiller
  (cf. meme classe de bug que le spawn Ouest sous l'eau). Au test live le rendu est sain, mais valider au reload a froid.
- Etapes 1+2 quasi instantanees (reperes a < 3 m du spawn) : si on veut une vraie traversee, espacer les reperes.
- Camera map-debug focalise encore l'Ouest (`WEST_BLOCKOUT_SPAWN`) : a recentrer sur le joueur plus tard.
- Detail level design : [[12-phase-1-level-design]].

> ATTENTION COORDINATION (2026-06-26) : un agent Codex editait le repo en parallele dans la direction
> INVERSE (garder le depart Ouest, corriger le spawn Ouest sous l'eau, reajuster l'objectif Tatie).
> Risque de clobber mutuel sur `ReunionWorldRoom.ts`, `GameApp.ts`, `hud.ts`. Choisir UNE direction avant de continuer.
