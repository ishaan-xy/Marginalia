/**
 * Strip markdown syntax from raw markdown text.
 * Used by both search-index.ts (for indexing) and format.ts (for reading time).
 */
export function stripMarkdown(src: string): string {
  return src
    // Remove frontmatter
    .replace(/^---[\s\S]*?---\n/, '')
    // Remove code fences entirely
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown syntax
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
