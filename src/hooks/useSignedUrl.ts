import { useEffect, useState } from "react";
import { getSignedUrl } from "@/lib/storage";

/** Resolves a private storage object into a short-lived signed URL. */
export const useSignedUrl = (bucket: string, value?: string | null, expiresIn = 3600) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!value) {
      setUrl(null);
      return;
    }
    getSignedUrl(bucket, value, expiresIn).then((signed) => {
      if (active) setUrl(signed);
    });
    return () => {
      active = false;
    };
  }, [bucket, value, expiresIn]);

  return url;
};
