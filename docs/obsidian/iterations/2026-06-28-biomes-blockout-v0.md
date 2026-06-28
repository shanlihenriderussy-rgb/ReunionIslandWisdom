# 2026-06-28 — Biomes blockout V0

## Contexte

- Demande Shan : creer le reste des biomes du jeu.
- Scope retenu : blockout procedural jouable, pas assets finaux.
- Regle DA respectee : un biome = signal lisible + collision/surface minimale quand utile.

## Diff

- `apps/game-client/src/render/biomeScenic.ts` (nouveau) :
  - Route du Littoral : route cotiere, murets basaltiques, marqueurs jaunes.
  - Saint-Denis : place creole, deux batiments, palmiers.
  - Piton des Neiges : cairn/sommet basaltique.
  - Mafate : pont de ravine + petit abri de sentier.
  - Salazie : falaise verte, cascade, ruisseau, fougeres.
  - Cilaos : bassin thermal, case, vegetation de cirque.
  - Plaine des Palmistes : corridor vert, ruisseau, fougeres.
  - Sud Sauvage : cote basaltique, eau vive, vegetation humide.
- Passe V0+ :
  - reseau de liaisons visible entre biomes :
    - Ouest -> Route du Littoral -> Saint-Denis ;
    - Saint-Denis -> Salazie -> Plaine des Palmistes -> Fournaise ;
    - Ouest -> Mafate -> Piton des Neiges -> Cilaos ;
    - Cilaos -> Sud Sauvage -> Fournaise ;
    - Salazie -> Piton des Neiges.
  - routes = bande asphalte + stripe jaune ; sentiers = bande terre + pierres de rive.
  - details par biome :
    - Route Littoral : tunnels, garde-corps.
    - Saint-Denis : marche, scene maloya/kayamb.
    - Piton des Neiges : lacets, belvedere.
    - Mafate : second pont, ilet.
    - Salazie : cascade secondaire, pont suspendu, brume.
    - Cilaos : lacets, vapeur thermale, belvedere.
    - Plaine des Palmistes : brume + boardwalk.
    - Sud Sauvage : stacks basaltiques, case, ecume/rochers.
- `apps/game-client/src/render/world.ts` :
  - `?mapDebug` reste propre et centre Ouest par defaut.
  - Les biomes V0/V0+ sont visibles uniquement avec `?visualZone=all&mapDebug`.
  - `addIslandBiomeBlockouts(scene, onColliders, onWalkableSurfaces)` branche les nouvelles couches.
- Collisions :
  - colliders simples pour batiments/rochers/abris ;
  - surfaces marchables pour route, place, pont Mafate, deck Cilaos.
  - surfaces marchables ajoutees sur les liaisons biomes.

## Tests

- `corepack pnpm typecheck` OK.
- `corepack pnpm lint` OK.
- `corepack pnpm build` OK.
- Runtime `http://localhost:5173/?mapDebug` recharge OK, canvas present, pas d'erreur console nouvelle.
- Passe V0+ : `corepack pnpm typecheck`, `lint`, `build` OK. Runtime `?visualZone=all&mapDebug` reserve a l'inspection globale.

## Risques

- Blockout encore simple : plus riche, mais pas vertical slice complet par biome.
- Surfaces/colliders approximatifs, non mesh-accurate. Rapier reste la cible pour collision fine.
- Les liaisons sont des segments droits top-down, pas encore des chemins qui epousent parfaitement chaque ravine.
- Ne pas afficher ces blockouts sur `?mapDebug` seul : c'est trop brut visuellement. Utiliser `?visualZone=all&mapDebug` pour audit technique uniquement.

## Suite

1. Playtest visuel biome par biome en `?visualZone=all&mapDebug&biomeDebug`.
2. Ajuster positions trop proches de l'eau ou trop enfouies selon captures.
3. Transformer chaque biome en vertical slice : chemin, limites naturelles, role de quete, assets definitifs.
