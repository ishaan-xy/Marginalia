import type { APIRoute } from 'astro';
import { generateOGImage } from '@/lib/generate-og-image';
import { SITE } from '@/lib/site';

// Default OG image for non-post pages (homepage, archive, search, etc.)
export const GET: APIRoute = async () => {
  try {
    const jpeg = await generateOGImage({
      title: SITE.title,
      description: SITE.tagline,
      author: SITE.author,
      date: '',
    });

    return new Response(jpeg, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[OG] Failed to generate default image:', err);
    const transparent = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    return new Response(transparent, {
      headers: { 'Content-Type': 'image/png' },
    });
  }
};
