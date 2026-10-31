/** Stripe redirect hosts must come from deployment config, never the incoming Origin. */
export function trustedCheckoutOrigin(site: string | undefined, localHttp = false): string {
  if (!site) throw new Error("TAXCENDA_SITE_URL must be configured");
  let url: URL;
  try { url = new URL(site); } catch { throw new Error("Invalid TAXCENDA_SITE_URL"); }
  const local = localHttp && url.protocol === "http:" && ["localhost","127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !local) throw new Error("Checkout redirects require HTTPS");
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/")
    throw new Error("Checkout redirects require a bare trusted site origin");
  return url.origin;
}

/** Missing Stripe identity or a missing/mismatched local payment record fail closed. */
export function checkoutOwnedBy(
  stripeMetadataUser: string | null | undefined,
  stripeReferenceUser: string | null | undefined,
  recordedUser: string | null | undefined,
  authenticatedUser: string,
): boolean {
  return Boolean(authenticatedUser) && stripeMetadataUser === authenticatedUser
    && recordedUser === authenticatedUser
    && (!stripeReferenceUser || stripeReferenceUser === authenticatedUser);
}
