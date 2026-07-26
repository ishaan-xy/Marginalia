import type { APIRoute } from 'astro';
import { getAllPosts, getSeriesPosts } from '@/lib/post-cache';
import { generateOGImage } from '@/lib/generate-og-image';
import { formatDate } from '@/lib/format';
import { SITE } from '@/lib/site';
import fs from 'node:fs';
import path from 'node:path';

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

  try {
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
  } catch (err) {
    // Fallback: serve a static default OG image if generation fails.
    // This prevents a single WASM/font glitch from breaking the entire build.
    console.error(`[OG] Failed to generate image for "${post.id}":`, err);

    const fallbackPath = path.join(process.cwd(), 'public', 'og-default.png');
    try {
      const fallback = fs.readFileSync(fallbackPath);
      return new Response(fallback, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      // If even the fallback doesn't exist, return a 1×1 transparent PNG
      const transparent = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      return new Response(transparent, {
        headers: { 'Content-Type': 'image/png' },
      });
    }
  }
};
