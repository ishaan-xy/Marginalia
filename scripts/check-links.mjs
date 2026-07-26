#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';

const DIST = './dist';
const broken = new Map();

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

function extractLinks(html) {
  const links = new Set();
  const stripped = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const re = /href=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(stripped))) links.add(m[1]);
  return links;
}

function resolveLink(from, link) {
  if (/^(https?|mailto|tel|javascript|data|rss):/.test(link)) return null;
  if (link === '' || link === '#' || link.startsWith('#')) return null;
  let resolved;
  if (link.startsWith('/')) resolved = join(DIST, link.slice(1));
  else resolved = resolve(dirname(from), link);
  resolved = resolved.split('#')[0].split('?')[0];
  if (resolved.endsWith('/')) resolved += 'index.html';
  else if (!extname(resolved)) {
    if (existsSync(resolved + '/index.html')) resolved += '/index.html';
    else if (existsSync(resolved + '.html')) resolved += '.html';
    else resolved += '/index.html';
  }
  return resolved;
}

const htmlFiles = walk(DIST);
console.log(`Scanning ${htmlFiles.length} HTML files...`);
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  for (const link of extractLinks(html)) {
    const resolved = resolveLink(file, link);
    if (!resolved) continue;
    if (!existsSync(resolved)) {
      if (!broken.has(link)) broken.set(link, []);
      broken.get(link).push(file.replace(DIST + '/', ''));
    }
  }
}
if (broken.size === 0) console.log('No broken links found.');
else { console.log(`Found ${broken.size} broken links:`); process.exit(1); }
