import { describe, expect, it } from "vitest";
import { isTrustedStripeCheckoutUrl } from "@/lib/paymentCheckout";

describe("Stripe checkout destination", () => {
  it("allows Stripe hosted checkout over HTTPS", () => {
    expect(isTrustedStripeCheckoutUrl("https://checkout.stripe.com/c/pay/cs_test_123")).toBe(true);
  });
  it("blocks arbitrary, lookalike, non-HTTPS and credentialed URLs", () => {
    for (const url of [
      undefined, "", "javascript:alert(1)", "http://checkout.stripe.com",
      "https://checkout.stripe.com.evil.invalid/c/pay",
      "https://checkout.stripe.com@evil.invalid/c/pay",
      "https://evil.invalid@checkout.stripe.com/c/pay",
      "//checkout.stripe.com/c/pay", "https://stripe.com/c/pay",
    ]) expect(isTrustedStripeCheckoutUrl(url)).toBe(false);
  });
});
