#!/bin/sh
set -e

NAME="color-picker"
VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/[^0-9.]//g')
OUT="$NAME-$VERSION.zip"

rm -f "$NAME"-*.zip
zip -r "$OUT" manifest.json images/ src/ -x "*.DS_Store"

echo "Built $OUT ($(du -h "$OUT" | cut -f1))"

# Tag the current commit if not already tagged
TAG="v$VERSION"
if ! git tag -l "$TAG" | grep -q "$TAG"; then
  echo "Tag $TAG not found. Run 'git tag $TAG' to tag this release."
fi
