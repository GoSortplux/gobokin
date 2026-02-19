export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

export const createVenueSlug = (name: string, id: string, slug?: string) => {
  return slug || slugify(name);
};

/**
 * @deprecated Slugs no longer contain IDs. Use the slug directly to fetch venues.
 */
export const extractIdFromSlug = (slug: string) => {
  const parts = slug.split('-');
  return parts[parts.length - 1];
};
