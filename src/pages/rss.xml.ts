import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { SITE } from '@/lib/site';
import { getPublishedPosts, byDateDesc } from '@/lib/post-cache';

export const GET: APIRoute = async (context) => {
  const posts = (await getPublishedPosts()).sort(byDateDesc);

  // Render each post's HTML for the content:encoded field.
  // Astro 7's `render()` returns a Content component (not a string), and
  // Astro's full render-to-string pipeline isn't easily callable from an
  // API route without experimental_AstroContainer. Until that's wired up,
  // we use the post's description as the RSS content — most RSS readers
  // will display the description and link to the full article.
  // To enable full-text RSS later, see:
  //   https://docs.astro.build/en/reference/container-reference/
  const items = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description ?? '',
    pubDate: post.data.pubDate,
    link: `/${post.id}/`,
    categories: post.data.tags,
    content: post.data.description ?? '',
  }));

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
    customData: `<language>en-us</language>
    xmlns:content="http://purl.org/rss/1.0/modules/content/"`,
  });
}
