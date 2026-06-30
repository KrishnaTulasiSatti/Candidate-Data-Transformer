// src/normalizers/email.js
/**
 * Normalizes an email address:
 *   - trims whitespace
 *   - lower‑cases
 *   - validates against a regex (case‑insensitive)
 * Returns null if the email does not match.
 */
function normalizeEmail(raw, regexStr) {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  const regex = new RegExp(regexStr, 'i');
  return regex.test(trimmed) ? trimmed : null;
}

module.exports = { normalizeEmail };
