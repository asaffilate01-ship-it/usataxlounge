export type CookiePreferences = {
  essential: true;
  analytics: boolean;
  functional: boolean;
};

export const CONSENT_KEY = "taxlounge-cookie-consent";
export const CONSENT_VERSION = 1;
export const COOKIE_SETTINGS_EVENT = "taxnuvia:open-cookie-settings";
export const CONSENT_CHANGE_EVENT = "taxnuvia:cookie-consent-change";

export const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  functional: false,
};

type StoredConsent = CookiePreferences & { version?: number; updated_at?: string };

export function getConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      essential: true,
      analytics: !!parsed.analytics,
      functional: !!parsed.functional,
    };
  } catch {
    return null;
  }
}

export function saveConsent(prefs: CookiePreferences) {
  const payload: StoredConsent = {
    ...prefs,
    essential: true,
    version: CONSENT_VERSION,
    updated_at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  } catch {
    /* storage unavailable */
  }
  applyConsent(payload);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: payload }));
}

export function hasConsent(category: "analytics" | "functional"): boolean {
  const consent = getConsent();
  return !!consent && consent[category];
}

/** Clears cookies/storage for categories the user has declined. */
export function applyConsent(prefs: CookiePreferences) {
  if (!prefs.analytics) clearAnalyticsCookies();
  if (!prefs.functional) clearFunctionalStorage();
}

const ANALYTICS_COOKIE_PREFIXES = ["_ga", "_gid", "_gat", "_fbp", "_hj", "ajs_"];
const FUNCTIONAL_KEYS = ["taxnuvia-recent-views", "taxnuvia-dismissed-tips"];

function clearAnalyticsCookies() {
  try {
    const host = window.location.hostname;
    const domains = [host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0]?.trim();
      if (!name) return;
      if (!ANALYTICS_COOKIE_PREFIXES.some((p) => name.startsWith(p))) return;
      domains.forEach((d) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
      });
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  } catch {
    /* noop */
  }
}

function clearFunctionalStorage() {
  try {
    FUNCTIONAL_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* noop */
  }
}

/** Store a non-essential preference only when functional cookies are allowed. */
export function setFunctionalItem(key: string, value: string) {
  if (!hasConsent("functional")) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}

/** Re-applies stored consent on app boot. */
export function initCookieConsent() {
  const consent = getConsent();
  if (consent) applyConsent(consent);
}
