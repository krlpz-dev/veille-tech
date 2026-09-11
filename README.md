# ARCHIVE · veille tech hebdo

Site statique, généré par `build.py` (Python 3, stdlib uniquement), publié par GitHub Pages à chaque push sur `main` (dossier `docs/`). URL : https://krlpz-dev.github.io/veille-tech/

## Structure

```
editions/AAAA-MM-JJ.json   contenu d'une édition (FR + EN dans le même fichier)
assets/                    logo.svg, style.css, game.js (mini jeu du header), site.js (bascule FR/EN), favicon.svg
build.py                   génère docs/ à partir de editions/*.json ; assets/img/ (images locales) est copié tel quel
docs/                      sortie commitée, publiée telle quelle par GitHub Pages (Settings → Pages → main, /docs)
```

## Publier une édition

1. Créer `editions/AAAA-MM-JJ.json` (copier la précédente comme gabarit).
2. `python3 build.py`
3. `git add -A && git commit -m "Édition NN" && git push`

GitHub Pages republie en une à deux minutes.

## Schéma d'une édition

```json
{
  "edition": "02",
  "date": "2026-09-13",
  "title": { "fr": "…", "en": "…" },
  "deck": { "fr": "…", "en": "…" },
  "hero": { "src": "https://…png", "alt": { "fr": "…", "en": "…" } },
  "background": { "src": "https://… (optionnel : grain de fond du site, repris de la dernière édition qui en définit un)" },
  "news": [
    {
      "id": "slug",
      "category": { "fr": "IA", "en": "AI" },
      "date": "2026-09-10",
      "title": { "fr": "…", "en": "…" },
      "body": { "fr": "2 à 4 phrases très brèves, le chiffre marquant inclus dans le texte", "en": "…" },
      "learning": { "fr": "1 phrase", "en": "…" },
      "tag": "DLSS 5",
      "media": { "type": "image | video | slideshow", "src": "https://… (image, video)", "poster": "https://… (video)", "srcs": ["https://…", "https://…"], "labels": ["off", "on"], "alt": "…" },
      "source": { "name": "…", "url": "https://…" },
      "also": { "name": "…", "url": "https://…" }
    }
  ]
}
```

Catégories utilisées : IA / AI, Gaming tech, Robotique / Robotics, Business, Sécurité / Security, Outils / Tools, Hardware.

## Ligne éditoriale

- 4 à 6 news par semaine, publiées le dimanche soir.
- Tech uniquement : IA, gaming côté technologie (jamais les jeux eux-mêmes), robotique.
- Texte très bref, lisible en quelques secondes. Un chiffre marquant et vérifiable par news, dans le paragraphe (pas de chiffre géant).
- Un learning ou un avis sur les implications en une phrase.
- Images choisies sur le web quand c'est possible (2 à 4 images en diaporama automatique de 2 s, par exemple avant/après pour une techno de rendu, jamais de jeu de sport) ; à défaut, image générée sur Higgsfield Soul 2.0 dans un esprit brut, organique, flou de mouvement. Image d'ouverture d'édition : Higgsfield, 16:9, noir et blanc granuleux, sans texte.
- Écriture : pas de tiret cadratin, pas de point d'exclamation.

## Le mini jeu du header

Desktop uniquement (souris). Des squelettes (épée, épée et bouclier, hache, masse) sortent de derrière le logo et avancent, puis frappent. Clic pour tirer, 6 cartouches visibles sur le côté du fusil, rechargement automatique (ou touche R). Dégâts aléatoires de 1 à 3 par tir, squelettes à 3 ou 4 points de vie, état qui se dégrade coup après coup, os qui volent à la mort. Jauge de vie de 100, chaque coup reçu retire 20. Le jeu se met en pause quand la souris quitte le header ou que le header sort de l'écran. Sprites en bitmaps dans `assets/game.js`.
