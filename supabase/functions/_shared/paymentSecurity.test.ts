import { checkoutOwnedBy, trustedCheckoutOrigin } from "./paymentSecurity.ts";

function eq(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}
function throws(callback: () => unknown, message: string) {
  try { callback(); } catch { return; }
  throw new Error("Expected rejection: " + message);
}

Deno.test("canonical Stripe return origin is server-specified and HTTPS", () => {
  eq(trustedCheckoutOrigin("https://taxcenda.example.invalid"), "https://taxcenda.example.invalid", "configured origin");
  throws(() => trustedCheckoutOrigin(undefined), "missing configuration");
  throws(() => trustedCheckoutOrigin("http://example.invalid"), "unsafe scheme");
  throws(() => trustedCheckoutOrigin("https://good.invalid@evil.invalid/path"), "origin credentials/path");
  throws(() => trustedCheckoutOrigin("https://good.invalid/?return=evil"), "query");
  throws(() => trustedCheckoutOrigin("http://localhost:5173"), "local HTTP disabled");
  eq(trustedCheckoutOrigin("http://localhost:5173", true), "http://localhost:5173", "local HTTP explicit opt-in");
});

Deno.test("only Stripe sessions owned by the authenticated account are verified", () => {
  eq(checkoutOwnedBy("u1", "u1", "u1", "u1"), true, "new session");
  eq(checkoutOwnedBy("u1", null, "u1", "u1"), true, "legacy session with owner metadata");
  eq(checkoutOwnedBy(undefined, undefined, "u1", "u1"), false, "missing metadata");
  eq(checkoutOwnedBy("u2", "u2", "u1", "u1"), false, "foreign metadata");
  eq(checkoutOwnedBy("u1", "u2", "u1", "u1"), false, "foreign reference");
  eq(checkoutOwnedBy("u1", "u1", "u2", "u1"), false, "foreign payment record");
});
