# 13 — Phase 2 : Gameplay cœur

> Lié à [[10-build-plan]] [[07-gameplay-systems]] [[12-phase-1-level-design]].
> Statut : BLOQUÉ par Phase 1.

## Objectif

Boucle jouable minimale : se déplacer, observer, interagir, recevoir une quête, progresser. Serveur authoritative.

## Systèmes (client = intention, serveur = décision)

| Système | Client | Serveur |
|---------|--------|---------|
| Déplacement | input + prédiction visuelle | position validée, anti-triche |
| Caméra | follow + zoom (slider HUD existant) | — |
| Interaction | viser cible + envoyer intent | distance + cooldown + résultat |
| Quête | afficher état | progression + récompense |
| Chat | saisie | cooldown + filtrage + diffusion |
| Inventaire | affichage | source de vérité items |

## Tâches

- [ ] Contrôleur déplacement sur heightfield (`InputController.ts` + `collision.ts`).
- [ ] Réintroduire avatar joueur (décision explicite requise — actuellement invisible).
- [ ] Interaction de base (objet/PNJ) : intent client → validation serveur.
- [ ] Système quête minimal (1 quête témoin de bout en bout).
- [ ] Chat avec cooldown serveur.
- [ ] Protocole Zod complet (`packages/shared/src/protocol.ts`), validation entrée stricte.

## Sécurité (à chaque diff)

- Validation serveur de tous les messages (Zod).
- Cooldowns chat/actions.
- Distance d'interaction côté serveur.
- Anti-triche position. Pas de logique sensible client.
- Vérifs : XSS, IDOR, injection, secrets exposés.

## Critères de sortie

- [ ] Un joueur peut spawn, se déplacer, interagir, finir 1 quête, recevoir récompense — tout serveur-validé.
- [ ] Aucune action non validée serveur.
- [ ] typecheck + lint + build OK (client & serveur).
