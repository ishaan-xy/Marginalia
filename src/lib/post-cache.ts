/**
 * Memoized build-time post queries.
 *
 * Without this, every page that needs related posts or series info calls
 * getCollection('blog') independently. Astro caches the underlying
 * collection, but our filtering/sorting/grouping logic runs fresh on every
 * page render. The cache is module-scoped, so it lives for the duration of
 * a single `astro build` or `astro dev` process.
 */
import { getPosts as rawGetPosts, byDateDesc } from '@/lib/posts';
import { getSeriesDescription } from '@/lib/series-meta';
import { slugifySeries } from '@/lib/format';
import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'blog'>;

export { byDateDesc };

let _allPostsCache: Post[] | null = null;
let _publishedPostsCache: Post[] | null = null;
const _seriesCache = new Map<string, Post[]>();

/** All posts (drafts included in dev, excluded in prod). Memoized. */
export async function getAllPosts(): Promise<Post[]> {
  if (_allPostsCache === null) {
    _allPostsCache = (await rawGetPosts()).sort(byDateDesc);
  }
  return _allPostsCache;
}

/** All non-draft posts. Memoized separately from getAllPosts. */
export async function getPublishedPosts(): Promise<Post[]> {
  if (_publishedPostsCache === null) {
    _publishedPostsCache = (await rawGetPosts({ includeDrafts: false })).sort(byDateDesc);
  }
  return _publishedPostsCache;
}

/** All posts in a given series, sorted by part number ascending. Memoized per series name. */
export async function getSeriesPosts(seriesName: string): Promise<Post[]> {
  if (_seriesCache.has(seriesName)) {
    return _seriesCache.get(seriesName)!;
  }
  const published = await getPublishedPosts();
  const posts = published
    .filter((p) => p.data.series?.name === seriesName)
    .sort((a, b) => (a.data.series?.part ?? 0) - (b.data.series?.part ?? 0));
  _seriesCache.set(seriesName, posts);
  return posts;
}

export interface SeriesInfo {
  name: string;
  posts: Post[];
  count: number;
  firstPost: Post | null;
  description: string | undefined;
  lastUpdated: Date | null;
  totalReadingTime: number;
}

/** All distinct series on the site, with posts and metadata. Sorted by series name. */
export async function getAllSeries(): Promise<SeriesInfo[]> {
  const published = await getPublishedPosts();
  const seriesMap = new Map<string, Post[]>();
  for (const post of published) {
    const name = post.data.series?.name;
    if (!name) continue;
    if (!seriesMap.has(name)) seriesMap.set(name, []);
    seriesMap.get(name)!.push(post);
  }

  // Validate series integrity at build time
  const slugSet = new Set<string>();
  for (const [name, posts] of seriesMap) {
    const parts = posts.map(p => p.data.series?.part ?? 0);
    // Check for duplicate parts
    const seen = new Set<number>();
    for (const part of parts) {
      if (seen.has(part)) {
        throw new Error(
          `Series "${name}": duplicate part ${part}. ` +
          `Check frontmatter — each part number must be unique within a series.`
        );
      }
      seen.add(part);
    }
    // Check for contiguous numbering starting at 1
    const sortedParts = [...seen].sort((a, b) => a - b);
    for (let i = 0; i < sortedParts.length; i++) {
      if (sortedParts[i] !== i + 1) {
        const expected = i + 1;
        const missing = sortedParts[i] > expected ? `Part ${expected} is missing` : `unexpected part ${sortedParts[i]}`;
        throw new Error(
          `Series "${name}": ${missing}. ` +
          `Parts must form a contiguous sequence starting at 1. Found: [${sortedParts.join(', ')}]`
        );
      }
    }
    // Check for slug collisions across distinct series names
    const slug = slugifySeries(name);
    if (slugSet.has(slug)) {
      throw new Error(
        `Series slug collision: "${name}" → /series/${slug}/ ` +
        `collides with another series. Rename one to avoid URL conflicts.`
      );
    }
    slugSet.add(slug);
  }

  return [...seriesMap.entries()]
    .map(([name, posts]) => {
      const sorted = posts.sort(
        (a, b) => (a.data.series?.part ?? 0) - (b.data.series?.part ?? 0)
      );
      const lastUpdated = sorted.reduce<Date | null>((max, p) => {
        return max === null || p.data.pubDate > max ? p.data.pubDate : max;
      }, null);
      const totalReadingTime = sorted.reduce((sum, p) => {
        // Lightweight estimate — avoids importing the heavier readingTime helper
        const words = (p.body ?? '').trim().split(/\s+/).length;
        return sum + Math.max(1, Math.ceil(words / 240));
      }, 0);
      const firstPost = sorted[0] ?? null;
      const description = getSeriesDescription(name) ?? firstPost?.data.description;
      return {
        name,
        posts: sorted,
        count: sorted.length,
        firstPost,
        description,
        lastUpdated,
        totalReadingTime,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Related posts for a given post. Scoring:
 *   - +3 per shared tag (tags appearing on 6+ posts are ignored as too generic)
 *   - +5 if same series (but different post)
 *   - Tiebreaker: newer posts win (negligible weight, only breaks exact ties)
 *   - Max 2 results returned
 */
const TIEBREAKER_DIVISOR = 1e15;

let _tagFreqCache: Map<string, number> | null = null;

export async function getRelatedPosts(currentPost: Post): Promise<Post[]> {
  const published = await getPublishedPosts();
  const currentTags = currentPost.data.tags;
  const currentSeries = currentPost.data.series?.name;

  // Memoize tag frequency map — rebuilt only when published posts change
  if (!_tagFreqCache) {
    _tagFreqCache = new Map<string, number>();
    for (const p of published) {
      for (const t of p.data.tags) {
        _tagFreqCache.set(t, (_tagFreqCache.get(t) ?? 0) + 1);
      }
    }
  }
  const tagFreq = _tagFreqCache;

  const scored = published
    .filter((p) => p.id !== currentPost.id)
    .map((p) => {
      let score = 0;
      if (currentSeries && p.data.series?.name === currentSeries) {
        score += 5;
      }
      for (const tag of currentTags) {
        if ((tagFreq.get(tag) ?? 0) > 5) continue;
        if (p.data.tags.includes(tag)) {
          score += 3;
        }
      }
      score += p.data.pubDate.getTime() / TIEBREAKER_DIVISOR;
      return { post: p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => x.post);

  return scored;
}
