# AGENTS.md - docs/obsidian

## Secteur

Source de verite produit, design, decisions, playtests, iterations.

## Lecture obligatoire

Avant patch docs :

1. `../../CLAUDE.md`
2. `00-dashboard.md`
3. doc cible
4. docs liees indiquees en tete du fichier cible

## Regles docs

- Une passe = une note `iterations/YYYY-MM-DD-agent-sujet.md`.
- Ne pas reorganiser tout Obsidian sans demande.
- Ne pas reecrire l'historique.
- Distinguer :
  - verifie ;
  - inspecte statiquement ;
  - a valider en runtime ;
  - bloque par environnement.
- Si une decision durable est prise : ajouter ADR dans `04-decisions.md`.
- Si une tache change : mettre `02-backlog.md` a jour.
- A chaque prompt qui change le projet : ajouter une entree publique dans `22-synthese-publique-neophyte.md`.

## Style

Francais simple.
Court.
Actionnable.
Pas de jargon inutile dans la synthese publique.

## Coordination Claude / Codex

Claude :

- direction artistique ;
- critique ;
- priorisation ;
- notes Obsidian ;
- matrices reference -> ecart -> action.

Codex :

- implementation ;
- validation typecheck/lint/build ;
- notes techniques ;
- packaging.

Si les deux travaillent en meme temps, ne pas modifier la meme note.
Creer une note separee par agent/passe.
