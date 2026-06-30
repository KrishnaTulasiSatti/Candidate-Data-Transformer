// tests/normalizers/date.test.js
const { normalizeDate } = require('../../src/normalizers/date');

describe('normalizeDate', () => {
  test('returns null for null input', () => {
    expect(normalizeDate(null)).toBeNull();
    expect(normalizeDate(undefined)).toBeNull();
    expect(normalizeDate('')).toBeNull();
  });

  test('returns null for "present" (case-insensitive)', () => {
    expect(normalizeDate('present')).toBeNull();
    expect(normalizeDate('Present')).toBeNull();
    expect(normalizeDate('PRESENT')).toBeNull();
  });

  test('parses ISO date string', () => {
    expect(normalizeDate('2020-01-15')).toBe('2020-01');
  });

  test('parses full ISO datetime string', () => {
    expect(normalizeDate('2021-06-01T00:00:00.000Z')).toBe('2021-06');
  });

  test('parses slash-separated date (YYYY/MM/DD)', () => {
    expect(normalizeDate('2022/03/10')).toBe('2022-03');
  });

  test('parses "Mon YYYY" format', () => {
    expect(normalizeDate('Jan 2024')).toBe('2024-01');
    expect(normalizeDate('December 2023')).toBe('2023-12');
  });

  test('parses "Mon-YYYY" format', () => {
    expect(normalizeDate('Jan-2024')).toBe('2024-01');
    expect(normalizeDate('Jun-2020')).toBe('2020-06');
  });

  test('returns null for completely invalid string', () => {
    expect(normalizeDate('not-a-date')).toBeNull();
    expect(normalizeDate('abc xyz')).toBeNull();
  });
});
