/**
 * Remark plugin: GitHub-style admonitions.
 *
 * Converts blockquotes whose first line is `[!tip]`, `[!warning]`, `[!info]`,
 * `[!note]`, `[!danger]`, `[!success]` into callout divs.
 *
 * Uses the `data.hName` / `data.hProperties` convention so remark-rehype
 * renders the blockquote as a different element with different classes.
 * This approach works for both plain markdown AND MDX, because we mutate
 * the existing blockquote node instead of replacing it with a new node type.
 *
 * Supported syntax:
 *
 *   > [!note]
 *   > Body text goes here.
 *
 *   > [!tip] Custom title here
 *   > Body text.
 */
import { visit } from 'unist-util-visit';

const TYPE_MAP: Record<string, string> = {
  note: 'note',
  info: 'info',
  tip: 'tip',
  warning: 'warning',
  caution: 'warning',
  danger: 'danger',
  success: 'success',
  // Pull quote — magazine-style emphasized quote, visually distinct from
  // a regular blockquote (larger serif, accent border, no italic body).
  // Used 1-3 times per long post to break visual monotony and create
  // social-share moments. Renders as <blockquote class="pullquote">.
  pullquote: 'pullquote',
  quote: 'pullquote',
};

const DEFAULT_TITLES: Record<string, string> = {
  note: 'Note',
  info: 'Info',
  tip: 'Tip',
  warning: 'Warning',
  danger: 'Important',
  success: 'Success',
  // Pull quotes have no title — the quote is the whole content.
  pullquote: '',
};

function extractCallout(node: any): { type: string; title?: string; rest: any[] } | null {
  if (node.type !== 'blockquote') return null;
  const children = node.children ?? [];
  if (children.length === 0) return null;

  const first = children[0];
  if (first.type !== 'paragraph') return null;

  const firstTextChild = first.children?.[0];
  if (!firstTextChild || firstTextChild.type !== 'text') return null;

  const match = firstTextChild.value.match(/^\s*\[!([\w-]+)\]\s*(.*)$/);
  if (!match) return null;

  const rawType = match[1].toLowerCase();
  const type = TYPE_MAP[rawType];
  if (!type) return null;

  const titleOverride = match[2].trim();
  const title = titleOverride || DEFAULT_TITLES[type];

  // Reconstruct children: if there was more text on the first line, keep the paragraph minus the marker
  const restChildren: any[] = [];
  if (firstTextChild.value.slice(match[0].length).trim()) {
    restChildren.push({
      type: 'paragraph',
      children: [
        { type: 'text', value: firstTextChild.value.slice(match[0].length) },
        ...(first.children?.slice(1) ?? []),
      ],
    });
  } else {
    if (first.children && first.children.length > 1) {
      restChildren.push({
        type: 'paragraph',
        children: first.children.slice(1),
      });
    }
  }
  restChildren.push(...children.slice(1));

  return { type, title, rest: restChildren };
}

export function remarkCallouts() {
  return (tree: any) => {
    visit(tree, 'blockquote', (node) => {
      const callout = extractCallout(node);
      if (!callout) return;

      // Pull quotes get a different rendering: <blockquote class="pullquote">
      // instead of <div class="callout">, and no title/icon header.
      if (callout.type === 'pullquote') {
        node.data = node.data || {};
        node.data.hName = 'blockquote';
        node.data.hProperties = {
          className: ['pullquote'],
        };
        // Pull quote children stay as the original blockquote content
        // (the rest after stripping the [!pullquote] marker).
        node.children = callout.rest;
        return;
      }

      // Use the official remark-rehype convention: set data.hName and
      // data.hProperties on the blockquote so it renders as a <div> with
      // the callout classes. This works for both .md and .mdx files
      // because we're annotating an existing node, not creating a new one.
      node.data = node.data || {};
      node.data.hName = 'div';
      node.data.hProperties = {
        className: ['callout', `callout-${callout.type}`],
        'data-callout': callout.type,
      };

      // Prepend a title paragraph as the first child
      const titleParagraph = {
        type: 'paragraph',
        data: {
          hName: 'p',
          hProperties: { className: ['callout-title'] },
        },
        children: [
          {
            type: 'span',
            data: {
              hName: 'span',
              hProperties: { className: ['callout-icon'], 'aria-hidden': 'true' },
            },
            children: [{ type: 'html', value: iconSvg(callout.type) }],
          },
          { type: 'text', value: callout.title },
        ],
      };

      node.children = [titleParagraph, ...callout.rest];
    });
  };
}

function iconSvg(type: string): string {
  const icons: Record<string, string> = {
    note: 'M12 8v4M12 16h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z',
    info: 'M12 16v-4M12 8h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z',
    tip: 'M9 18h6M10 22h4M12 2a7 7 0 00-4 12c.5.4 1 .9 1 1.5V16h6v-1.5c0-.6.5-1.1 1-1.5a7 7 0 00-4-12z',
    warning: 'M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
    danger: 'M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
    success: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
  };
  const path = icons[type] || icons.note;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
}
