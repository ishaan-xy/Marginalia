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
 * Estimate reading time from raw markdown body text.
 * Default average adult reading speed ~ 220-260 wpm; we use 240.
 */
export function readingTime(text: string, wordsPerMinute = 240): number {
  // Strip code fences and markdown syntax for a more accurate count
  const cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`>~\-\[\]\(\)]/g, ' ');
  const words = cleaned.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
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
