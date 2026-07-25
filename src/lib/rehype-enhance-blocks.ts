/**
 * Rehype plugin that enhances:
 *  - <pre><code> blocks: wraps in <figure class="code-block"> with header (lang + copy button)
 *  - <img>: wraps in <figure><figcaption> when alt text is present
 *  - <h2>/<h3>: wraps heading text in an <a href="#id"> for permalink anchors
 */
import { visit } from 'unist-util-visit';

export function rehypeEnhanceBlocks() {
  return (tree: any) => {
    // Code blocks
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre') return;
      const code = (node.children ?? []).find(
        (c: any) => c.type === 'element' && c.tagName === 'code'
      );
      if (!code) return;

      // Detect language from className like "language-ts"
      const cls = code.properties?.className ?? [];
      const langClass = Array.isArray(cls) ? cls.find((c: string) => c.startsWith('language-')) : null;
      const lang = langClass ? langClass.replace('language-', '') : '';

      // Don't double-wrap
      if (parent?.tagName === 'figure' && parent.properties?.className?.includes('code-block')) return;

      const figure = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['code-block', lang ? `lang-${lang}` : ''].filter(Boolean) },
        children: [
          {
            type: 'element',
            tagName: 'figcaption',
            properties: { className: ['code-block-header'] },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: { className: ['code-block-lang'] },
                children: [{ type: 'text', value: lang || 'code' }],
              },
              {
                type: 'element',
                tagName: 'button',
                properties: {
                  className: ['code-block-copy'],
                  type: 'button',
                  'aria-label': 'Copy code',
                  title: 'Copy',
                },
                children: [
                  {
                    type: 'element',
                    tagName: 'svg',
                    properties: {
                      xmlns: 'http://www.w3.org/2000/svg',
                      width: '14',
                      height: '14',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'currentColor',
                      'stroke-width': '2',
                      'stroke-linecap': 'round',
                      'stroke-linejoin': 'round',
                    },
                    children: [
                      { type: 'element', tagName: 'rect', properties: { x: '9', y: '9', width: '13', height: '13', rx: '2' } },
                      { type: 'element', tagName: 'path', properties: { d: 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1' } },
                    ],
                  },
                ],
              },
            ],
          },
          node,
        ],
      };

      if (parent && typeof index === 'number') {
        parent.children[index] = figure;
      }
    });

    // Images with alt text → figure/figcaption
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'img') return;
      const alt = (node.properties?.alt ?? '').toString().trim();
      if (!alt) return;
      if (parent?.tagName === 'figure') return; // already wrapped

      const figure = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['image-block'] },
        children: [
          node,
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: [{ type: 'text', value: alt }],
          },
        ],
      };

      if (parent && typeof index === 'number') {
        parent.children[index] = figure;
      }
    });

    // Heading permalink anchors — wrap heading text in <a href="#id">
    // The # glyph appears on hover via CSS (::before on the <a>).
    // Note: Astro's built-in rehype-slug runs AFTER user plugins, so heading
    // IDs may not be set yet. We generate a slug from the heading text if the
    // ID is missing. When rehype-slug runs later, it will find the ID already
    // set and skip (no overwrite).
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'h2' && node.tagName !== 'h3') return;

      // Get or generate the heading ID
      let id = node.properties?.id;
      if (!id) {
        // Extract text content from heading children
        const text = (node.children ?? [])
          .map((c: any) => {
            if (c.type === 'text') return c.value;
            if (c.type === 'element') return ''; // ignore nested elements
            return '';
          })
          .join('');
        // Generate slug matching rehype-slug's algorithm
        id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        node.properties = node.properties || {};
        node.properties.id = id;
      }

      // Don't double-wrap if heading children already contain an <a>
      const hasLink = (node.children ?? []).some(
        (c: any) => c.type === 'element' && c.tagName === 'a'
      );
      if (hasLink) return;

      // Wrap existing children in an <a> tag
      node.children = [{
        type: 'element',
        tagName: 'a',
        properties: {
          href: `#${id}`,
          className: ['header-anchor'],
          'aria-label': 'Link to this section',
        },
        children: node.children,
      }];
    });
  };
}

