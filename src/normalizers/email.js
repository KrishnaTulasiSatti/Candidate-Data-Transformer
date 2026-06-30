// src/normalizers/email.js
/**
 * Normalizes an email address:
 *   - trims whitespace
 *   - lower‑cases
 *   - validates against a regex (case‑insensitive)
 * Returns null if the email does not match.
 */
// Define a function that cleans up email addresses
function normalizeEmail(email, regexStr) {
 
  if (!email) return null;
  

  const cleaned = String(email).trim().toLowerCase();
  
 
  if (regexStr) {
    if (!new RegExp(regexStr, 'i').test(cleaned)) {
      return null;
    }
  }
  

  return cleaned;
}


module.exports = { normalizeEmail };
