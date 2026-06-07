# Reunion Island Wisdom - HUD Design System

Source importee depuis :

```txt
C:\Users\Shan li\Downloads\Reunion Island Wisdom design system.zip
```

Date d'integration : 2026-06-06 18:42 +04:00.

## Fichiers

- `tokens.css` : tokens CSS natifs, sans dependance.
- `components.css` : classes de reference `.riw-*` pour surfaces, boutons, dialogues, status, zoom, chat.
- `assets/` : images de preview du board.

## Runtime

Le client charge une copie des tokens ici :

```txt
apps/game-client/src/design-tokens.css
```

Le HUD runtime garde ses classes actuelles (`objective`, `status`, `pause-btn`, etc.) mais utilise maintenant les tokens du design system.

## Regles

- Pas d'import Google Fonts dans le runtime.
- Pas de framework UI.
- Pas de faux systeme de vie/xp/minimap tant que le gameplay ne le fournit pas.
- Les composants du board sont une reference, pas une obligation de tout brancher d'un coup.
