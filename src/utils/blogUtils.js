/**
 * Utility functions for NexRNN Blog module
 */

/**
 * Generate a URL-safe slug from a string (e.g. title)
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars except spaces & dashes
    .replace(/[\s_-]+/g, '-') // replace spaces, underscores, multiple dashes with single dash
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
}

/**
 * Calculate reading time from article text / markdown
 * Standard reading speed is ~200-220 words per minute.
 */
export function calculateReadingTime(text, wordsPerMinute = 200) {
  if (!text || typeof text !== 'string') return '1 min read';

  // Strip simple markdown tokens and HTML tags
  const clean = text
    .replace(/<[^>]*>/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#*`~_>]/g, ' ')
    .trim();

  const words = clean.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} min read`;
}

/**
 * Format a blog date string nicely (e.g. "26 Aug 2026")
 */
export function formatBlogDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
