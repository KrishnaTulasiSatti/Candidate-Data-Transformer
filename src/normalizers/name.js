// src/normalizers/name.js
/**
 * Normalizes a full name:
 *   - trims surrounding whitespace
 *   - collapses multiple spaces
 *   - Title‑cases each part (e.g. "john  doe" → "John Doe")
 */
function normalizeFullName(raw) {
  if (!raw) return null;
  return raw
    .trim()
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

module.exports = { normalizeFullName };
