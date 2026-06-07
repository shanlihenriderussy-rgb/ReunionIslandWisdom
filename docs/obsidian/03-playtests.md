# Playtests

QA gameplay + prod. Chaque build -> retours actionnables : bugs reproductibles, priorites, go/no-go.

## Protocole test 2 joueurs

Objectif : valider co-presence, chat local, interaction PNJ, camera, et le HUD.

### Setup

- 2 machines distinctes (pas 2 onglets sur la meme), reseau identique.
- Serveur : `corepack pnpm dev` -> `ws://localhost:2567`.
- Client : `http://localhost:5173`.
- Joueur A = hote / observateur. Joueur B = testeur naif (ne connait pas le jeu).
- Chrono lance des l'ouverture de l'onglet.

### Deroule (10 min)

1. **Connexion (0-1 min)** — A et B ouvrent l'URL. Noter : pastille etat passe `Connexion...` -> `En ligne - N`. Compteur joueurs = 2 des deux cotes.
2. **Premier mouvement (1-2 min)** — B bouge sans aide. Mesurer `temps avant premier mouvement`.
3. **Camera (2-4 min)** — B tourne la camera (glisser souris). Noter gene, inversion, sensibilite.
4. **Co-presence (4-5 min)** — A et B se voient bouger. Nametags lisibles. Pas de teleport/saccade.
5. **Chat local (5-7 min)** — B envoie un message (Entree). Mesurer `temps avant premier chat`. A le recoit. Verifier etat vide -> message, et input desactive si hors ligne.
6. **Interaction PNJ (7-9 min)** — B s'approche, prompt `E - Parler a ...` apparait. E ouvre le dialogue. Loin = pas de prompt / refus serveur.
7. **Pause (9-10 min)** — B appuie Echap (ou bouton II). Overlay pause, deplacement gele. Reprendre = retour jeu. Echap sur dialogue ouvert = ferme le dialogue d'abord.

### A noter pour chaque session

Creer une note depuis [[_templates/playtest]].

## Checklist navigateur / mobile

### Navigateur desktop (Chrome, Firefox, Safari, Edge)

- [ ] Page charge, canvas plein ecran, 0 erreur console bloquante.
- [ ] Pastille connexion : `Connexion...` puis `En ligne - N`.
- [ ] Passage offline simule (couper serveur) -> pastille `Hors ligne`, input chat desactive.
- [ ] WASD + ZQSD + fleches deplacent.
- [ ] Glisser souris tourne la camera, relacher stoppe.
- [ ] Chat : etat vide affiche, envoi OK, log scrolle en bas.
- [ ] Prompt PNJ proche / absent loin. E ouvre dialogue. Fermer OK.
- [ ] Echap : ferme dialogue, sinon ouvre pause. Bouton II ouvre pause.
- [ ] Pause gele le deplacement, masque prompt, Reprendre OK.
- [ ] Resize fenetre : HUD reste lisible, rien ne deborde.

### Mobile / tactile (Android Chrome prioritaire — contexte Reunion)

- [ ] Layout `<= 640px` : objectif/status compacts, chat reduit, rien ne se chevauche.
- [ ] Cibles tactiles >= 44px (bouton pause, Fermer, Reprendre).
- [ ] Bouton pause II accessible au pouce.
- [ ] Clavier virtuel ouvre sur le champ chat sans casser le HUD.
- [ ] Pas de zoom involontaire / scroll de page pendant le drag camera.
- [ ] Perf : pas de chute FPS visible a la connexion ou en chat.

## Grille severite bugs (P0-P3)

| Prio | Definition | Effet build | Delai cible |
| --- | --- | --- | --- |
| **P0** | Bloquant. Crash, page blanche, pas de connexion, impossible de bouger. | **No-go** | Immediat |
| **P1** | Majeur. Fonction cle cassee (chat, interaction, pause) mais jeu lance. | No-go sauf contournement | Avant prochain build |
| **P2** | Mineur. Gene UX, visuel, friction notable sans blocage. | Go possible | Sprint courant |
| **P3** | Cosmetique / confort. Polish, wording, micro-decalage. | Go | Backlog |

Chaque bug -> note depuis [[_templates/bug]], avec repro numerotee. Reporter dans [[02-backlog]] section Bugs priorises.

## Mesure de friction

Cible chiffree par session (mediane sur les testeurs).

| Signal | Mesure | Seuil rouge |
| --- | --- | --- |
| Deplacement | Temps avant 1er mouvement | > 15 s |
| Camera | Nb plaintes "perdu / mal au coeur" | >= 1 sur 2 testeurs |
| Camera | Inversion axe ressentie | toute occurrence |
| Chat | Temps avant 1er message | > 60 s |
| Chat | Echec d'envoi ressenti | toute occurrence |
| Connexion | Temps avant `En ligne` | > 4 s |
| Perf | FPS ressenti | saccades visibles |
| Reference Reunion | Confusion / lourdeur | retour negatif |

## Decision go/no-go

- **No-go** si : >= 1 P0, ou >= 1 P1 sans contournement, ou friction deplacement/chat au-dela du seuil rouge sur les 2 testeurs.
- **Go** sinon. Lister P2/P3 restants dans le backlog avant de shipper.

## Sessions

- [[playtests/2026-06-06-west-blockout]] — premier blockout jouable Saint-Paul / Saint-Gilles.
- [[playtests/2026-06-05-scale220-baked-sand]] — scale 220, sable bake, secteurs assets.
- [[playtests/2026-06-05-terrain320-readability]] — mesh 320x288, relief/biomes plus lisibles.
