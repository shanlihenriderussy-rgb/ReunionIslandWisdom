# 2026-06-27 — Combat PvE leger : coeur serveur

Lie : [[04-decisions]] ADR-015, [[21-systeme-de-jeu]] (section Combat), [[02-backlog]].

## Contexte

- Demande Shan : commencer la logique de combat + level design.
- Decisions actees :
  - combat = override de la bible (« pas de combat ») -> PvE LEGER assume ;
  - level design = terrain d'abord.
- Audit repo : le terrain RGE ALTI est **deja fiable** (ADR-004 RESOLU 2026-06-05, ChunkStreamer ADR-005, dataset 940 Mo + GLB/chunks/collision generes). Donc « terrain d'abord » est deja satisfait ; le level design n'est plus bloque par le relief.
- `CLAUDE.md` (section « Etat actuel ») et `02-backlog.md` (P1) etaient **perimes** sur ce point (disaient encore STL/non-fiable). Backlog corrige ; CLAUDE.md a corriger par Shan (instructions projet).

## Diff

Shared `packages/shared/src/protocol.ts` :

- `attackIntentSchema`, `combatantSnapshotSchema` ;
- `playerSnapshotSchema` += `health` / `maxHealth` / `alive` ;
- `serverSnapshotSchema` += `combatants[]` ;
- `combatConfig` (HP 100, portee 4, cooldown 650 ms, degats 18, aggro 5, respawn joueur 4 s) ;
- `combatTargetDefinitionSchema` + `combatTargetCatalogSchema`.

Content :

- `packages/content/data/combat-targets.json` : 3 cibles zone `piton-de-la-fournaise`.
- `packages/content/src/index.ts` : export `combatTargets`.
- `packages/content/scripts/validate-content.ts` : validation cibles (schema + zone existante + bornes monde + unicite).

Serveur :

- `apps/game-server/src/combat/CombatSystem.ts` (nouveau) : module pur, sans Three/DOM/reseau.
  - `attack(player, targetId, now)` : portee + cooldown + degats serveur ;
  - `update(now, players)` : respawn cibles + riposte cible -> joueur a portee + events ;
  - `snapshots()` : etat cibles pour le snapshot ;
  - `forgetPlayer(id)` : reset cooldown (leave/respawn).
- `apps/game-server/src/rooms/ReunionWorldRoom.ts` :
  - import combat ; HP au spawn ; cleanup au leave ;
  - `onMessage("attack")` valide Zod -> `CombatSystem.attack` ;
  - `update()` : joueur mort gele (pas de move), tick combat, respawn joueur a `playerRespawnMs` ;
  - snapshot inclut `combatants`.

Client : non touche (slice 1 = serveur seul). Le snapshot etendu passe le parse Zod partage ; les cibles ne sont pas encore rendues.

## Tests

- Sanity logique reelle (`CombatSystem.ts` execute via Node `--experimental-strip-types`, shim `combatConfig` aux valeurs identiques, horloge simulee) : **17/17 verts**
  - hors portee rejete ; degats = 18 ; cooldown joueur ; mort cible en 3 coups ; attaque cible morte rejetee ; respawn cible HP plein ; riposte 5 + respect cooldown cible ; mort joueur + event `playerKilled` ; joueur mort ne peut attaquer.
- Integrite data cibles (pur node) : 3 cibles, 0 erreur (zone valide, dans les bornes, IDs uniques).
- `corepack pnpm typecheck` + `lint` (shared/content/server) : **a relancer sous Windows** (zod absent du sandbox -> tsc complet impossible ici, meme limite que ADR-007/014).

## Risques

- Coordination : travail parallele actif le 2026-06-27 (`GameApp.ts`, `world.ts`, iterations Mafate/dialogue non commitees). `ReunionWorldRoom.ts` est partage -> surveiller le merge. Mes edits combat sont additifs.
- Equilibrage non fait (valeurs premier jet).
- Cible attaque immediatement (lastAttackAt=0) au premier joueur a portee -> aggro instant ; OK voulu, a confirmer au ressenti.
- Le sandbox bloque `unlink` : fichier de test `_combat-sanity.mts` (racine repo) **a supprimer manuellement** ; shim `node_modules/@riw/shared` restaure par `pnpm install`.

## Suite (coeur serveur)

- Relier destruction de cible a une recompense quete.
- Equilibrage apres rendu.
- Placement cibles Fournaise verifie en `?mapDebug`.

---

# 2026-06-27 (suite) — Slice 2 : rendu client + HUD + input

## Diff

- `network/NetworkClient.ts` : `NetworkSnapshot` += `combatants[]` + `self` (HP/alive du joueur local extrait du snapshot) ; `sendAttack(targetId)`.
- `game/InputController.ts` : `attackPressed` + `pressAttack()` + `consumeAttackPressed()` + touche **F**.
- `game/collision.ts` : `sampleGround(x, z)` public (ancrage des cibles au sol terrain).
- `render/combatants.ts` (nouveau) : sync des cibles depuis `snapshot.combatants`. Mesh procedural basalte (icosaedre + cone, flatShading, emissive ember qui baisse avec les PV), barre de vie billboard (cachee si pleine/morte), apparition/disparition + dispose. Aucun GLB personnage (respect regle assets + DA Fournaise).
- `ui/hud.ts` : barre de vie combat **reelle** (valeurs serveur, vert->rouge, etat « Vaincu — reapparition... »), distincte du mock HP/Mana gate par `?hudMock`. Styles inline (coins <= 5px, ADR-012) pour ne pas toucher `styles.css` (fichier sous edition parallele). Bouton attaque tactile **F**. `setHealth` expose + alimente par `update(snapshot.self)`.
- `game/GameApp.ts` : sync cibles chaque frame (ancrage `collision.sampleGround`, billboard camera) ; `handleAttackInput` = cible vivante la plus proche dans `combatConfig.attackRange` -> `network.sendAttack` ; dispose des vues.

## Tests

- `node --check --experimental-strip-types` : 7/8 fichiers touches OK. `InputController.ts` = faux negatif (fichier sans `import` en tete -> node devine CommonJS, le strip-types ne s'applique pas) ; edits triviaux (miroir exact du pattern `interact`).
- Coherence symboles (grep) : `sendAttack`, `pressAttack`/`consumeAttackPressed`, `syncCombatants`/`disposeCombatants`, `combatConfig`, `setHealth`, `snapshot.self`/`combatants` — tous definis ET utilises.
- `corepack pnpm --filter @riw/game-client typecheck` + `lint` + capture `?mapDebug` : **a relancer sous Windows** (zod/three/tsc indisponibles dans le sandbox).

## Risques / dette

- Incoherence spawn pre-existante (ADR-013) toujours la dans le working tree : `GameApp.ts` spawn par defaut a l'**Ouest** (`?visualZone=fournaise` requis pour le volcan), alors que le serveur spawn a la Fournaise. Les cibles sont a la Fournaise -> pour les voir/attaquer en jeu, lancer avec `?visualZone=fournaise`. A reconcilier (hors scope combat).
- Bouton attaque mobile = meme style que le bouton E (modifier `--attack` sans CSS) : couleur distincte differee (styles.css).
- Pas de reconciliation position client<->serveur (netcode simple, ADR-002) : si drift, le serveur peut rejeter une attaque a la limite de portee.
- Barre de vie cible en `depthTest:false` : visible a travers le relief (choix lisibilite).

---

# 2026-06-27 (suite) — Fix : PV perdus sans raison + spawn

## Contexte (rapport Shan)

- « le perso ne cesse de perdre des PV sans raisons ».
- Diagnostic : cibles ripostaient sur TOUTE proximite (`targetAggroRange = 5`), et le serveur spawn le joueur a la Fournaise (65.9, -35) pile au milieu des cibles (~4.5 m). Vu de l'Ouest (desync spawn), degats « invisibles » donc « sans raison ».

## Diff

- `shared/protocol.ts` : `combatConfig.targetAggroDurationMs = 5000`.
- `combat/CombatSystem.ts` : **aggro sur coup**. `TargetRuntime` += `aggroPlayerId` / `aggroUntil`. `attack()` arme l'aggro sur l'attaquant. `update()` ne riposte que sur le joueur aggro, a portee (leash), pendant la fenetre ; sinon passive. Aggro purgee a mort/respawn cible, mort joueur, et `forgetPlayer` (leave/respawn). Methode `nearestInRange` supprimee.
- `game/GameApp.ts` : `getInitialSpawn()` defaut -> `FOURNAISE_SPAWN` (aligne serveur). Ouest = opt-in `?visualZone=ouest`. Label zone par defaut -> Fournaise.

## Tests

- Sanity logique reelle (module reproduit a l'identique en `/tmp`, strip-types, horloge simulee) : **20/20 verts**.
  - non-regression cle : « ZERO degat sans attaquer » ;
  - aggro mono-cible (le spectateur a portee n'est PAS touche) ;
  - expiration d'aggro -> cible repassive ;
  - + tous les cas slice 1 (portee, degats 18, cooldown, mort 3 coups, respawn, mort joueur, joueur mort ne peut attaquer).
- NB sandbox : le mount bash tronque les fichiers edites (bug ADR-014) -> test joue sur copie `/tmp` fidele. Fichiers reels (outils fichier) complets et corrects. typecheck/lint/live a relancer sous Windows.

## Effet jouable

- Plus de degats non provoques : on ne prend des coups qu'apres avoir engage une cible.
- Spawn par defaut a la Fournaise : les cibles sont la, combat testable sans `?visualZone`.

## Suite (slice 3)

- Feedback de coup (flash impact + son), recompense a la destruction, equilibrage live, couleur bouton attaque, reconciliation position client/serveur (netcode).

---

# 2026-06-27 (suite) — Sync Codex + design + decision spawn Ouest

## Sync travail parallele

- Codex (non commite) : saut `Espace` (`consumeJumpPressed`, gravite/`grounded` dans GameApp + collision relief), brume Mafate, bottom-sheet dialogue, `spawn-zone-sync`. Verifie : mon attaque (`F`) et le saut (`Espace`) cohabitent dans `InputController` ; `collision.resolveMove` a gagne un param `options` (rétro-compatible, mon `sampleGround` intact). typecheck client deja vert avec les deux.

## Design (alignement)

- Barre de vie combat reecrite sur le composant design system `.riw-gauge` (`__icon`/`__track`/`__fill`/`__num`, token `--color-health`, fill par `transform: scaleX`). Avant : styles inline ad hoc. Touche `ui/hud.ts` seulement (pas de patch `styles.css` partage). Conforme a la regle « lire 23-design-system-hud avant patch HUD » + active enfin la jauge vie (gardee inactive jusqu'a un gameplay porteur).

## Decision spawn (ADR-016)

- Choix Shan : depart par defaut = **Ouest**. Client `getInitialSpawn` defaut `WEST_BLOCKOUT_SPAWN` (Fournaise via `?visualZone=fournaise`) ; serveur `startZone` -> `saint-paul-saint-gilles`. Annule ADR-008.
- Effet combat : cibles en zone Fournaise -> **dormant** au spawn Ouest. Suite : placer des cibles Ouest (level design) ou passage de zone coherent.

## A revalider sous Windows

- `corepack pnpm --filter @riw/game-client typecheck` + `lint` (touche `hud.ts`, `GameApp.ts`).
- `corepack pnpm typecheck` (touche `ReunionWorldRoom.ts` : `startZone`).
- Changements type-safe (revert spawn = identique au type d'avant, barre = classes DOM), risque quasi nul ; a confirmer.

---

# 2026-06-27 (suite) — Cibles combat zone Ouest (combat non dormant)

## Diff

- `packages/content/data/combat-targets.json` : +3 cibles `zoneId: saint-paul-saint-gilles`, posees sur le sentier blockout, difficulte croissante :
  - `galet-roulant-1` (-74.5, 1) — PV 35, dmg 4 (intro pres du spawn) ;
  - `remous-ravine-1` (-69, -19) — PV 55, dmg 6 ;
  - `embacle-ravine-1` (-64.5, -26) — PV 80, dmg 8.
- Theme : aleas naturels cote/ravine (coherent avec les elementaires Fournaise, non caricatural).

## Validation (sandbox, pur node)

- 6 cibles, 0 erreur : zone existante, dans les bornes monde, IDs uniques.
- Projection sur `WEST_BLOCKOUT_PATH` : lateral 0.30 / 0.00 / 2.06 (<= 3.5 = sur sentier jouable).
- Distance aux colliders blockout (`WEST_BLOCKOUT_COLLIDERS`, r 1.05) : toutes > 1.55 (pas dans un obstacle).
- Spawn Ouest (-78.5, 7.5) -> galet a 7.6 m (> aggro 5) : pas d'aggro au spawn (et de toute facon aggro sur coup).
- NB : `validate-content.ts` (gouvernance) couvre zone+bornes+unicite ; a relancer sous Windows.

## Reste

- Validation visuelle `?mapDebug` (ancrage sol, pas dans l'eau/falaise).

---

# 2026-06-27 (suite) — Slice 3 : feedback + son + recompense + equilibrage

## Diff

- `shared/protocol.ts` : `targetDefeatedSchema` (targetId/name/reward) + champ `reward` (souvenir) sur `combatTargetDefinitionSchema`.
- `content/combat-targets.json` : `reward` par cible (Galet poli, Cendre tiede, ...).
- `game-server/.../ReunionWorldRoom.ts` : sur attaque `killed`, `client.send("targetDefeated", ...)` au tueur uniquement (authoritative).
- `game-client/src/audio/sfx.ts` (nouveau) : SFX procedural Web Audio (oscillateur + enveloppe). Aucun asset, aucune dependance. `resumeAudio()` sur 1er geste (autoplay). swing/hit/kill/playerHurt/playerDown.
- `render/combatants.ts` : detection deltas par vue -> flash emissive + pop d'echelle sur coup, anim de mort courte (gonfle + fade) avant masquage ; sons hit/kill.
- `network/NetworkClient.ts` : handler `targetDefeated` -> `lastDefeated` + `defeatSeq` (notif one-shot).
- `ui/hud.ts` : overlay flash rouge sur baisse de PV joueur + sons playerHurt/playerDown ; notif souvenir sur `defeatSeq`.
- `game/GameApp.ts` : `resumeAudio()` + `sfx.attack()` sur input attaque.

## Equilibrage (analyse, valeurs conservees)

attaque joueur : 18 deg / 650 ms.

| Cible | PV | Coups | TTK approx | Riposte (aggro sur coup) |
| --- | --- | --- | --- | --- |
| Galet roulant | 35 | 2 | ~0.7 s | 4 / 1.5 s |
| Souffle Enclos | 45 | 3 | ~1.3 s | 5 / 1.2 s |
| Remous ravine | 55 | 4 | ~2.0 s | 6 / 1.5 s |
| Braise errante | 60 | 4 | ~2.0 s | 6 / 1.4 s |
| Embacle ravine | 80 | 5 | ~2.6 s | 8 / 1.7 s |
| Gardien scorie | 90 | 5 | ~2.6 s | 10 / 1.8 s |

Joueur 100 PV, respawn 4 s. Sur un combat de 1-3 s, la cible riposte 1-2 fois (4-10 deg) : largement survivable -> courbe d'intro OK. Reglage fin = ressenti live (knobs `combatConfig` + data cible).

## Tests

- `node --check --experimental-strip-types` : 6/6 fichiers OK (sfx valide via wrapper ESM).
- `corepack pnpm --filter @riw/game-client typecheck` + `lint` + `corepack pnpm typecheck` (shared/content/server) : a relancer sous Windows.
- Test a l'ecran : spawn Ouest, avancer, `F` sur les cibles -> voir flash/mort, entendre les sons, recevoir le souvenir ; se faire toucher -> flash rouge + son.

## Limites

- Souvenir non stocke (inventaire serveur = backlog) : pour l'instant notification seule.
- Sons hit/kill se declenchent aussi pour les cibles frappees par d'autres joueurs a proximite (voulu : ambiance combat).
- Volume SFX fixe (gains bas). Mute/volume = futur si besoin.
