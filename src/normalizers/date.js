/**
 * Normalizes a date string into YYYY-MM format.
 * Handles: ISO, "Jan 2024", "Jan-2024", "2024/01/15", "present", null.
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (s.toLowerCase() === 'present') return null;

  // Replace slashes with dashes for ISO-like formats
  const slashReplaced = s.replace(/\//g, '-');

  // Try native Date parse (handles ISO, "Jan 2024", "January 2024")
  const d = new Date(slashReplaced);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Handle "Mon-YYYY" format e.g. "Jan-2024"
  const monYearMatch = s.match(/^([A-Za-z]{3})-(\d{4})$/);
  if (monYearMatch) {
    const d2 = new Date(`${monYearMatch[1]} ${monYearMatch[2]}`);
    if (!isNaN(d2.getTime())) {
      const year = d2.getFullYear();
      const month = String(d2.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }
  }

  return null;
}

module.exports = { normalizeDate };

