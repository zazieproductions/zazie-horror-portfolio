import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * The item-page bundle only: /work/<slug>, /reel/<slug> and /store/<slug> load
 * item-<hash>.css and item-<hash>.js. Everything else on the site keeps its own
 * pipeline (index.html + the React bundle for /, legal-src/build.sh for the
 * documents, store-src/build.sh for the catalogue).
 *
 * Vite builds into the ignored build/item-assets directory, not over the site
 * root. This avoids Vite's dangerous root-outDir warning; the small plugin
 * exports only the content-hashed item CSS/JS files to the served root. The
 * manifest stays in build/ and scripts/prerender.mjs reads it to render each
 * page with the exact asset names.
 */
function exportItemAssets(siteRoot: string): Plugin {
  return {
    name: 'zp-export-item-assets',
    writeBundle(options, bundle) {
      const outDir = options.dir;
      if (!outDir) throw new Error('Vite did not provide an output directory for item assets');

      const current = new Set(
        Object.values(bundle)
          .map((chunk) => chunk.fileName)
          .filter((name) => /^item-[A-Za-z0-9_-]{8}\.(js|css)$/.test(name)),
      );
      for (const entry of fs.readdirSync(siteRoot)) {
        if (!/^item-[A-Za-z0-9_-]{8}\.(js|css)$/.test(entry)) continue;
        if (current.has(entry)) continue;
        fs.rmSync(path.join(siteRoot, entry), { force: true });
        console.log(`[zp] removed stale item asset ${entry}`);
      }

      for (const file of current) {
        fs.copyFileSync(path.join(outDir, file), path.join(siteRoot, file));
        console.log(`[zp] exported ${file} to the served root`);
      }
    },
  };
}

export default defineConfig({
  build: {
    // Keep the manifest and intermediate bundle inside .gitignored build/;
    // only immutable hashed CSS/JS assets are copied to the deployment root.
    outDir: 'build/item-assets',
    emptyOutDir: true,
    manifest: 'item-manifest.json',
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: 'src/item/main.ts',
      output: {
        format: 'iife',
        entryFileNames: 'item-[hash].js',
        assetFileNames: 'item-[hash][extname]',
        inlineDynamicImports: true,
      },
    },
  },
  plugins: [exportItemAssets(repoRoot)],
});
