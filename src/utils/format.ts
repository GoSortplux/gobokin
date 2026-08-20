/**
 * Converts a full name string to initials (first and last word first letters).
 * E.g., "Stephen Ayomide Ibitoye" -> "S.I."
 * "Stephen" -> "S."
 * "" or undefined -> "U."
 */
export const getInitials = (name?: string | null): string => {
  if (!name || typeof name !== 'string') return 'U.';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'U.';
  if (words.length === 1) {
    return `${words[0][0].toUpperCase()}.`;
  }
  const first = words[0][0].toUpperCase();
  const last = words[words.length - 1][0].toUpperCase();
  return `${first}.${last}.`;
};
