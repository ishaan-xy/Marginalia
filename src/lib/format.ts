import { stripMarkdown } from '@/lib/markdown';

/**
 * Format a date for display. Uses locale-aware formatting
 * with explicit timezone so builds are deterministic.
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Format a date in long form, e.g. "April 12, 2025".
 */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Compute initials from a name (e.g., "Ada Lovelace" → "AL").
 * Used by Byline and AuthorBio components. Single source of truth
 * (previously duplicated in both files).
 */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Estimate reading time from raw markdown body text.
 * Default average adult reading speed ~ 220-260 wpm; we use 240.
 */
export function readingTime(text: string, wordsPerMinute = 240): number {
  const words = wordCount(text);
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Count words in raw markdown body text.
 * Strips markdown syntax (frontmatter, code, links, etc.) before counting
 * so the result reflects actual prose, not markdown noise.
 */
export function wordCount(text: string): number {
  const cleaned = stripMarkdown(text);
  return cleaned.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Convert a series name into a URL-safe slug.
 *
 * Used to generate the /series/<slug>/ URL from a series name like
 * "Minds & Machines" → "minds-machines".
 *
 * Algorithm:
 *   1. Lowercase
 *   2. Replace any run of non-alphanumeric characters with a single dash
 *   3. Trim leading and trailing dashes (so "& Friends" → "friends",
 *      not "-friends")
 *
 * This is the single source of truth for series slug generation —
 * used by the series landing page, series index, archive, homepage,
 * and SeriesNav component. Do NOT inline this logic; always call this
 * function so the slug algorithm stays consistent everywhere.
 */
export function slugifySeries(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
