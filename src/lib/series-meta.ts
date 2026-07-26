/**
 * Series-level metadata that doesn't live on individual posts.
 *
 * Each entry is keyed by the exact `series.name` string used in post
 * frontmatter. The `description` field is shown on:
 *   - the series landing page (/series/<slug>/)
 *   - the series index (/series/)
 *   - the homepage series section
 *
 * To add a new series: drop its folder into src/content/, add posts with
 * matching `series: { name, part }` frontmatter, and add an entry here.
 */
const SERIES_META: Record<string, { description: string }> = {
  'Minds & Machines': {
    description:
      'Minds & Machines is a 75-article deep-dive into the full history of Artificial Intelligence — from the ancient myths of mechanical life to the reasoning models reshaping the world today. Written for a general audience with no technical background, each article is approximately 8,000 words of narrative, immersive, story-driven history.',
  },
};

/** Get the description for a series, or undefined if not registered or empty. */
export function getSeriesDescription(seriesName: string): string | undefined {
  return SERIES_META[seriesName]?.description || undefined;
}
