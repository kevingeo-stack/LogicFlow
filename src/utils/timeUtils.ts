/**
 * Utility functions for timestamp normalization and formatting.
 */

/**
 * Normalizes any timestamp (ISO string, epoch number, Date object, or legacy format) 
 * into a UNIX epoch number (milliseconds since 1970) for deterministic comparison.
 * 
 * @param ts The timestamp to normalize
 * @returns The epoch time in milliseconds. Returns 0 if invalid.
 */
export function normalizeTimestamp(ts: string | number | Date | null | undefined): number {
  if (ts == null) return 0;
  
  if (typeof ts === 'number') {
    return ts;
  }
  
  if (ts instanceof Date) {
    const time = ts.getTime();
    return isNaN(time) ? 0 : time;
  }
  
  // It's a string
  const str = ts.trim();
  if (str === '') return 0;
  
  // Try standard parsing first (ISO, standard formats)
  const standardParsed = Date.parse(str);
  if (!isNaN(standardParsed)) {
    return standardParsed;
  }
  
  // Try legacy format: "Oct 24, 2024 · 14:32"
  // We can just replace the '·' with '' and parse
  const legacyCleaned = str.replace('·', '').trim();
  const legacyParsed = Date.parse(legacyCleaned);
  if (!isNaN(legacyParsed)) {
    return legacyParsed;
  }
  
  // If we reach here, it's an unrecognized format.
  console.warn(`[timeUtils] normalizeTimestamp encountered unrecognized format: "${str}"`);
  return 0;
}

/**
 * Formats an ISO string, Date, epoch, or legacy string into a human-readable display string.
 * Example output: "Oct 24, 2024 · 14:32"
 */
export function formatDisplayDate(ts: string | number | Date | null | undefined): string {
  if (!ts) return 'Unknown Date';
  
  const epoch = normalizeTimestamp(ts);
  if (epoch === 0) {
    // If we can't parse it but it's a string, maybe just return it as a fallback
    return typeof ts === 'string' ? ts : 'Unknown Date';
  }
  
  const date = new Date(epoch);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
