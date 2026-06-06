// Local dev config — copy this file to config.js and fill in your own key.
// config.js is gitignored so the real key never enters the repo.
//
// In production (GitHub Pages) the same file is generated at deploy time by
// .github/workflows/pages.yml from the ORS_API_KEY repository secret.
//
// If the file is missing or the key is empty, the app silently falls back to
// OSRM (no avoid-features, no per-segment toll/ferry data — but routing still works).
window.__ORS_API_KEY = '';
