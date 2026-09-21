import { describe, expect, it } from 'vitest';
import { buildSearchFilter, escapeRegExp } from '@/lib/search';

describe('escapeRegExp', () => {
  it.each([
    ['dental.', 'dental\\.'],
    ['a*b', 'a\\*b'],
    ['(a)+', '\\(a\\)\\+'],
    ['[abc]', '\\[abc\\]'],
    ['a|b', 'a\\|b'],
    ['^start$', '\\^start\\$'],
    ['{2,3}', '\\{2,3\\}'],
    ['back\\slash', 'back\\\\slash'],
    ['price?', 'price\\?'],
  ])('escapes %s so it is matched literally', (input, expected) => {
    expect(escapeRegExp(input)).toBe(expected);
  });

  it('leaves plain text untouched', () => {
    expect(escapeRegExp('weekend opening hours')).toBe('weekend opening hours');
  });

  it('neutralises a catastrophic backtracking payload', () => {
    // The old implementation interpolated this straight into `$regex`.
    expect(escapeRegExp('(a+)+$')).toBe('\\(a\\+\\)\\+\\$');
  });
});

describe('buildSearchFilter', () => {
  it('returns null when there is nothing to search for', () => {
    expect(buildSearchFilter('')).toBeNull();
    expect(buildSearchFilter('   ')).toBeNull();
  });

  it('searches topic, business name and content case-insensitively', () => {
    const filter = buildSearchFilter('dental');

    expect(filter).toEqual({
      $or: [
        { topic: { $regex: 'dental', $options: 'i' } },
        { businessName: { $regex: 'dental', $options: 'i' } },
        { content: { $regex: 'dental', $options: 'i' } },
      ],
    });
  });

  it('escapes the term before it reaches the query', () => {
    const filter = buildSearchFilter('.*');

    expect(filter).toEqual({
      $or: [
        { topic: { $regex: '\\.\\*', $options: 'i' } },
        { businessName: { $regex: '\\.\\*', $options: 'i' } },
        { content: { $regex: '\\.\\*', $options: 'i' } },
      ],
    });
  });

  it('trims surrounding whitespace', () => {
    const filter = buildSearchFilter('  cafe  ') as { $or: { topic: { $regex: string } }[] };
    expect(filter.$or[0].topic.$regex).toBe('cafe');
  });
});
