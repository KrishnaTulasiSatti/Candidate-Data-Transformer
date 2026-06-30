// tests/normalizers/phone.test.js
const { normalizePhone } = require('../../src/normalizers/phone');

describe('normalizePhone', () => {
  test('returns null for null/undefined/empty', () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('   ')).toBeNull();
  });

  test('formats valid E.164 number as-is', () => {
    expect(normalizePhone('+918790369062')).toBe('+918790369062');
  });

  test('normalizes Indian number with spaces', () => {
    expect(normalizePhone('+91 879 036 9062')).toBe('+918790369062');
  });

  test('normalizes US number with dashes', () => {
    expect(normalizePhone('415-555-2671')).toBe('+14155552671');
  });

  test('normalizes US number with parentheses', () => {
    expect(normalizePhone('(415) 555-2671')).toBe('+14155552671');
  });

  test('returns null for garbage string', () => {
    expect(normalizePhone('not-a-phone')).toBeNull();
    expect(normalizePhone('hello world')).toBeNull();
  });
});
