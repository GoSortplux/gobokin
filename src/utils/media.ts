export const isVideo = (url: string | undefined | null) => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].split('#')[0];
  return /\.(mp4|webm|ogg|mov|avi)$/i.test(cleanUrl) || url.includes('/video/upload/');
};

export const getMediaThumbnail = (url: string | undefined | null) => {
  if (!url) return '/venue_default.jpg';

  // Handle Cloudinary legacy thumbnails
  if (url.includes('/video/upload/')) {
    return url.replace(/\.[^/.]+$/, ".jpg");
  }

  // For R2 or other URLs, return as is (browser handles video/image display)
  return url;
};

/**
 * Reorders media so that an image is shown first if available.
 * The rest of the media maintains its relative order (videos then remaining images).
 */
export const getReorderedMedia = (videos: string[] | null | undefined, images: string[] | null | undefined) => {
  const v = videos || [];
  const i = images || [];
  if (i.length === 0) return [...v];

  const [firstImage, ...remainingImages] = i;
  return [firstImage, ...v, ...remainingImages];
};
