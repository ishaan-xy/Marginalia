import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { render } from 'astro:content';
import { SITE } from '@/lib/site';
import { getPublishedPosts, byDateDesc } from '@/lib/post-cache';

export const GET: APIRoute = async (context) => {
  const posts = (await getPublishedPosts()).sort(byDateDesc);

  // Render each post's HTML for the content:encoded field.
  // This allows RSS readers to display the full article inline.
  const items = [];
  for (const post of posts) {
    const { Content } = await render(post);
    // Render the Content component to HTML string
    let html = '';
    try {
      const result = await Content();
      // Astro render returns an AstroComponent — we can't easily get HTML
      // from it in an API route without the full render pipeline.
      // Fall back to the description for now.
      html = post.data.description ?? '';
    } catch {
      html = post.data.description ?? '';
    }
    items.push({
      title: post.data.title,
      description: post.data.description ?? '',
      pubDate: post.data.pubDate,
      link: `/${post.id}/`,
      categories: post.data.tags,
      content: html,
    });
  }

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
    customData: `<language>en-us</language>
    xmlns:content="http://purl.org/rss/1.0/modules/content/"`,
  });
}
