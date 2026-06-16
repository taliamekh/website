#!/usr/bin/env node
/*
 * make-key.js — hash a client access key for the Client Portal.
 *
 * Usage:
 *   node portal/make-key.js "acme-falcon-2026-7q3z"
 *
 * Prints the SHA-256 hash to paste into the PORTALS map in /portal.html.
 * The normalisation here (trim + lowercase) MUST match portal.html, or the
 * browser will compute a different hash and the key won't match.
 */
const crypto = require('crypto');

const raw = process.argv[2];
if (!raw) {
  console.error('Usage: node portal/make-key.js "your-client-key"');
  process.exit(1);
}

const normalised = raw.trim().toLowerCase();
const hash = crypto.createHash('sha256').update(normalised, 'utf8').digest('hex');

console.log('key   :', JSON.stringify(raw));
console.log('hash  :', hash);
console.log('\nPORTALS entry:');
console.log(`  '${hash}': 'portal/clients/CLIENT-SLUG.html',`);
