// tests/normalizers/email.test.js
const path = require('path');
const config = require(path.resolve(__dirname, '../../data/config.json'));
const { normalizeEmail } = require('../../src/normalizers/email');

const regexStr = config.email_regex;

describe('normalizeEmail', () => {
  test('returns null for null input', () => {
    expect(normalizeEmail(null, regexStr)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(normalizeEmail('', regexStr)).toBeNull();
  });

  test('lowercases valid email', () => {
    expect(normalizeEmail('USER@Example.COM', regexStr)).toBe('user@example.com');
  });

  test('trims surrounding whitespace before validating', () => {
    expect(normalizeEmail('  user@example.com  ', regexStr)).toBe('user@example.com');
  });

  test('returns null for email missing @', () => {
    expect(normalizeEmail('invalidemail.com', regexStr)).toBeNull();
  });

  test('returns null for email missing domain', () => {
    expect(normalizeEmail('user@', regexStr)).toBeNull();
  });

  test('returns null for email missing TLD', () => {
    expect(normalizeEmail('user@domain', regexStr)).toBeNull();
  });

  test('returns null for plain garbage string', () => {
    expect(normalizeEmail('not-an-email', regexStr)).toBeNull();
  });

  test('accepts email with dots and plus in local part', () => {
    expect(normalizeEmail('user.name+tag@example.org', regexStr)).toBe('user.name+tag@example.org');
  });

  test('accepts email with subdomain', () => {
    expect(normalizeEmail('user@mail.example.com', regexStr)).toBe('user@mail.example.com');
  });
});
