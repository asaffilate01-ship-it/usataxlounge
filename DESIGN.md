# TaxCenda · DESIGN.md

Users: US taxpayers and tax/accounting professionals conducting evidence-based reviews and filing approvals.

Service: Secure receipt and tax evidence, client questions, duplicates, fixed assets, accountant review, final filing package and approvals.

Existing brand: Current src/index.css uses ink-navy HSL 222 54% 20% primary, teal HSL 172 78% 41% accents, Inter and Playfair; dark mode separately defined.

Critical integrity: Filing approval, taxpayer identity, consent, uploaded evidence, AI extraction confidence, unresolved duplicate records and authority to transmit must be explicit. Never claim a return is filed because a screen is green; only verified provider response counts.

## Decision hierarchy
1. Truth: preserve actual transaction, document, status, permission and data-source semantics, especially for regulated or time-critical processes.
2. Clarity: public hero must explain one primary promise and route; operational dashboards need owner, timestamp, outstanding work, priority and obvious next action.
3. Consistency: use existing design tokens/components, readable type, sufficient contrast and consistent empty/failed/loading/permission states.
4. Craft: responsive 360/390/768/1440px, 200% zoom, keyboard/screen reader access, non-colour status and reduced motion; no unnecessary page transitions during urgent tasks.
5. Proof: no invented ratings, testimonials, logistics timings, financial forecasts or approved filings; clearly mark illustrations and demos.

## Three design resources
- Taste Skill https://github.com/Leonxlnx/taste-skill — developer/agent install `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend` for authentic art direction and responsive review.
- Impeccable https://github.com/pbakaus/impeccable — `npx impeccable install`, focused critique/audit/harden/polish, advisory `npx impeccable detect src/`.
- Awesome DESIGN.md https://github.com/VoltAgent/awesome-design-md — reference formats for project-owned tokens, not another brand's identity.

## Release gate
Existing lint/build/tests plus product-specific security/operational checks, visual review and keyboard/accessibility acceptance. Keep PRs reviewable. No Lovable credits, no published Git history rewrites.
