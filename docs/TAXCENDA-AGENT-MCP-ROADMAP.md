# TaxCenda — open-source skills, agent and MCP integration roadmap
_Research and engineering shortlist, 31 October 2026. Repositories were checked individually; this is a curated engineering shortlist, **not** an exhaustive audit of every GitHub repository._

## Product boundary
TaxCenda is a US tax evidence, bookkeeping, professional review and filing-approval workspace, with a React/Vite frontend, Supabase backend and Capacitor/PWA clients. Client tax facts, IDs, bank/financial records, source documents, EFINs, e-file credentials and signed authorisations are not permitted in external agent logs, arbitrary public MCP servers or source-control prompts.

## Priority 0: design and engineering quality
| Repository | Purpose and proposed action | Adoption gate |
| --- | --- | --- |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Art direction, content hierarchy and responsive usability reviews of landing, intake, dashboards and task states | Apply principles to TaxCenda's navy/teal tokens. No automatic adoption of branding/claims. |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Design critique, layout, typography, affordances and accessibility checks; existing PR has an **advisory** source scan | Review scan findings; keep app typecheck/tests/build separate and blocking. |
| [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | Project-owned DESIGN.md, components, spacing, content patterns and state semantics | Preserve TaxCenda's design identity and regulator-sensitive status semantics. |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | React component/accessibility/performance practices in engineering reviews | Review and selectively adopt skills; do not mass-install unknown instructions. |
| [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | Agent-assisted browser assessment of client intake, e-sign, dark mode, responsive 360–1440px screens | Run only against seeded staging data; no production sessions/PII. |
| [dequelabs/axe-core-npm](https://github.com/dequelabs/axe-core-npm) | Automated accessible-name, form label, contrast and semantics checks | Test critical flows by browser in CI; manually test keyboard and assistive technology too. |
| [GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci) | Check Core Web Vitals, accessibility and performance regression | Define baselines using stable public, non-auth pages. |

## Priority 1: safe developer tools and AI-assisted operations
| Repository | TaxCenda use | Safety boundaries |
| --- | --- | --- |
| [github/github-mcp-server](https://github.com/github/github-mcp-server) | Audit PRs, inspect CI, review source, manage issues and implement isolated code changes | Fine-grained GitHub grants, PR reviews, no unrestricted merge/release. |
| [supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp) | Schema discovery, migrations, RLS testing and staging diagnostics | **Staging only, least privilege, read-only wherever possible.** Do not pipe client tax data to agent context. |
| [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | Reference MCP interface schemas and secure integration approaches | Never assume community samples are production-hardened. Review server scope, auth and data retention. |
| [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) | Pre-commit/CI scanning for accidentally committed credentials | Use access-limited CI, avoid logging secret values. |
| [semgrep/semgrep](https://github.com/semgrep/semgrep) | Static security rules for unsafe SQL, weak auth, input handling and sensitive data exposure | Human review of findings; do not auto-fix security-critical code. |
| [OWASP/ASVS](https://github.com/OWASP/ASVS) | Security verification requirements: authentication, authorisation, logging, encryption, data handling | Map checks to app/backend and prove with automated tests. |

## Priority 2: domain-specific agents — proposal, not shipped
Choose **one** orchestration framework only if internal functions and queues are insufficient: [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) for durable graph workflows, or [pydantic/pydantic-ai](https://github.com/pydantic/pydantic-ai) for typed agent inputs/outputs. Compare licences, operation costs, stability and threat models; do not integrate both by default.

Proposed agents and their permitted outputs:
1. **Intake completeness agent** — produces a suggested checklist of missing tax documents by entity, jurisdiction and tax year, with explicit uncertainty and cited source records; cannot mark documents received.
2. **Evidence classification agent** — produces structured income/expense suggestions, confidence and original file links. It cannot set a missing transaction date to today, reverse negative amounts, decide business-use percentage or post an unconfirmed entry.
3. **Bookkeeping exception agent** — identifies potential duplicates, unmatched items, missing statements and reconciliation differences; decisions belong to preparer/reviewer.
4. **Client question drafting agent** — drafts one contextual follow-up question with the specific source-document reference; messages require approval before being sent.
5. **Cross-border checklist agent** — suggests candidate FBAR/Form 8938/foreign tax credit/foreign earned income questions, with tax-year and jurisdiction-specific sources; never decides applicability autonomously.
6. **Pre-filing quality agent** — produces a blocking checklist of documents, unresolved questions, consent, identity, reviewer sign-off and submission readiness; never authorises or sends a return.
7. **Service and deadline agent** — makes opt-in reminders from verified filing deadlines and actual engagement state; do not derive statutory dates from AI prose.

All AI-generated fields must store provenance (model/version, timestamp, document id, prompt/template version, confidence, human reviewer, accepted/rejected edits). Tax arithmetic must be deterministic, year-versioned and verified separately from generated explanations. Retain a clear human authority trail.

## MCP design — tools to expose internally only after permission checks
A narrow, private TaxCenda MCP gateway can expose:
- `get_engagement_summary` (RLS-bound, redacted and authorised by entity/team)
- `list_missing_documents` (metadata only)
- `get_review_blockers` (questions, duplicates, signatures, final package)
- `draft_client_question` (draft-only, no dispatch)
- `propose_evidence_classification` (proposal-only)
- `list_tax_year_rule_sources` (read-only, versioned and officially referenced)
- `create_review_task` (idempotent, bounded, auditable)

**Never expose** a generic SQL executor, arbitrary file URLs, broad search across taxpayers, tax-return status mutation, `approve_to_file`, `efile_submit`, provider credentials, IRS identity credentials, direct bank transfer or unrestricted email/notification to an LLM agent. All tools must validate caller role, tenant/client context, explicit scope, input schema, rate limits and audit log.

## Prioritised implementation plan
- **Wave A (now)**: repair suspect receipt values; require human source confirmation; remove unsupported public proof; add design/a11y and standard CI gates.
- **Wave B**: improve client 'what to do next', preparer queue owner/priority/age, all loading/empty/error states, mobile capture, and accessible workflows. Add Playwright + axe staging acceptance.
- **Wave C**: implement deterministic tax-year rules/recalculation fixtures, source-backed checklists, structured reviewer suggestions, and agent evals with synthetic fixtures.
- **Wave D**: integrate an approved US e-file provider or eligible MeF pathway; verify signatures, identities, rejection/correction responses and **provider-verified** transmission/acceptance before status transitions.
- **Wave E**: add bank-feed provider, reconciliation and controlled document request reminders once consent, licensing, security and provider terms have been verified.

## Release checks
`npm ci`, `npx tsc -p tsconfig.app.json --noEmit`, `npm test`, `npm run lint`, `npm run build`, browser/mobile/keyboard testing, RLS and storage policy tests, and staging filing-event fixtures. A passing advisory Impeccable action is **not** proof the app builds or that source scan findings were cleared.
