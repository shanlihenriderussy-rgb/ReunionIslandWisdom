# Etat du build quotidien (riw-build-quotidien)

Cycle : 1 phase par jour. DEV -> TEST -> FIX -> chantier suivant.

## Etat courant

- phase: FIX
- chantier: game-logic
- prochain_chantier: enemy

## Feature testee (resultat phase TEST 2026-06-29 18:10)

- game-logic : progression joueur serveur-authoritative (souvenirs + quetes decouvertes).
- Sandbox `node` (vrai `zod@4.4.3`) : 33/33 PASS.
  - Schema `playerProgressionSchema` : vide OK, nominal OK ; rejets OK (souvenir vide, >80, quete >60, >200 souvenirs, >100 quetes, type non-string, champ manquant).
  - `ProgressionStore` (logique rejouee fidele) : snapshot joueur inconnu = vide (pas de crash) ; premier ajout=true / doublon=false (souvenirs ET quetes) ; `trim` applique et valeur trimmee stockee ; souvenir blanc refuse ; snapshot trie ; plafonds 200 souvenirs / 100 quetes respectes ; `forget` vide bien la progression.
  - Integration room (data content reelle) : parler donneur `tatie-snack` => quete decouverte ; reparler => pas de nouvelle decouverte ; PNJ non-donneur (`guide-volcan`) => 0 quete ; vaincre `galet-roulant-1` => souvenir `Galet poli` ; re-tuer => doublon ignore.
  - Integrite content : tous les `giverNpcId` des 6 quetes existent dans `npcs.json` ; tous les `reward` des 6 cibles passent la contrainte souvenir et sont UNIQUES (le dedup ne masque pas 2 cibles distinctes) ; tous les `quest.id` passent la contrainte quete.
- `node --experimental-strip-types --check` : exit 0 sur les 3 fichiers (syntaxe OK).
- Securite : envoi `progression` PRIVE au seul proprietaire (pas de broadcast, pas d'IDOR) ; valeurs issues du content serveur (jamais d'input client) ; dedup `Set` + plafonds 200/100 (anti-spam/DoS memoire) ; `onLeave` -> `forget` (pas de fuite inter-session) ; pas de `any` (un `as ProgressionRuntime` commente, garanti par `ensure`) ; pas de DOM/logique client cote serveur ; cooldowns/distance interact non regresses.
- FINDING (mineur, non bloquant) : `snapshot()` trie avec `Array.sort()` lexicographique non-localise. Les souvenirs accentues ("Cendre tiede", "Eclat de bois flotte") sont classes apres les lettres ASCII (ordre deterministe mais pas naturel francais). Candidat polish FIX : `localeCompare("fr")`.
- NOTE (futur, hors chantier game-logic) : le client ne consomme pas encore le message `progression` ; quand il le fera, valider l'entrant via `progressionUpdatedSchema.safeParse` cote client (defense en profondeur).
- typecheck/lint projet : a relancer sous Windows (mount Linux : symlinks pnpm casses ; native `tsc@6.0.3` isole renvoie un faux parse error sur CRLF -> artefact outil, pas un defaut code).

## A corriger / polish (FIX game-logic du run suivant)

- [ ] game-logic (polish) : `ProgressionStore.snapshot()` -> trier souvenirs/quetes avec `localeCompare("fr")` pour un ordre naturel des chaines accentuees. Reste deterministe. Aucun changement de surface reseau.
- Aucun bug bloquant trouve au TEST.

## Feature testee (resultat phase TEST 2026-06-27 19:22)

- equipment : catalogue d'objets + schema Zod (`itemDefinitionSchema`/`itemCatalogSchema`).
- Logique rejouee avec le vrai `zod@4.4.3` du repo (store `.pnpm`) :
  - parse catalogue OK : 20 objets.
  - integrite items.json <-> catalogue OK (inclusion + completude).
  - unicite ids OK.
  - 4 tests negatifs rejetes correctement : equip+slot=aucun, non-empilable+maxStack=5, categorie inconnue, maxStack non entier.
- Qualite data : 7 equipements (tous slot reel, non empilables, maxStack 1, poids senses), 5 consommables, 5 cles, 2 ressources, 1 instrument. Aucun poids hors plage.
- FINDING (mineur, non bloquant) : `kayamb` (categorie `instrument`) a `slot=main`. Voulu (instrument tenu en main) mais le `superRefine` ne contraint QUE `equipement`. Categories non-equipables (`consommable`/`cle`/`monnaie`/`ressource`) pourraient recevoir un slot et passer la validation. Invariant inverse manquant.
- typecheck/lint/build projet : a relancer sous Windows (mount Linux : symlinks pnpm casses, `tsx`/`@riw/shared` non resolus). Schema inchange depuis DEV, isole-checke 0 erreur au run precedent.

## Politique de validation (sandbox)

- Le sandbox peut bloquer le `pnpm build` complet (`spawn EPERM` cote Vite / resolution Windows).
- Chaque run : typecheck/lint/logique quand possible + note explicite si build a refaire hors sandbox.
- Shan lance `corepack pnpm ... typecheck/lint/build` quand il ouvre le repo.

## Feature testee (resultat phase TEST 2026-06-07 22:11)

- level-design : `WEST_BLOCKOUT_PATH_LENGTH` (114.557) + `getNearestPathProgress`.
- Logique rejouee : depart=0, fin=1, monotone sur les 18 points, borne [0,1] OK.
- Revue statique : pas de `any`, pas de DOM, module pur. Conforme CLAUDE.md.
- typecheck/lint/build : a relancer sous Windows (sandbox ne peut pas).

## Feature testee (resultat phase TEST 2026-06-25 01:29)

- props-design : `makeFumarole` dans `apps/game-client/src/render/fournaise.ts`.
- Typecheck cible du fichier isole (vrais types `three` 0.177) : 0 erreur.
- Note env : symlinks pnpm non resolus sur le mount Linux (`vite/client`/`three` introuvables via tsc projet). tsc projet + lint a relancer sous Windows.
- Revue statique : module pur, pas de DOM, pas de reseau ajoute, pas de `any`. Non bloquant (aucun collider). Conforme CLAUDE.md.
- Geometrie verifiee : anneau fumerolles r=4.4..5.96 (RIM_RADIUS*0.72), centre cratere evite (min > RIM*0.55=3.96), pas de chevauchement avec cone central (dist 2.0) ni rebord rocheux (7.2). Ancrage sol OK via `sampleHeight`.

## Feature a corriger / polish (FIX du jour suivant) — RESOLU 2026-06-26

- [x] props-design : `depthWrite:false` deja en place sur les bouffees de vapeur (`makeFumarole`, ligne 297, materiau `MeshStandardMaterial transparent`). Polish OK.
- [x] Proximite fumerolle <-> cairn/cone : garde-fou deterministe ajoute (`FUMAROLE_MIN_CLEAR=2.2`, nudge angulaire borne a 8 essais). Verif node : min dCairn=2.55 avec seed actuel (aucun nudge declenche, 0 regression visuelle), robuste a tout futur seed. Coords objectifs centralisees en `CAIRN_POS`/`CONE_POS`.

## A corriger / polish (FIX equipment) — RESOLU 2026-06-27 19:40

- [x] equipment : invariant inverse du slot ajoute dans `itemDefinitionSchema.superRefine` (`protocol.ts`). Constante centralisee `equippableCategories = ["equipement","instrument"]`. Regle : categorie equipable -> slot != `aucun` ; categorie non equipable -> slot `aucun`. Verif zod 4.4.3 reel : catalogue actuel toujours PASS (20), `kayamb` (instrument/main) PASS, et rejets OK (consommable+slot, instrument+aucun, cle+slot). Syntaxe `as const satisfies readonly ItemCategory[]` validee tsc 6.0.3 strict (snippet isole). typecheck/lint projet a relancer sous Windows.
  - Note : pas de harness de tests unitaires dans le repo -> l'invariant est garanti par le schema (source de verite) + verifie en sandbox. Un vrai framework de tests reste un item futur potentiel.

## Bugs en attente (renseignes par TEST, corriges par FIX)

- Audit visuel global 2026-06-25 : no-go public.
- P1 resolu 2026-06-26 : depart Ouest mais objectif Fournaise ; HUD mock trop actif.
- Restent a surveiller : PNJ visibles lies au gameplay Ouest ; couches monde trop nombreuses ; risque overlap GLB monolithique/chunks.
- Detail : [[../playtests/2026-06-25-audit-visuel-global]].

## Chantiers (round-robin)

1. level-design
2. props-design
3. equipment
4. game-logic
5. enemy
6. fight-aspect
7. fight-logic
8. gaming-style

## Historique

- 2026-06-07 22:00 — DEV level-design : ajout helpers progression sentier ouest. Phase suivante : TEST.
- 2026-06-07 22:11 — TEST level-design : logique validee (0..1, monotone), aucun bug bloquant, 1 polish note. Phase suivante : FIX.
- 2026-06-15 18:53 — FIX level-design : ajout `isOnWestPath` + `WEST_BLOCKOUT_PATH_HALF_WIDTH` (seuil lateral sentier ouest). Module pur, 6/6 cas OK. Round-robin -> props-design. Phase suivante : DEV.
- 2026-06-24 17:29 — DEV props-design : ajout `makeFumarole` (vapeur volcan, 5 fumerolles seedees, non bloquant) dans `fournaise.ts`. Reecriture complete du fichier (mount Linux laggait, fichier Windows OK). Phase suivante : TEST.
- 2026-06-25 01:29 — TEST props-design : `makeFumarole` valide. Typecheck fichier isole 0 erreur (types three reels). Geometrie/ancrage OK, non bloquant. 1 polish (transparence sans depthWrite) + 1 verif mapDebug (proximite cairn). Phase suivante : FIX.
- 2026-06-26 04:18 — DEV graphismes P2 (eau) : ocean bicolore lagon/large (vertex colors `world.ts`) + houle ±0.02 m/4 s sur ecume (`updateWestWaterFx` dans `westScenic.ts`, branche `GameApp`). Sanity node OK (gradient + bornes houle). typecheck/lint/build a relancer sous Windows. Cf. [[../iterations/2026-06-26-eau-lagon-houle]].
- 2026-06-26 04:51 — DEV graphismes P2 (toits) : `weatherRoof` (vertex colors tole usee) sur cases creoles + kiosk. Prise en compte passe Codex (baseline verte). LUT color grading reportee (pas d'EffectComposer, cout mobile). Sanity node OK. typecheck/lint/build a relancer sous Windows. Cf. [[../iterations/2026-06-26-toits-weathering]].
- 2026-06-26 05:18 — DEV perf P3 (instancing) : `buildGltfInstances` (`gltf.ts`) + branchement `westVegetation.ts` -> palmiers/rochers Ouest en `InstancedMesh` (regroupes par URL). Sanity three reel : placement identique a l'ancien prop (delta 1.3e-15), reset scale OK. Decision ADR-011 (ordre perf : instancing -> audit draw calls -> code-splitting bundle -> LUT polish). Windows : typecheck OK, lint OK, build OK. FPS/draw calls a mesurer. Cf. [[../iterations/2026-06-26-instancing-vegetation]].
- 2026-06-26 07:20 — FIX props-design : `depthWrite:false` deja applique (polish OK). Ajout garde-fou clearance fumerolle/cairn/cone (`FUMAROLE_MIN_CLEAR`, nudge angulaire deterministe) + `CAIRN_POS`/`CONE_POS`. Verif node : positions identiques au seed actuel (0 regression), min dCairn 2.55. typecheck/lint/build a relancer sous Windows (mount Linux tronque le fichier + symlinks pnpm absents). Round-robin -> equipment. Phase suivante : DEV.
- 2026-06-26 08:28 — FIX graphismes Claude : objectif HUD aligne sur Saint-Paul / Saint-Gilles, inventaire mock bloque hors `?hudMock`, chemin passe en `MeshBasicMaterial` pour supprimer les entailles noires. Suite mobile : notifications au-dessus des controles tactiles, joystick/action reduits. Typecheck/lint/build OK + captures navigateur desktop/mobile OK. Cf. [[../iterations/2026-06-26-codex-correction-claude]].
- 2026-06-26 09:22 — DEV build perf : `main.ts` charge `GameApp` en import dynamique + `vite.config.ts` active code splitting Rolldown et budget runtime 950 kB. Build : shell `index` 2.44 kB, runtime `GameApp` 900.87 kB, plus de warning chunk. Typecheck/lint/build OK. Cf. [[../iterations/2026-06-26-code-splitting-runtime]].
- 2026-06-26 10:10 — TEST perf draw calls : ajout probe `?perfDebug` (`window.__RIW_PERF__`) + captures Edge headless. Gameplay Ouest : 128 calls / 194575 triangles / 143 fps median. Mobile Pixel 5 : 106 calls / 147497 triangles. Carte debug : 246 calls / 475818 triangles => prochaine cible LOD/culling carte. Cf. [[../iterations/2026-06-26-audit-perf-draw-calls]].
- 2026-06-26 10:25 — TEST executable : `corepack pnpm cook:desktop` bloque sur Windows Application Control (`@tauri-apps/cli-win32-x64-msvc` natif refuse). Fallback valide : `corepack pnpm --filter @riw/game-client build` OK + `cargo build --release` OK + smoke launch `target/release/riw.exe` 10 s OK, pas de crash. MSI/NSIS non regeneres sur cette passe.
- 2026-06-26 10:45 — DEV installation/lancement : ajout scripts Windows `launch:web`, `stop:web`, `launch:desktop`, `cook:desktop` fallback Cargo. README + contrat MCP mis a jour. Cf. [[../iterations/2026-06-26-install-launch-files]].
- 2026-06-26 05:56 — FIX bug sweep (tous types) : (1) `GameApp.resize` garde `width/height <= 0` (aspect NaN/Infinity -> projection corrompue) ; (2) `fournaise.ts` reset `lavaFx` au build (fuite/refs periimees, cohérent avec `waterFx`). Audit serveur (Zod/cooldowns/distance/sanitize) + client (XSS textContent, NetworkClient, collision, players, InputController) : sains. Windows : typecheck OK, lint OK, build OK. Cf. [[../iterations/2026-06-26-bug-sweep]].
- 2026-06-26 10:58 — FIX gameplay interaction : `E`/bouton action ouvre un dialogue local immediat via `NetworkClient.openLocalDialogue`, puis conserve `sendInteract` serveur. Typecheck OK, lint OK, build OK. Playtest Edge offline : desktop `E` OK, mobile bouton OK. Dette : dialogue mobile trop haut + progression quete encore cote HUD. Cf. [[../iterations/2026-06-26-interaction-e-fallback]].
- 2026-06-26 11:22 — FIX online interaction : serveur Colyseus repasse par `Server.listen()` officiel + health Express ; client normalise la reservation Colyseus 0.17 pour `colyseus.js@0.16`. Validation Chrome CDP : `En ligne - 6`, prompt `E Parler a Tatie Snack`, touche `E` -> dialogue `Tatie Snack`. Typecheck/lint client+serveur OK. Cf. [[../iterations/2026-06-26-interaction-e-fallback]].
- 2026-06-26 22:31 — DEV equipment : catalogue d'objets structure (`item-catalog.json`, 20 objets) + schema Zod partage `itemDefinitionSchema`/`itemCatalogSchema` (`protocol.ts`) + export `itemCatalog` + validation content (Zod + integrite + completude + unicite). Donnees pures, zero impact client/serveur runtime. Sanity Zod sandbox (zod 4.4.3 reel) : 20 objets parses, integrite/unicite OK. Typecheck isole du bloc schema (tsc 6.0.3 reel, strict) : 0 erreur. tsc projet complet bloque par troncature du mount Linux (lag connu) -> a relancer sous Windows. Round-robin reste equipment (phase TEST demain). Phase suivante : TEST. Cf. [[../iterations/2026-06-26-equipment-item-catalog]].
- 2026-06-27 19:22 — TEST equipment : catalogue + schema valides avec le vrai `zod@4.4.3`. Parse 20 objets OK, integrite items<->catalogue OK, unicite OK, 4 tests negatifs rejetes OK. Data propre (7 equipements coherents). 1 finding mineur non bloquant : invariant inverse manquant (`kayamb`/instrument a un slot ; categories non-equipables pourraient recevoir un slot). Loggé comme FIX. typecheck/lint projet a relancer sous Windows (symlinks pnpm casses). Phase suivante : FIX. Cf. [[../iterations/2026-06-27-test-equipment-catalogue]].
- 2026-06-27 19:40 — FIX equipment : invariant inverse du slot ajoute (`itemDefinitionSchema.superRefine`, `protocol.ts`) + constante `equippableCategories`. Verif zod reel : catalogue PASS (20), rejets attendus OK ; tsc 6.0.3 strict OK (snippet). 0 regression data. Securite : durcit la validation serveur, aucune surface ajoutee. Round-robin -> game-logic. Phase suivante : DEV. Cf. [[../iterations/2026-06-27-fix-equipment-invariant-slot]].
- 2026-06-29 15:23 — DEV game-logic : progression joueur serveur-authoritative. `playerProgressionSchema` (Zod, additif) + module pur `ProgressionStore` (souvenirs + quetes, dedup `Set`, snapshot trie, plafonds 200/100) + cablage room (onJoin/onLeave, decouverte quete sur `interact` PNJ donneur, souvenir sur `attack` cible vaincue, message PRIVE `progression`). Sanity Zod sandbox 13/13 PASS ; `node --strip-types --check` OK sur les 3 fichiers ; typecheck/lint projet a relancer sous Windows (symlinks pnpm casses sur mount). Securite OK (envoi au seul proprietaire, valeurs content serveur, dedup+plafonds). Debloque backlog P1 progression + stockage souvenirs combat. Round-robin reste game-logic (TEST demain). Phase suivante : TEST. Cf. [[../iterations/2026-06-29-progression-serveur-authoritative]] / ADR-020.
- 2026-06-29 18:10 — TEST game-logic : progression validee. Sandbox node (vrai `zod@4.4.3`) 33/33 PASS (schema valide/rejets, `ProgressionStore` dedup/trim/plafonds 200-100/snapshot trie/forget, integration room parler-donneur/vaincre-cible/doublon, integrite content : giverNpcId existants + rewards uniques et valides). `node --strip-types --check` OK sur les 3 fichiers. Securite re-auditee : envoi prive, valeurs content, dedup+plafonds, pas d'IDOR/any/DOM. 0 bug bloquant. 1 polish loggé (snapshot `localeCompare("fr")` pour souvenirs accentues) + 1 note futur (validation client du message `progression`). typecheck/lint projet a relancer sous Windows. Round-robin reste game-logic (FIX demain). Phase suivante : FIX. Cf. [[../iterations/2026-06-29-test-game-logic-progression]].

## Validation distribution 2026-06-25 03:19

- `corepack pnpm release:web` lance hors sandbox : typecheck OK, lint OK, build Vite OK.
- Zip genere : `output/reunion-island-wisdom-web-0.1.0-20260625-031928.zip` (25,5 Mo).
- Dette perf immediate : zip contient encore le GLB terrain monolithique 18,3 Mo.
## Fix visuel ouest 2026-06-25

- Corrections : sentier vertex-height par bord, props inclines normale terrain, vegetation GLB DoubleSide + noirs releves, chunks terrain adoucis.
- Validation : typecheck OK, lint OK.
- Build : a relancer hors sandbox (`spawn EPERM` Vite dans Codex).
## Package retry 2026-06-25 03:49

- Cause echec Shan : dossier `output/reunion-island-wisdom-web` verrouille par serveur local.
- Fix : staging versionne par release, zip plat avec `index.html` a la racine.
- Validation : `corepack pnpm package:web` OK -> `output/reunion-island-wisdom-web-0.1.0-20260625-035327.zip`.

## Validation PWA + desktop 2026-06-25 05:55

- `corepack pnpm install` : OK.
- `corepack pnpm --filter @riw/game-client typecheck` : OK.
- `corepack pnpm --filter @riw/game-client lint` : OK.
- `corepack pnpm cook:web` : OK -> `output/reunion-island-wisdom-web-0.1.0-20260625-054947.zip`.
- `corepack pnpm cook:desktop` : OK.
- Artefacts desktop :
  - `apps/game-client/src-tauri/target/release/bundle/msi/Reunion Island Wisdom_0.1.0_x64_en-US.msi` (22,82 Mo) ;
  - `apps/game-client/src-tauri/target/release/bundle/nsis/Reunion Island Wisdom_0.1.0_x64-setup.exe` (21,76 Mo).

## Update packages 2026-06-26

- `corepack pnpm update -r --latest` : OK.
- `corepack pnpm install` : OK avec `pnpm@10.12.1`.
- `corepack pnpm outdated -r` : aucun paquet restant.
- `corepack pnpm typecheck` : OK.
- `corepack pnpm lint` : OK.
- `corepack pnpm build` : OK.
- Pnpm 11 teste puis non conserve : blocage `minimumReleaseAge` sur paquets publies trop recemment.
