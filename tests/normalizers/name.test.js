// tests/normalizers/name.test.js
const { normalizeFullName } = require('../../src/normalizers/name');

describe('normalizeFullName', () => {
  test('returns null for null input', () => {
    expect(normalizeFullName(null)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(normalizeFullName('')).toBeNull();
  });

  test('trims surrounding whitespace', () => {
    expect(normalizeFullName('  Alice  ')).toBe('Alice');
  });

  test('collapses multiple spaces between words', () => {
    expect(normalizeFullName('john   doe')).toBe('John Doe');
  });

  test('title-cases all parts', () => {
    expect(normalizeFullName('john doe')).toBe('John Doe');
    expect(normalizeFullName('ALICE SMITH')).toBe('Alice Smith');
    expect(normalizeFullName('alice SMITH')).toBe('Alice Smith');
  });

  test('handles single word name', () => {
    expect(normalizeFullName('krishna')).toBe('Krishna');
  });

  test('handles three-part name', () => {
    expect(normalizeFullName('krishna tulasi satti')).toBe('Krishna Tulasi Satti');
  });

  test('handles leading/trailing whitespace with mixed case', () => {
    expect(normalizeFullName('  john   DOE  ')).toBe('John Doe');
  });
});
