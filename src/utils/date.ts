/**
 * Formats a date string or Date object into a "Month Day, Year" format (e.g., April 17, 2026).
 *
 * @param date - The date to format (ISO string or Date object).
 * @returns The formatted date string.
 */
export const formatDateLong = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
