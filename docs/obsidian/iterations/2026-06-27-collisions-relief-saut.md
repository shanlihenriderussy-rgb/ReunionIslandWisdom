# 2026-06-27 - Collisions relief et saut

## Objectif

Rendre les reliefs solides et ajouter un saut clavier avec `Espace`.

## Fichiers runtime

- `apps/game-client/src/game/InputController.ts`
- `apps/game-client/src/game/GameApp.ts`
- `apps/game-client/src/game/collision.ts`

## Logique entree

- `Espace` est intercepte hors champs texte.
- L'input est consomme une seule fois par frame via `consumeJumpPressed()`.
- Si le joueur n'est pas au sol, la demande est ignoree.

## Logique saut

- `GameApp` garde deux etats locaux :
  - `verticalVelocity`
  - `grounded`
- Quand le joueur saute :
  - `verticalVelocity = jumpVelocity`
  - `grounded = false`
- Tant que le joueur est en l'air :
  - gravite appliquee chaque frame ;
  - position `y` libre ;
  - pas de snap automatique au sol.
- A la descente :
  - si `y <= groundY + groundSnapTolerance`, le joueur est recale sur le heightfield ;
  - `verticalVelocity = 0`
  - `grounded = true`

## Logique collision relief

Source de hauteur :

1. chunks RGE ALTI charges par manifeste ;
2. collision globale `reliefCollision` ;
3. fallback `0`.

Resolution :

1. calcul d'une position cible depuis l'input ;
2. verification zone jouable ;
3. comparaison hauteur precedente / hauteur cible ;
4. refus si marche montante > `maxGroundStepUp` ;
5. refus si chute descendante > `maxGroundStepDown` ;
6. en l'air, refus si le relief cible est plus haut que la marche autorisee et que le joueur n'a pas assez de hauteur ;
7. tentative axe X seul puis axe Z seul pour conserver un glissement naturel ;
8. resolution des colliders ronds props/blockout ;
9. rollback si le push final rend la position invalide.

## Limite

Le serveur reste en intention 2D (`x`, `z`, `cameraYaw`).
Le saut est donc visible/local pour le joueur courant.
Pour rendre le saut multiplayer exact, il faudra etendre le protocole avec `y` ou un evenement `jump`.
