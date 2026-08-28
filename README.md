# TaxCenda

TaxCenda is a secure US tax evidence, bookkeeping-review, and filing-approval workspace. Clients can upload source documents, capture receipts, enter income and expenses, answer review questions, resolve possible duplicates, maintain fixed assets, review final filing packages, and track their engagement. Tax professionals control each workflow gate through the staff review queue.

This repository contains:

- React/Vite web app and installable PWA
- Capacitor iOS and Android client apps
- Supabase database migrations, row-level security, storage policies, and edge functions
- Evidence-preserving receipt extraction and duplicate detection
- Human-controlled engagement and filing-authorization workflows

## Local setup

Requirements: Node.js 22+, npm, and a Supabase project.

```sh
npm install
npm run dev
```

The web app uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Keep service-role, e-file provider, bank-feed, and AI-provider credentials server-side only.

## Database and functions

Apply migrations before deploying the new edge functions:

```sh
npx supabase db push
npx supabase functions deploy extract-receipt
npx supabase functions deploy sign-filing-authorization
```

`extract-receipt` requires `LOVABLE_API_KEY`. Both functions validate the caller's access token themselves because native and web clients share the same endpoint configuration.

Before production rollout:

1. Back up the Supabase database and test the forward migration in staging.
2. Assign staff only through `admin`, `preparer`, `reviewer`, or `compliance` roles.
3. Confirm the `documents` and `message-attachments` buckets are private.
4. Configure an approved e-file provider or MeF channel on the server. The browser contains no IRS endpoint or credentials.
5. Verify the actual IRS signature authorization and identity requirements for every supported return type.
6. Configure a separate open-banking provider; only provider references, never bank access tokens, belong in application tables.

## Native apps

The native bundle ID is currently `com.taxcenda.client`. Change it before store registration if the final identifier will be different.

```sh
npm run native:sync
npm run native:android
npm run native:ios
```

The native camera captures receipt images directly into the same authenticated, duplicate-checked confirmation flow. Push notifications are installed as a native capability but still require APNs/FCM credentials and server-side device-token registration before they can be enabled.

## Quality gates

```sh
npx tsc --noEmit
npm test
npm run lint
npm run build
```

AI output is treated as a suggestion. It cannot silently create a filing, determine professional tax positions without review, or transmit a return. An engagement cannot move through protected states until its blocking questions, duplicate candidates, final package, signature evidence, and provider transmission facts satisfy the database gates.
