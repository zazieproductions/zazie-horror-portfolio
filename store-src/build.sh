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

# /store must be a REAL static path, not a redirect/rewrite target. Cloudflare
# Pages redirects ".html" URLs to their pretty form, so rewriting /store to
# /store.html via _redirects loops forever (ERR_TOO_MANY_REDIRECTS on both
# /store and /store.html). Serving the page twice, as store/index.html and as
# the root twin store.html, lets every static host answer both /store/ and the
# canonical /store straight from the asset tree, with no redirect machinery
# involved. Every other directory route now carries the same twin pair - see
# tools/route-aliases.mjs and the note at the foot of _redirects.
mkdir -p store
cp store.html store/index.html

printf 'wrote %s (%s bytes)\n' "$CSS_OUT" "$(wc -c < "$CSS_OUT")"
printf 'wrote %s (%s bytes)\n' "$JS_OUT" "$(wc -c < "$JS_OUT")"
printf 'wrote store.html (%s bytes)\n' "$(wc -c < store.html)"
printf 'wrote store/index.html (%s bytes)\n' "$(wc -c < store/index.html)"

# sw.js precaches this pair by filename. A hash that moved without the service
# worker moving with it is a 404 on every install, and a CACHE_NAME bump that
# goes with it is what stops a returning visitor being served the previous
# /store build (prices, stock and the primary nav all live in that document).
SW_CSS=$(grep -o 'store-[0-9a-f]\{8\}\.css' sw.js | head -1 || true)
SW_JS=$(grep -o 'store-[0-9a-f]\{8\}\.js' sw.js | head -1 || true)
if [ "$SW_CSS" != "$CSS_OUT" ] || [ "$SW_JS" != "$JS_OUT" ]; then
  printf '\nWARNING: sw.js precaches %s / %s, this build wrote %s / %s\n' \
    "${SW_CSS:-nothing}" "${SW_JS:-nothing}" "$CSS_OUT" "$JS_OUT" >&2
  printf 'WARNING: update PRECACHE_ASSETS in sw.js and bump CACHE_NAME.\n' >&2
fi
