const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

/**
 * Normalizes a phone number to E.164 format.
 * Handles: numbers with spaces, dashes, parentheses, country codes.
 * Returns null for invalid/unrecognizable phone numbers.
 */
function normalizePhone(phoneStr) {
  if (!phoneStr || typeof phoneStr !== 'string') return null;
  const trimmed = phoneStr.trim();
  if (!trimmed) return null;

  try {
    // Try parsing with country code first (e.g. +91...)
    const phoneNumber = parsePhoneNumber(trimmed);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format('E.164');
    }
  } catch (_) {}

  try {
    // Fallback: assume US if no country code
    const phoneNumber = parsePhoneNumber(trimmed, 'US');
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format('E.164');
    }
  } catch (_) {}

  // If we can't parse it, return null rather than garbage
  return null;
}

module.exports = { normalizePhone };

