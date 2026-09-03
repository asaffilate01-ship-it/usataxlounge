# TaxCenda workflow rollout

This release adds the provider-independent parts of the TaxCaddy parity work:

- annual organizer templates, custom requests, due dates and recurring reminders;
- invoices with Stripe Checkout for cards and US bank accounts;
- signed, idempotent Stripe webhook processing for asynchronous ACH results;
- federal, state and local tax-payment vouchers with client reporting and professional verification;
- household/delegate invitations with revocable access levels;
- client-owned, revocable connections to tax firms;
- contextual message subjects, client activity history and document annotations;
- device-session registration and revocation;
- provider-gated institution-document retrieval requests.

## Production setup

Apply `supabase/migrations/20260903090000_taxcaddy_parity_workflows.sql`, then deploy these functions:

```sh
supabase functions deploy create-invoice-payment
supabase functions deploy stripe-webhook
supabase functions deploy send-household-invite
supabase functions deploy process-organizer-reminders
supabase functions deploy verify-payment
```

Configure the existing `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` secrets, plus:

- `PUBLIC_SITE_URL=https://usa.taxlounge.co.uk`
- `STRIPE_WEBHOOK_SECRET` from the Stripe webhook endpoint
- a randomly generated `CRON_SECRET`

In Stripe, send these events to the deployed `stripe-webhook` URL:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Schedule `process-organizer-reminders` once daily with an HTTP `POST` and the
`x-cron-secret` header. The processor sends at most 100 due reminders per run
and reschedules outstanding items for three days later.

## Provider boundaries

Automatic W-2/1099/1098 retrieval, direct tax-authority payments, tax-software
sync, e-file transmission and mobile push remain disabled until an approved
provider is selected and its credentials, scopes, consent language and webhook
contract are configured. TaxCenda must store provider references or tokens only;
it must never collect a client's bank or institution password directly.
