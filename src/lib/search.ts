/**
 * Escapes every regular expression metacharacter so that user supplied text is
 * matched literally.
 *
 * `GET /api/posts?search=` interpolated the raw query string into a MongoDB
 * `$regex`. A value such as `.*` matched every document, a value such as `[`
 * threw a `SyntaxError` (surfacing as a 500) and nested quantifiers such as
 * `(a+)+$` could pin the CPU of the database (ReDoS).
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a case-insensitive "contains" clause for the text columns of a post.
 * Returns `null` when there is nothing to search for so callers can skip the
 * `$or` branch entirely.
 */
export function buildSearchFilter(search: string): Record<string, unknown> | null {
  const term = search.trim();
  if (!term) return null;

  const safe = escapeRegExp(term);
  return {
    $or: [
      { topic: { $regex: safe, $options: 'i' } },
      { businessName: { $regex: safe, $options: 'i' } },
      { content: { $regex: safe, $options: 'i' } },
    ],
  };
}
