// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { rehypeEnhanceBlocks } from './src/lib/rehype-enhance-blocks.ts';
import { remarkCallouts } from './src/lib/remark-callouts.ts';

// NOTE: Astro 7's default `satteri` Markdown processor does NOT use the
// remark/rehype pipeline. The deprecated `markdown.remarkPlugins` /
// `markdown.rehypePlugins` options emit a non-fatal warning but correctly
// apply to both .md and .mdx files (satteri consumes them). We use these
// deprecated options because the alternative — `processor: unified({...})`
// from `@astrojs/markdown-remark` — only applies to .mdx files, not .md.
export default defineConfig({
  site: 'https://marginalia-dav.pages.dev',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // canvaskit-wasm is a build-time-only dependency for OG image generation.
    // It uses WASM + native bindings that Vite/Rolldown can't bundle —
    // externalize it so the build doesn't try to resolve it at bundle time.
    build: {
      rollupOptions: {
        external: ['canvaskit-wasm', 'canvaskit-wasm/full'],
      },
    },
    ssr: {
      external: ['canvaskit-wasm', 'canvaskit-wasm/full'],
    },
    optimizeDeps: {
      exclude: ['canvaskit-wasm'],
    },
  },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
    remarkPlugins: [remarkCallouts],
    rehypePlugins: [rehypeEnhanceBlocks],
  },
  mdx: {
    remarkPlugins: [remarkCallouts],
    rehypePlugins: [rehypeEnhanceBlocks],
  },
});
