#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = './dist';
const issues = [];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

function audit(file) {
  const html = readFileSync(file, 'utf8');
  const rel = file.replace(DIST + '/', '');
  const id = (label) => `[${rel}] ${label}`;

  // Images without alt
  const imgRe = /<img\b[^>]*>/g;
  let m;
  while ((m = imgRe.exec(html))) {
    if (!/\balt=/.test(m[0])) issues.push(id(`Image without alt: ${m[0].slice(0, 80)}`));
  }

  // Buttons without accessible name
  const btnRe = /<button\b[^>]*>([\s\S]*?)<\/button>/g;
  while ((m = btnRe.exec(html))) {
    const attrs = m[0].slice(0, m[0].indexOf('>'));
    const inner = m[1];
    const hasAriaLabel = /\baria-label=/.test(attrs);
    const hasAriaLabelledby = /\baria-labelledby=/.test(attrs);
    const hasText = inner.replace(/<[^>]+>/g, '').trim().length > 0;
    const hasTitle = /\btitle=/.test(attrs);
    if (!hasAriaLabel && !hasAriaLabelledby && !hasText && !hasTitle)
      issues.push(id(`Button without accessible name: ${m[0].slice(0, 80)}`));
  }

  // Inputs without label
  const inputRe = /<input\b[^>]*>/g;
  while ((m = inputRe.exec(html))) {
    const attrs = m[0];
    if (/\btype="hidden"/.test(attrs)) continue;
    if (/\btype="submit"/.test(attrs)) continue;
    if (/\btype="button"/.test(attrs)) continue;
    if (/\baria-label=/.test(attrs) || /\baria-labelledby=/.test(attrs)) continue;
    issues.push(id(`Input without label: ${m[0].slice(0, 80)}`));
  }

  // Duplicate IDs
  const idRe = /\bid="([^"]+)"/g;
  const seen = new Map();
  while ((m = idRe.exec(html))) {
    const idVal = m[1];
    if (seen.has(idVal)) issues.push(id(`Duplicate ID: "${idVal}"`));
    else seen.set(idVal, m.index);
  }
}

const files = walk(DIST);
console.log(`Auditing ${files.length} HTML files...`);
for (const f of files) audit(f);
if (issues.length === 0) console.log('No a11y issues found.');
else { console.log(`\nFound ${issues.length} potential a11y issues:`); for (const i of issues) console.log(`  ${i}`); process.exit(1); }
