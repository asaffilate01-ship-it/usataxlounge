const KEY = "taxcenda-preview-access";

/** Promo-only gate. Not a security control — the portal itself is protected by real auth. */
export const ACCESS_CODES = ["taxcenda2026", "cenda-preview"];

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
