export const SITE = {
  title: 'Marginalia',
  // Long-form description — shown on the homepage hero, used in the RSS
  // channel description, and embedded in JSON-LD structured data.
  description:
    'Marginalia is a space for the intellectually curious—people who read not just to absorb, but to start a conversation. We believe the best ideas aren\u2019t found in the headlines. They\u2019re hiding in the questions, the contradictions, and the small, quiet thoughts you jot down in the margins. Our goal is to challenge the main story, question what everyone takes for granted, and uncover the gems that others miss. Think of this as your invitation to pull up a chair and write in the margins with us.',
  // Short tagline (~110 chars) — used as the default SEO meta description
  // for pages that don't define their own. Stays under the ~155-char limit
  // Google uses for search result snippets.
  tagline:
    'Marginalia is a space for the intellectually curious\u2014people who read not just to absorb, but to start a conversation.',
  author: 'Your Name',
  email: 'hello@your-blog.example.com',
  url: typeof process !== 'undefined'
    ? (process.env.CF_PAGES_URL || process.env.SITE_URL || 'https://marginalia-dav.pages.dev')
    : 'https://marginalia-dav.pages.dev',
  // Author bio shown at the bottom of posts
  bio: 'Writes in the margins. Curious about software, design, attention, and the questions hiding underneath the obvious ones. Slow to publish, slower to be sure.',
  // Social links shown in header/footer
  social: {
    twitter: 'https://twitter.com/yourhandle',
    github: 'https://github.com/yourhandle',
    linkedin: 'https://linkedin.com/in/yourhandle',
    rss: '/rss.xml',
  },
  // Newsletter signup. We use Paragraph as the newsletter provider.
  // Previously we embedded Paragraph's iframe form directly, but it had
  // persistent issues (button clipping, dark-mode contrast, slow load).
  // Now we link to Paragraph's hosted subscribe modal — opens in a new tab,
  // user completes signup there, returns to the original article when done.
  newsletter: {
    // Paragraph community slug.
    slug: 'marginalia',
    // The embed URL — kept for backwards compat (some places may still
    // reference it). Renders the form in an iframe on paragraph.com.
    get embedUrl() {
      return `https://paragraph.com/@${this.slug}/embed`;
    },
    // Subscribe URL — opens Paragraph's hosted subscribe modal directly.
    // UX: user clicks "Subscribe" button on our site → new tab opens with
    // the modal pre-loaded → user enters email → success state → closes tab
    // → returns to the article they were reading.
    get subscribeUrl() {
      return `https://paragraph.com/@${this.slug}?modal=subscribe&subscribeStep=enter-email`;
    },
  },
  // How many posts to show on the homepage (excluding the featured one)
  postsPerPage: 8,
  // Words per minute for reading-time estimate
  wordsPerMinute: 240,
  // Comments via Giscus (GitHub Discussions backend). Free, no auth required
  // beyond a GitHub account. To enable:
  //   1. Enable Discussions on your GitHub repo (Settings → Features)
  //   2. Install the giscus app: https://github.com/apps/giscus
  //   3. Visit https://giscus.app to generate repoId + categoryId
  //   4. Fill in the values below. Comments appear at the end of every post.
  // When repoId is empty (default), the Comments component renders nothing.
  comments: {
    repo: 'ishaan-xy/Marginalia',
    repoId: '', // ← set this to enable comments
    category: 'Announcements',
    categoryId: '', // ← set this to enable comments
    mapping: 'pathname' as const,
    reactionsEnabled: true,
    inputPosition: 'top' as const,
    lang: 'en',
  },
} as const;

export type Site = typeof SITE;
