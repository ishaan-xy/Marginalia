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
  url: 'https://your-blog.example.com',
  // Author bio shown at the bottom of posts
  bio: 'Writes in the margins. Curious about software, design, attention, and the questions hiding underneath the obvious ones. Slow to publish, slower to be sure.',
  // Social links shown in header/footer
  social: {
    twitter: 'https://twitter.com/yourhandle',
    github: 'https://github.com/yourhandle',
    linkedin: 'https://linkedin.com/in/yourhandle',
    rss: '/rss.xml',
  },
  // Newsletter signup. We use the Paragraph embed iframe for actual
  // signups — no server-side form handler needed.
  newsletter: {
    // Paragraph community slug. The iframe loads from paragraph.com/@<slug>/embed
    slug: 'marginalia',
    // Constructed embed URL (used by SubscribeForm.astro)
    get embedUrl() {
      return `https://paragraph.com/@${this.slug}/embed`;
    },
  },
  // How many posts to show on the homepage (excluding the featured one)
  postsPerPage: 8,
  // Words per minute for reading-time estimate
  wordsPerMinute: 240,
} as const;

export type Site = typeof SITE;
