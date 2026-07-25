import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'blog'>;

/**
 * Returns all blog posts, optionally filtering drafts.
 *
 * In dev, drafts are included for author preview. In prod, drafts are excluded.
 * Pass `includeDrafts: false` to always exclude (e.g. for RSS, sitemap, search index).
 */
export async function getPosts(options: { includeDrafts?: boolean } = {}): Promise<Post[]> {
  const { includeDrafts = import.meta.env.DEV } = options;
  return getCollection('blog', ({ data }) => includeDrafts || !data.draft);
}

/** Sort posts by pubDate descending (newest first). */
export function byDateDesc(a: Post, b: Post): number {
  return b.data.pubDate.getTime() - a.data.pubDate.getTime();
}
