# AGENTS.md - packages/assets

## Secteur

Sources assets, manifests, terrain, vendors.

Fichiers/dossiers pivots :

```txt
src/index.ts
sources/
vendor/
```

## Lecture obligatoire

Avant patch assets :

1. `../../CLAUDE.md`
2. `../../docs/obsidian/05-asset-pipeline.md`
3. `../../docs/obsidian/09-direction-artistique.md`
4. `../../docs/obsidian/20-references-visuelles.md`

## Regles assets

- GLB runtime uniquement.
- Pas d'asset sans zone + quete + role gameplay + budget perf.
- Pas de prop decoratif gratuit.
- Pas d'asset externe sans licence tracee.
- CC0 accepte par defaut.
- Toute autre licence => decision Obsidian avant import.
- Marques/logos/personnes reelles : interdit sans accord explicite.
- Ne pas telecharger gros dataset sans demande.
- Ne pas versionner sources IGN RGE ALTI locales.

## Terrain

Source cible : IGN RGE ALTI D974.
STL = fallback secondaire, pas base finale.

Verifier :

- Piton des Neiges lisible ;
- Fournaise lisible ;
- cirques lisibles ;
- ravines lisibles ;
- littoral ouest coherent.

## Validation

```powershell
corepack pnpm --filter @riw/assets typecheck
corepack pnpm --filter @riw/assets lint
corepack pnpm --filter @riw/assets build
```

Si generation terrain :

```powershell
corepack pnpm terrain:dem
```

Ne pas lancer si dataset absent ou si le run risque d'ecraser une source non verifiee.
