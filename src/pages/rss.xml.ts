import rss from '@astrojs/rss';
import { SITE } from '@/lib/site';
import { getPublishedPosts, byDateDesc } from '@/lib/post-cache';

export async function GET(context) {
  // RSS feed should never include drafts, even in dev.
  const posts = (await getPublishedPosts()).sort(byDateDesc);

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? '',
      pubDate: post.data.pubDate,
      link: `/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}
