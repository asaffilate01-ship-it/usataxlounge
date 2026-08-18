const KEY = "taxnuvia-preview-access";

/** Promo-only gate. Not a security control — the portal itself is protected by real auth. */
export const ACCESS_CODES = ["taxnuvia2026", "nuvia-preview"];

export const hasPreviewAccess = () => {
  try {
    return localStorage.getItem(KEY) === "granted";
  } catch {
    return false;
  }
};

export const grantPreviewAccess = () => {
  try {
    localStorage.setItem(KEY, "granted");
  } catch {
    /* ignore */
  }
};

export const checkAccessCode = (code: string) =>
  ACCESS_CODES.includes(code.trim().toLowerCase());
