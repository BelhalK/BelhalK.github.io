// Cloudflare edge-caches static file extensions (js/css) for hours regardless of
// origin headers. site.js and site.css are plain files in public/ (copied
// verbatim, outside Rollup's build graph) and are referenced by fixed,
// unhashed paths across every static sub-page, so a content change doesn't
// change the URL and stale copies keep being served from the CDN edge until
// the cache naturally expires.
//
// courtside.js (src/basketball.js) IS part of Rollup's graph and gets a real
// content hash in its filename from Vite (see dist/.vite/manifest.json) -
// Rollup bakes that real filename into whatever imports it (the homepage's
// main-<hash>.js chunk) before hashing the importer, so that chain busts
// itself correctly on its own. The one place that reference isn't handled
// automatically is site.js, which hardcodes '/assets/courtside.js' as a plain
// string (it's outside the build graph too) - this script rewrites that to
// the real hashed filename, then versions site.js/site.css themselves with a
// content-hash query string so every deploy gets URLs Cloudflare has never
// cached before.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(import.meta.dirname, '..', 'dist');

function hashOf(filePath) {
    return createHash('sha1').update(readFileSync(filePath)).digest('hex').slice(0, 10);
}

function walk(dir, out = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else out.push(full);
    }
    return out;
}

// 1. Point site.js at the real, Vite-hashed courtside filename.
const manifestPath = path.join(distDir, '.vite', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const courtsideFile = manifest['src/basketball.js']?.file;
if (!courtsideFile) throw new Error('courtside entry (src/basketball.js) missing from Vite manifest');

const siteJsPath = path.join(distDir, 'site.js');
const siteJs = readFileSync(siteJsPath, 'utf8').replace(
    /(['"])\/assets\/courtside(?:-[\w-]+)?\.js\1/,
    `$1/${courtsideFile}$1`,
);
writeFileSync(siteJsPath, siteJs);

// 2. Version the two remaining unhashed passthrough files across every page
// that references them.
const targets = [
    { file: path.join(distDir, 'site.js'), ref: '/site.js' },
    { file: path.join(distDir, 'site.css'), ref: '/site.css' },
];

const allFiles = walk(distDir).filter((f) => /\.html$/.test(f));

for (const { file, ref } of targets) {
    if (!statSync(file, { throwIfNoEntry: false })) continue;
    const version = hashOf(file);
    const pattern = new RegExp(`(["'])${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?v=[0-9a-f]+)?(["'])`, 'g');
    for (const f of allFiles) {
        const content = readFileSync(f, 'utf8');
        const next = content.replace(pattern, (_m, open, close) => `${open}${ref}?v=${version}${close}`);
        if (next !== content) writeFileSync(f, next);
    }
    console.log(`versioned ${path.relative(distDir, file)} -> ?v=${version}`);
}
console.log(`courtside resolved to /${courtsideFile} (native Vite hash, no manual versioning needed)`);
