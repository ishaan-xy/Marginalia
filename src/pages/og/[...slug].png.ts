import type { APIRoute } from 'astro';
import { getAllPosts, getSeriesPosts } from '@/lib/post-cache';
import { generateOGImage } from '@/lib/generate-og-image';
import { formatDate } from '@/lib/format';
import { SITE } from '@/lib/site';

export async function getStaticPaths() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props;
  const { title, description, pubDate, series } = post.data;

  // Look up series posts to get the total count for "Part X of Y"
  let seriesInfo: { name: string; part: number; total: number } | undefined;
  if (series) {
    const seriesPosts = await getSeriesPosts(series.name);
    seriesInfo = {
      name: series.name,
      part: series.part,
      total: seriesPosts.length,
    };
  }

  const png = await generateOGImage({
    title,
    description: description ?? '',
    author: SITE.author,
    date: formatDate(pubDate),
    series: seriesInfo,
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
