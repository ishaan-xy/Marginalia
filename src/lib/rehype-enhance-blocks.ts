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
                      'stroke-width': '1.75',
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

    // Images with alt text → figure/figcaption.
    // Supports `![alt | caption](url)` syntax to separate alt text (a11y)
    // from caption text (display). If no `|` separator, alt doubles as caption
    // (backwards compatible with existing posts).
    //
    // Examples:
    //   ![Diagram of the model](diagram.png)
    //     → alt="Diagram of the model", caption="Diagram of the model"
    //   ![Model architecture | Figure 3: The transformer block](model.png)
    //     → alt="Model architecture", caption="Figure 3: The transformer block"
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'img') return;
      const rawAlt = (node.properties?.alt ?? '').toString().trim();
      if (!rawAlt) return;
      if (parent?.tagName === 'figure') return; // already wrapped

      // Split on ` | ` (pipe with surrounding spaces) — pipes are uncommon
      // in alt text so this is a safe separator.
      const sepIdx = rawAlt.indexOf(' | ');
      let alt: string;
      let caption: string;
      if (sepIdx >= 0) {
        alt = rawAlt.slice(0, sepIdx).trim();
        caption = rawAlt.slice(sepIdx + 3).trim();
      } else {
        alt = rawAlt;
        caption = rawAlt;
      }

      // Update the alt attribute to be the clean a11y alt (without caption)
      node.properties = node.properties || {};
      node.properties.alt = alt;

      // If caption is empty (e.g. `![alt |](url)`), don't render a figcaption.
      // Useful for decorative images that need alt text but no visible label.
      const figureChildren: any[] = [node];
      if (caption) {
        figureChildren.push({
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: caption }],
        });
      }

      const figure = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['image-block'] },
        children: figureChildren,
      };

      if (parent && typeof index === 'number') {
        parent.children[index] = figure;
      }
    });

    // Heading permalink anchors — wrap heading text in <a href="#id">
    // The # glyph appears on hover via CSS (::before on the <a>).
    // Note: Astro's built-in rehype-slug runs AFTER user plugins, so heading
    // IDs may not be set yet. We generate a slug from the heading text if the
    // ID is missing. Duplicate headings get a numeric suffix (-1, -2, etc.)
    // to ensure unique IDs (matching github-slugger behavior).
    const headingSlugCounts = new Map<string, number>();
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

        // Handle duplicate headings — append -1, -2, etc.
        const count = headingSlugCounts.get(id) ?? 0;
        headingSlugCounts.set(id, count + 1);
        if (count > 0) {
          id = `${id}-${count}`;
        }

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

