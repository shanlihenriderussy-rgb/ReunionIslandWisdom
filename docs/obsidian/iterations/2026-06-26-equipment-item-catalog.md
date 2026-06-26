# 2026-06-26 22:31 — DEV equipment : catalogue d'objets structure (data serveur)

## Contexte

Cycle build quotidien, phase DEV, chantier `equipment`.
Avant : `items.json` = simple liste de 20 IDs plats, sans structure (pas de nom, type, slot, poids).
Manque une fondation data pour l'inventaire / l'equipement, cote serveur authoritative.

## Diff

- `packages/shared/src/protocol.ts`
  - `itemCategorySchema` : `consommable | equipement | ressource | cle | instrument`.
  - `equipmentSlotSchema` : `tete | corps | pieds | accessoire | main | aucun`.
  - `itemDefinitionSchema` (Zod) : `id, name, category, slot, stackable, maxStack, weight, description`.
  - `superRefine` : un `equipement` doit avoir un slot != `aucun` ; un objet non empilable doit avoir `maxStack = 1`.
  - `itemCatalogSchema = z.array(itemDefinitionSchema)`.
  - Types exportes : `ItemDefinition`, `ItemCategory`, `EquipmentSlot`.
- `packages/content/data/item-catalog.json` (nouveau)
  - 20 definitions, une par id de `items.json`.
  - Repartition : consommable 5, equipement 7, cle 5, ressource 2, instrument 1.
  - Slots : aucun 12, accessoire 3, tete 2, corps 1, pieds 1, main 1.
- `packages/content/src/index.ts`
  - Export `itemCatalog` type `ItemDefinition[]` (cast depuis le JSON).
- `packages/content/scripts/validate-content.ts`
  - Parse Zod du catalogue via `itemCatalogSchema`.
  - Integrite : tout id du catalogue existe dans `items.json` (inclusion) ; tout id de `items.json` a une definition (completude).
  - Unicite des ids du catalogue.

## Choix

- `items.json` reste le registre canonique des IDs ; le catalogue ajoute la metadata par-dessus (comme PNJ -> zones). Evite de casser les consommateurs existants de la liste plate.
- Source de verite Zod dans `@riw/shared` -> partagee client + serveur, pas de duplication.
- Aucune logique gameplay/serveur ajoutee ici : c'est la couche data. L'inventaire runtime (etat joueur, equiper/desequiper, recompenses de quete) viendra au chantier `game-logic`, cote serveur authoritative.

## Tests

- Sanity Zod sandbox (zod 4.4.3 reel) : `itemCatalogSchema.parse` OK sur les 20 objets ; integrite items<->catalogue OK ; unicite OK ; contraintes `superRefine` satisfaites.
- Typecheck isole du bloc schema (tsc 6.0.3 reel, `strict`) : 0 erreur, types `ItemDefinition`/`ItemCategory`/`EquipmentSlot` consommables.
- tsc projet complet non concluant en sandbox : le mount Linux tronque `protocol.ts` (lag de sync connu), pas une vraie erreur. A relancer sous Windows.

## Securite

- Donnees pures + validation. Pas de DOM, pas de reseau, pas de message serveur ajoute.
- Pas de nouveau `any` (casts typed dans le script de validation).
- `description` bornee a 200 caracteres ; si un jour rendue cote client, passer par `textContent` (pas d'innerHTML) — note pour le chantier game-logic.

## Risques

- Le mapping category/slot est un premier jet ; a reequilibrer quand le gameplay d'equipement existera.
- `rewardTitle` des quetes reste une string libre, non encore reliee aux ids du catalogue (futur lien quete->objet).

## Suite

- TEST (prochain run) : relancer typecheck/lint sous Windows, confirmer `validate:content`.
- Puis `game-logic` : etat inventaire joueur cote serveur (Zod), action equiper/utiliser, lien recompense de quete -> objet du catalogue.
