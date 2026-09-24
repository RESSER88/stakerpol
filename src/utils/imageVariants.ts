/**
 * Returns a small resized variant URL for Supabase Storage public images
 * (on-the-fly transformation, originals untouched). Other URLs are returned as-is.
 */
export const getThumbnailUrl = (url: string, width = 240, height = 320): string => {
  if (!url || !url.includes('/storage/v1/object/public/')) return url;
  const base = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}width=${width}&height=${height}&resize=cover&quality=75`;
};
