// tests/normalizers/location.test.js
const { normalizeLocation } = require('../../src/normalizers/country');

describe('normalizeLocation', () => {
  test('returns null for null/undefined input', () => {
    expect(normalizeLocation(null)).toBeNull();
    expect(normalizeLocation(undefined)).toBeNull();
    expect(normalizeLocation('')).toBeNull();
  });

  test('parses 3-part location: City, Region, Country', () => {
    const result = normalizeLocation('Ramavaram, AndhraPradesh, India');
    expect(result).toEqual({ city: 'Ramavaram', region: 'AndhraPradesh', country: 'IN' });
  });

  test('parses 2-part location when 2nd part is a known country', () => {
    const result = normalizeLocation('Mumbai, India');
    expect(result).toEqual({ city: 'Mumbai', region: null, country: 'IN' });
  });

  test('parses 2-part location when 2nd part is a region (not a country)', () => {
    const result = normalizeLocation('San Francisco, California');
    expect(result).toEqual({ city: 'San Francisco', region: 'California', country: null });
  });

  test('parses single-part location as city only', () => {
    const result = normalizeLocation('Bangalore');
    expect(result).toEqual({ city: 'Bangalore', region: null, country: null });
  });

  test('maps country aliases to ISO codes', () => {
    expect(normalizeLocation('London, UK').country).toBe('GB');
    expect(normalizeLocation('Toronto, Ontario, Canada').country).toBe('CA');
    expect(normalizeLocation('Berlin, Germany').country).toBe('DE');
  });

  test('handles extra whitespace around parts', () => {
    const result = normalizeLocation('  New York ,  New York ,  United States  ');
    expect(result.city).toBe('New York');
    expect(result.region).toBe('New York');
    expect(result.country).toBe('US');
  });
});
