import { supabase } from "@/integrations/supabase/client";

/**
 * Buckets are private. Legacy rows may still hold full public URLs, so we
 * normalise any stored value back to a bucket-relative object path.
 */
export const toStoragePath = (bucket: string, value?: string | null): string | null => {
  if (!value) return null;
  if (!value.includes("://")) return value.replace(/^\/+/, "");
  const marker = `/${bucket}/`;
  const idx = value.indexOf(marker);
  if (idx === -1) return null;
  try {
    return decodeURIComponent(value.slice(idx + marker.length).split("?")[0]);
  } catch {
    return value.slice(idx + marker.length).split("?")[0];
  }
};

export const getSignedUrl = async (
  bucket: string,
  value?: string | null,
  expiresIn = 3600,
): Promise<string | null> => {
  const path = toStoragePath(bucket, value);
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
};

export const openSigned = async (bucket: string, value?: string | null) => {
  const url = await getSignedUrl(bucket, value);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
  return url;
};
