/**
 * Build a search index at build time.
 * Returns an array of compact search documents suitable for client-side
 * fuzzy search.
 *
 * Optimized for sites with many long posts:
 *   - Body is heavily truncated (1200 chars, enough for snippet context)
 *   - Frontmatter and code fences stripped before slicing
 *   - Series name included as a separate indexed field
 *   - Drafts are NEVER included, even in dev
 *
 * For 79 posts averaging ~8000 words each, this keeps the index well
 * under 1 MB gzipped.
 */
import { getPublishedPosts } from '@/lib/post-cache';

interface SearchDoc {
  title: string;
  description: string;
  body: string;
  url: string;
  pubDate: string;
  tags: string[];
  series: string | null;
}

const BODY_SLICE = 1200;

function cleanMarkdown(src: string): string {
  return src
    // Remove frontmatter
    .replace(/^---[\s\S]*?---\n/, '')
    // Remove code fences entirely (their text is rarely what users search for,
    // and including it bloats the index)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown syntax
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, BODY_SLICE);
}

export async function buildSearchIndex(): Promise<SearchDoc[]> {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({
    title: p.data.title,
    description: p.data.description ?? '',
    body: cleanMarkdown(p.body ?? ''),
    url: `/${p.id}/`,
    pubDate: p.data.pubDate.toISOString(),
    tags: p.data.tags,
    series: p.data.series?.name ?? null,
  }));
}
