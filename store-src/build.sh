#!/usr/bin/env bash
# Build the store page.
#
# Sources live in store-src/. This writes content-hashed assets to the repo
# root (the served directory) and generates /store.html from them, so the
# immutable cache headers in _headers stay honest: change a file, change its
# URL. Old hashed copies are removed on each run.
#
#   ./store-src/build.sh
set -euo pipefail

cd "$(dirname "$0")/.."
hash8() { printf '%s' "$1" | sha256sum | cut -c1-8; }

CSS_HASH=$(hash8 "$(cat store-src/store.css)")
JS_HASH=$(hash8 "$(cat store-src/store.js)")
CSS_OUT="store-${CSS_HASH}.css"
JS_OUT="store-${JS_HASH}.js"

# drop previous builds (never touch index-*)
rm -f store-[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].css \
      store-[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].js

cp store-src/store.css "$CSS_OUT"
cp store-src/store.js "$JS_OUT"
sed -e "s|__CSS__|${CSS_OUT}|g" -e "s|__JS__|${JS_OUT}|g" store-src/store.html > store.html

printf 'wrote %s (%s bytes)\n' "$CSS_OUT" "$(wc -c < "$CSS_OUT")"
printf 'wrote %s (%s bytes)\n' "$JS_OUT" "$(wc -c < "$JS_OUT")"
printf 'wrote store.html (%s bytes)\n' "$(wc -c < store.html)"
