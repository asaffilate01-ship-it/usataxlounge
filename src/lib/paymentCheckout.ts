/** Prevent browser redirects to arbitrary origins returned by an API. */
export const isTrustedStripeCheckoutUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "checkout.stripe.com"
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
};
