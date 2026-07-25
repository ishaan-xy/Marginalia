/**
 * Rehype plugin that enhances <pre><code> blocks:
 *  - Wraps in a <figure class="code-block"> with a header showing language + copy button
 *  - The copy button is wired up client-side by a global script (CodeBlockEnhancer.astro)
 *
 * Also enhances <img> by wrapping in <figure><figcaption> when alt text is present.
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
  };
}
