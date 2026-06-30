# 2026-06-29 18:10 — TEST game-logic : progression serveur-authoritative

Phase : TEST (cycle riw-build-quotidien).
Chantier : game-logic.
Feature testee : progression joueur serveur-authoritative livree en DEV le 2026-06-29 15:23
([[2026-06-29-progression-serveur-authoritative]]).

## Perimetre teste

- `packages/shared/src/protocol.ts` : `playerProgressionSchema` / `progressionUpdatedSchema`.
- `apps/game-server/src/progression/ProgressionStore.ts` : module pur.
- `apps/game-server/src/rooms/ReunionWorldRoom.ts` : cablage room.

## Methode

Sandbox `node` v22 avec le vrai `zod@4.4.3` du repo (store `.pnpm`). Logique du
`ProgressionStore` rejouee fidele a la source, integration room simulee sur les
donnees content reelles (`quests.json`, `npcs.json`, `combat-targets.json`).

## Resultats — 33/33 PASS

Schema `playerProgressionSchema` :
- vide valide, nominal valide ;
- rejets : souvenir vide, souvenir > 80, quete > 60, > 200 souvenirs, > 100 quetes,
  souvenir non-string, champ `souvenirs` manquant.

`ProgressionStore` :
- snapshot d'un joueur inconnu = `{souvenirs:[],quetes:[]}` (pas de crash) ;
- premier ajout = `true`, doublon = `false` (souvenirs ET quetes) ;
- `trim` applique, valeur trimmee stockee, souvenir blanc refuse ;
- snapshot trie ;
- plafonds respectes : 200 souvenirs / 100 quetes, le suivant refuse ;
- `forget` vide bien la progression.

Integration room (data content reelle) :
- parler au donneur `tatie-snack` => quete `premier-tour-saint-paul-saint-gilles` decouverte ;
- reparler => pas de nouvelle decouverte ;
- PNJ non-donneur (`guide-volcan`) => 0 quete ;
- vaincre `galet-roulant-1` => souvenir `Galet poli` ;
- re-tuer la meme cible => doublon ignore.

Integrite content :
- les 6 `giverNpcId` des quetes existent tous dans `npcs.json` ;
- les 6 `reward` des cibles passent la contrainte souvenir et sont UNIQUES
  (le dedup ne masque pas deux cibles distinctes) ;
- tous les `quest.id` passent la contrainte quete.

Syntaxe : `node --experimental-strip-types --check` exit 0 sur les 3 fichiers.

## Securite (re-audit)

- Message `progression` envoye en PRIVE au seul proprietaire (`client.send`), pas de
  broadcast, pas d'IDOR (clef = `client.sessionId`).
- Aucune valeur d'origine client n'entre dans la progression : rewards et quest ids
  viennent du content serveur ; le client n'envoie qu'un `targetId` valide (Zod +
  existence + distance/portee/cooldown).
- Dedup `Set` + plafonds 200/100 : anti-spam / anti-DoS memoire.
- `onLeave` -> `forget` : pas de fuite inter-session.
- Pas de `any` (un seul `as ProgressionRuntime` commente, garanti par `ensure`),
  pas de DOM ni logique client cote serveur, cooldowns/distance `interact` non regresses.

## Findings

- Mineur, non bloquant : `snapshot()` trie avec `Array.sort()` lexicographique
  non-localise. Les souvenirs accentues ("Cendre tiede", "Eclat de bois flotte")
  passent apres les lettres ASCII. Ordre deterministe mais pas naturel francais.
  -> Polish FIX : `localeCompare("fr")`.
- Futur (hors chantier game-logic) : quand le client consommera le message
  `progression`, valider l'entrant via `progressionUpdatedSchema.safeParse`
  (defense en profondeur).

## Limites d'environnement

- `corepack pnpm typecheck` / `lint` complets impossibles sur le mount Linux
  (symlinks pnpm casses). Le native `tsc@6.0.3` isole renvoie un faux parse error
  sur les fins de ligne CRLF : artefact outil, pas un defaut code (`node --check`
  passe). A relancer sous Windows.

## Suite

- FIX game-logic au prochain run : appliquer le polish `localeCompare("fr")`.
- Puis round-robin -> chantier `enemy`.
