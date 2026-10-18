#!/bin/sh
# Publie ARCHIVE, la veille tech : régénère le site puis pousse sur GitHub.
# GitHub Pages déploie tout seul depuis docs/ sur la branche main.
# Le push part d'un clone situé hors du dossier connecté, pour que git
# puisse gérer ses fichiers de verrou librement.
# Usage : sh publier.sh
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
REPO="krlpz-dev/veille-tech"
CLONE="$HOME/.cache/veille-tech-publication"
cd "$SRC"

TOKEN=$(tr -d '\n\r ' < "$SRC/.secrets/github-token")
if [ -z "$TOKEN" ]; then
  echo "Jeton GitHub absent : .secrets/github-token"
  exit 1
fi
URL="https://x-access-token:$TOKEN@github.com/$REPO.git"

echo "→ Récupération de l'état en ligne"
if [ -d "$CLONE/.git" ]; then
  git -C "$CLONE" fetch -q "$URL" main
  git -C "$CLONE" reset -q --hard FETCH_HEAD
else
  mkdir -p "$(dirname "$CLONE")"
  git clone -q "$URL" "$CLONE"
fi

# Une édition publiée ailleurs ne doit jamais disparaître du site : on la
# redescend dans editions/ avant de régénérer.
for f in "$CLONE"/editions/*.json; do
  [ -f "$f" ] || continue
  b=$(basename "$f")
  if [ ! -f "$SRC/editions/$b" ]; then
    cp "$f" "$SRC/editions/$b"
    echo "   édition récupérée depuis GitHub : $b"
  fi
done

echo "→ Génération de toutes les éditions"
python3 build.py

echo "→ Préparation de l'envoi"
rm -rf "$CLONE/docs" "$CLONE/editions" "$CLONE/assets"
mkdir -p "$CLONE/docs" "$CLONE/editions"
cp -R "$SRC/docs/." "$CLONE/docs/"
touch "$CLONE/docs/.nojekyll"
cp "$SRC"/editions/*.json "$CLONE/editions/"
[ -d "$SRC/assets" ] && cp -R "$SRC/assets" "$CLONE/assets"
for f in build.py README.md .gitignore netlify.toml ARCHIVE.svg publier.sh; do
  [ -f "$SRC/$f" ] && cp "$SRC/$f" "$CLONE/$f"
done
echo "   $(ls "$CLONE"/docs/edition-*.html | wc -l | tr -d ' ') éditions dans docs/"

cd "$CLONE"
git config user.email "petzold.karl@gmail.com"
git config user.name "Karl Petzold"
git add -A
if git diff --cached --quiet; then
  echo "→ Rien de nouveau, le site en ligne est déjà à jour."
  exit 0
fi
NUM=$(python3 -c "import glob,json;fs=sorted(glob.glob('editions/*.json'));print(json.load(open(fs[-1])).get('edition','') if fs else '')" 2>/dev/null || true)
git commit -q -m "Édition ${NUM:-$(date +%Y-%m-%d)}"
git push -q "$URL" HEAD:main
echo "→ Envoyé sur github.com/$REPO. Le site se met à jour en une à deux minutes."
