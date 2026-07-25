# Marginalia — an Astro 7 blog

A Paragraph-style blog built on Astro 7, polished with the best features of Substack and Medium. Serif-led typography, single-column reading layout, dark mode, zero-JS by default with progressive enhancement.

## Stack

- **Astro 7.1** — static-first, zero JS by default
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **@astrojs/mdx** for MDX support
- **@astrojs/rss** for the feed
- **@astrojs/sitemap** for sitemap.xml
- **Content Collections** with a Zod schema for type-safe frontmatter
- Custom **remark** and **rehype** plugins for callouts, code-block enhancements, image captions

## Design

- Body type: **Lora** (serif)
- UI type: **Inter** (sans-serif)
- Code: **JetBrains Mono**
- Single accent color (`#b5413f`, an editorial brick-red)
- Light + dark themes via `.dark` class on `<html>`, persisted to `localStorage`
- No FOUC — theme is applied before first paint by an inline `<head>` script
- **System theme following** — if no manual preference is set, the site follows `prefers-color-scheme` as it changes
- Max reading width: `~640px` (close to a printed page)
- **Hanging punctuation** for editorial polish
- **`prefers-reduced-motion`** fully respected — animations disabled, smooth scroll replaced with instant jump

## Features

### Reading experience (Paragraph-style)
- Single-column serif body, generous line height
- Drop cap on first paragraph (toggleable per-post via `dropCap: false`)
- Reading progress bar fixed at top
- Hanging punctuation for editorial typography
- Back-to-top floating button (appears after 600px scroll)
- Print stylesheet — clean printable view, hides interactive chrome, expands content

### Substack-inspired
- Inline + dedicated subscribe CTAs (header pill, mid-article, post footer, homepage band)
- Newsletter form with simulated success flow (swap `action` URL in `site.ts` for a real provider)
- Author byline (inline avatar + bio card at end of posts)
- Series support — multi-part essays with prev/next nav and series banner

### Medium-inspired
- Sticky table-of-contents sidebar for long posts (desktop), with scroll-spy highlighting
- **Mobile TOC** — collapsible "On this page" dropdown at top of posts on small screens
- Floating share rail on desktop (X / LinkedIn / Hacker News / copy / RSS)
- Highlight-to-share: select any text → popup with "Quote on X" and copy-quote
- Clap button with spark animation, persisted to localStorage
- "Read next" related-posts section based on shared tags
- Topic cloud on archive page with count subscripts

### Search
- **`/search` page** with client-side fuzzy search
- Searches across title, description, body, and tags
- Highlighted matches, snippets with surrounding context
- Index built at build time, served as `/search.json`
- **Press `/` anywhere** to focus search

### Keyboard shortcuts (power-user)
- `/` — focus search
- `t` — toggle theme
- `g h` — go home
- `g a` — archive
- `g s` — search page
- `g t` — back to top
- `?` — show keyboard shortcuts overlay
- `Esc` — close overlay

### Markdown enhancements
- **GitHub-style admonitions** via `> [!note]`, `> [!tip]`, `> [!warning]`, `> [!info]`, `> [!danger]`, `> [!success]`
  - Optional title override: `> [!tip] Custom title here`
  - Each rendered with appropriate icon and color
- **Code block enhancements**: every `<pre>` wrapped in a `<figure>` with:
  - Language label (uppercase, top-left)
  - Copy button (top-right) with success checkmark
- **Image captions**: images with `alt` text auto-wrapped in `<figure><figcaption>`

### SEO & metadata
- **JSON-LD structured data**:
  - `WebSite` schema with `SearchAction` on every page
  - `BlogPosting` schema on posts (with author, publisher, keywords, dates)
  - Series support via `isPartOf`
- Open Graph + Twitter Card meta on every page
- `article:published_time` on post pages
- Canonical URLs
- Auto-generated `sitemap.xml`
- `webmanifest` for PWA-ish installability
- `robots` meta configurable per-page via `noIndex` prop

### Accessibility
- Skip-to-content link
- Focus-visible outlines
- `prefers-reduced-motion` respected throughout
- ARIA labels on all interactive elements
- Semantic HTML throughout
- Color contrast meets WCAG AA

## Pages

- **Home** — featured post hero + recent posts (cards) + older posts (compact list) + subscribe band
- **Archive** — all posts grouped by year + topic cloud with counts
- **Tags** — auto-generated `/tags/{tag}/` pages
- **Posts** — full reading view with TOC, drop cap, share rail, highlight-share, clap, author bio, related posts, subscribe CTA
- **Search** — fuzzy search across all posts
- **About** — colophon page
- **404** — friendly, with tag suggestions
- **RSS feed** at `/rss.xml`
- **Sitemap** at `/sitemap-index.xml`

## Frontmatter schema

```ts
{
  title: string
  description?: string
  pubDate: Date
  updatedDate?: Date
  draft?: boolean              // default: false
  featured?: boolean           // default: false (used for homepage hero)
  tags?: string[]              // default: []
  coverImage?: string
  series?: { name: string, part: number }  // optional series grouping
  dropCap?: boolean            // default: true
}
```

The schema is defined in `src/content.config.ts` and enforced at build time.

## Writing a post

Drop a Markdown or MDX file in `src/content/blog/`. The filename becomes the URL slug.

```md
---
title: "Your post title"
description: "A one-line summary."
pubDate: 2025-07-24
tags: ["essay", "writing"]
featured: true
---

> [!tip] Tip box
> This will render as a styled callout.

Your content here. Standard Markdown works. MDX components work in `.mdx` files.
```

### Callout syntax

GitHub-style admonitions are supported:

```md
> [!note]
> This is a note.

> [!tip] Custom title
> This is a tip with a custom title.

> [!warning]
> This is a warning.
```

Supported types: `note`, `info`, `tip`, `warning` (or `caution`), `danger`, `success`.

## Getting started

```bash
# install deps
npm install

# start the dev server (http://localhost:4321)
npm run dev

# build for production (output in ./dist)
npm run build

# preview the production build locally
npm run preview
```

## Customization

- **Site name, author, bio, social links, newsletter slug** — `src/lib/site.ts`
- **Colors, fonts, spacing, callout styles, print styles** — `src/styles/global.css`
- **Navigation items** — `src/components/Header.astro`
- **Posts per page** — `SITE.postsPerPage` in `src/lib/site.ts`

## Project structure

```
astro-blog/
├── public/
│   ├── favicon.svg
│   └── site.webmanifest
├── src/
│   ├── components/
│   │   ├── AuthorBio.astro
│   │   ├── BackToTop.astro
│   │   ├── ClapButton.astro
│   │   ├── CodeBlockEnhancer.astro
│   │   ├── FeaturedPost.astro
│   │   ├── FloatingShare.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── HighlightShare.astro
│   │   ├── KeyboardShortcuts.astro
│   │   ├── MidArticleCTA.astro
│   │   ├── MobileTOC.astro
│   │   ├── PostCard.astro
│   │   ├── ReadingProgress.astro
│   │   ├── RelatedPosts.astro
│   │   ├── SeriesNav.astro
│   │   ├── ShareButtons.astro
│   │   ├── SubscribeForm.astro
│   │   ├── TableOfContents.astro
│   │   ├── ThemeScript.astro
│   │   ├── ThemeToggle.astro
│   │   └── TopicCloud.astro
│   ├── content/
│   │   └── blog/         # ← your posts live here
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── PostLayout.astro
│   ├── lib/
│   │   ├── format.ts          # date + reading time helpers
│   │   ├── rehype-enhance-blocks.ts  # code/img enhancement plugin
│   │   ├── remark-callouts.ts        # admonition plugin
│   │   ├── search-index.ts    # builds the search JSON
│   │   └── site.ts            # site config
│   ├── pages/
│   │   ├── 404.astro
│   │   ├── about.astro
│   │   ├── archive.astro
│   │   ├── index.astro
│   │   ├── posts/[...slug].astro
│   │   ├── search.astro
│   │   ├── search.json.ts
│   │   ├── tags/[tag].astro
│   │   └── rss.xml.ts
│   ├── styles/
│   │   └── global.css
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Deploying

The site builds to static HTML in `dist/`. Deploy it anywhere that serves static files:

- **Cloudflare Pages** — connect the repo, build command `npm run build`, output directory `dist`
- **Vercel** — auto-detected as an Astro project
- **Netlify** — build command `npm run build`, publish directory `dist`
- **GitHub Pages** — push `dist/` to a `gh-pages` branch

Before deploying, update `site:` in `astro.config.mjs` to your real URL — this is used for canonical URLs, the RSS feed, JSON-LD, and the sitemap.

## Newsletter (Paragraph embed)

The subscribe form uses the [Paragraph](https://paragraph.com) embeddable iframe. There is no server-side form handler — the iframe loads directly from `paragraph.com/@<slug>/embed` and handles email capture, validation, and confirmation entirely on Paragraph's side.

To use your own Paragraph community, edit `src/lib/site.ts`:

```ts
newsletter: {
  slug: 'your-paragraph-slug',
  // embedUrl is computed automatically
},
```

The iframe appears in three places on every post:
- **Mid-article CTA** (in MDX posts via `<MidArticleCTA />`)
- **Post footer CTA** (the `#subscribe` section)
- **Homepage band** (between recent posts and the archive link)

The header "Subscribe" pill smooth-scrolls to the nearest of these.

### Customizing the embed

The iframe's appearance is fixed by Paragraph (it always loads from their domain), so dark-mode styling of the form fields is not directly controllable. The wrapping `.subscribe-embed` container is styled via `src/components/SubscribeForm.astro`'s `<style>` block — you can adjust the border, max-width, and rounding there.

### Switching to a different provider

If you'd rather use Buttondown, ConvertKit, Beehiiv, or Mailchimp, replace `src/components/SubscribeForm.astro` with a form that posts to your provider's endpoint. The component is small and well-documented.
