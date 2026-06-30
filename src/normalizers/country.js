const countryMap = {
  'us': 'US',
  'united states': 'US',
  'usa': 'US',
  'uk': 'GB',
  'united kingdom': 'GB',
  'india': 'IN',
  'in': 'IN',
  'canada': 'CA',
  'ca': 'CA',
  'australia': 'AU',
  'au': 'AU',
  'germany': 'DE',
  'de': 'DE',
  'france': 'FR',
  'fr': 'FR',
  'singapore': 'SG',
  'sg': 'SG',
  'uae': 'AE',
  'united arab emirates': 'AE'
};

/**
 * Parses a raw location string (comma-separated) into { city, region, country }.
 * Handles:
 *   - "City, Region, Country"   -> full parse
 *   - "City, Country"           -> city + country (no region)
 *   - "City"                    -> city only
 *   - null / undefined          -> null
 */
function normalizeLocation(rawLocation) {
  if (!rawLocation || typeof rawLocation !== 'string') return null;
  const normalized = { city: null, region: null, country: null };
  const parts = rawLocation.split(',').map(s => s.trim()).filter(Boolean);

  if (parts.length === 0) return null;

  if (parts.length >= 3) {
    normalized.city = parts[0];
    normalized.region = parts[1];
    const c = parts[parts.length - 1].toLowerCase();
    normalized.country = countryMap[c] || parts[parts.length - 1];
  } else if (parts.length === 2) {
    // Could be "City, Country" or "City, Region"
    const possibleCountry = parts[1].toLowerCase();
    if (countryMap[possibleCountry]) {
      normalized.city = parts[0];
      normalized.country = countryMap[possibleCountry];
    } else {
      normalized.city = parts[0];
      normalized.region = parts[1];
    }
  } else {
    normalized.city = parts[0];
  }

  return normalized;
}

module.exports = { normalizeLocation };

