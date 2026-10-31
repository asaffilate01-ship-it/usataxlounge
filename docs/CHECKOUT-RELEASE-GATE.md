# TaxCenda Stripe Checkout deployment gate

**No Edge Function has been deployed by this PR.** Checkout now needs server-only `TAXCENDA_SITE_URL` set to the public HTTPS origin of the TaxCenda web frontend. Never derive a payment-return URL from the request Origin or Referer. Optional `TAXCENDA_ALLOW_LOCAL_HTTP=true` is only for localhost development. Retain `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` and other privileged credentials in Edge Function secrets.

- Validates authorised user and an allowlisted plan, records a pending Checkout before redirect, and tries to expire orphan sessions.
- Uses Stripe client_reference_id + metadata user_id; verifying payment requires a local payment record belonging to the same signed-in account and matching Stripe metadata.
- Uses Stripe's returned payment_status, never an unverified browser query string, to report payment.
- Requires the marketing price/currency for each plan to be checked against the **live Stripe Price object** before charging anyone. No amounts or credentials have been verified here.
- The checkout-success page must not imply a tax engagement has been accepted/confirmed merely because the payment was paid.
- Full TEST-mode integration, webhook events, chargebacks, session expiry, idempotency, and reconciliation remain release blockers.
- Deno unit tests cover trusted return origins and ownership; browser tests cover Stripe-hosted URL checks.

The server-only `TAXCENDA_SITE_URL` setting must be configured and actual Stripe sessions exercised in a staging environment before deployment.
