# Supporter billing and lifecycle

## Product contract

Excelsior has one Supporter membership and one benefit set. The customer chooses a recurring whole-dollar monthly contribution; `$3` is the default and minimum, with `$3`, `$5`, `$10`, and **Other** presented in that order. Higher amounts never create tiers, roles, badges, or additional access.

The Stripe model is one active recurring `$1 USD/month` licensed-unit Price. Subscription quantity equals the monthly contribution in dollars. Quantity `3` and quantity `100` therefore grant the same boolean Supporter entitlement. Game data, rules, search, legality, public deck discovery, core deckbuilding, and collection information remain free.

Automatic tax is disabled. Tax, legal, privacy, terms, refund, cancellation, customer-pricing, filing, and recordkeeping readiness are separate production-launch gates and must be completed by Kyle before live billing is authorized.

## UI and state model

One root-owned `SupporterFlowProvider` resolves canonical status and supplies the Stripe-backed billing state rendered inline on `/supporter`. Home, Database, desktop Profile, and mobile Profile all navigate directly to that full page; there is no Supporter slide-out intermediary.

- Acquisition: approved copy, free-core pledge, controlled `$3/$5/$10/Other` selector, equal benefits, dynamic `$X/month` summary, and Stripe trust line.
- Guest: the selector remains visible; the action becomes **Sign in to become a supporter** and stores only a valid in-progress amount in session storage.
- Checkout return: `/supporter?supporter=confirm` renders a bounded polling state on the full page. Browser return parameters never grant access.
- Active paid: canonical `$X/month`, reliable next renewal, and **Manage monthly contribution**.
- Scheduled cancellation: access-through date and **Manage membership**.
- Recovery: calm payment-attention copy and **Update payment details** during a maximum seven-calendar-day grace.
- Complimentary only: status/expiry with no paid controls. Paid and complimentary sources remain independent when overlapping.
- Billing unavailable: no dead checkout advertisement; free Excelsior and complimentary status remain usable.

Profile labels are **Support Excelsior**, **Manage monthly support**, and **Supporter status** for non-paid, active paid, and complimentary-only accounts respectively.

## Server configuration

Billing is disabled unless all required values are present and the kill switch is not set.

| Environment value | Purpose |
| --- | --- |
| `SUPPORTER_BILLING_ENABLED=1` | Explicit enable flag; absent means disabled. |
| `DISABLE_SUPPORTER_BILLING=1` | Emergency kill switch; overrides the enable flag. |
| `STRIPE_SUPPORTER_LIVE_MODE=0` | Expected Stripe object mode. Use `1` only after a separately authorized live launch. |
| `STRIPE_SECRET_KEY` | Server-only least-privilege restricted key from the approved secret store. |
| `STRIPE_SUPPORTER_WEBHOOK_SECRET` | Server-only signing secret from the approved secret store. |
| `STRIPE_SUPPORTER_PRODUCT_ID` | Expected environment-specific Product. |
| `STRIPE_SUPPORTER_PRICE_ID` | Expected recurring `$1/month` unit Price. |
| `STRIPE_SUPPORTER_PRICE_LOOKUP_KEY` | Optional expected lookup key. |
| `STRIPE_SUPPORTER_PORTAL_CONFIGURATION_ID` | Explicit hosted-portal configuration. |
| `APP_ORIGIN` | Same-origin Checkout/portal return origin; HTTPS outside localhost. |
| `SUPPORTER_MAX_MONTHLY_USD` | Shared safe-integer technical maximum for API, Checkout, and UI. Default `999999`. |

Prepared standalone Excelsior sandbox values (non-secret):

- Product `prod_VGuQHHXjW9kEoE`
- Price `price_1UGMbfIJ2gwhL24GFJWB7Wc3`
- lookup key `excelsior_supporter_monthly_unit_usd`
- portal configuration `bpc_1UGMdlIJ2gwhL24GqXo1hiTj`

Live IDs do not exist in this handoff and must not be guessed. Never commit credentials or webhook secrets, expose them to the client, include them in fixtures/screenshots/logs/docs, or use the Lemon-icon Stripe Express account.

## Checkout and portal

`POST /api/v1/supporter/checkout` accepts only `monthlyContributionUsd`. Persistent USER ownership comes from authenticated session/Bearer context; the browser cannot supply user, currency, Product, Price, Customer, redirect, metadata, role, or entitlement state.

Before Checkout the server validates the configured Price is active, matches expected test/live mode, Product, lookup key, USD, `$1` unit amount, monthly interval, per-unit billing, and licensed usage. A short-lived single-use local attempt supplies only an opaque token to `client_reference_id` and allowlisted subscription metadata. Checkout uses the configured Price and quantity, the same adjustable minimum/maximum, Dashboard-controlled dynamic payment methods, no automatic tax, same-origin URLs, and an idempotency key.

`POST /api/v1/supporter/portal` accepts no body. It uses the server-owned Customer mapping and explicit portal configuration, creating a fresh short-lived URL on every call. URLs are never stored, logged, cached, or emailed. The prepared portal applies quantity changes at the next renewal, preserves the billing-cycle anchor, creates no proration charge/credit, prevents quantity below `3`, supports payment-method changes/invoice history, and schedules cancellation at period end.

## Webhook, entitlement, and recovery

`POST /api/v1/supporter/webhook` verifies the Stripe signature over the exact in-memory raw request bytes. Only event ID/type/time and sanitized processing state are persisted; no raw body, signature, contact/payment data, invoice PDF, or full Stripe response is retained.

Durable receipts deduplicate processed events, retry failed events, and reclaim a processing receipt after five minutes. Subscription writes compare provider event time, semantic priority for same-second events, then event ID. Every reconciliation retrieves the canonical subscription and validates one expected item, mode, Product, Price, USD, `$1` amount, monthly interval, licensed usage, and quantity within bounds.

- `invoice.paid`: canonical initial/renewal grant; updates quantity and paid-through.
- checkout/subscription events: reconciliation only, never payment proof.
- `invoice.payment_failed`: recovery grace capped at seven calendar days and not extended by repeated failures.
- period-end cancellation/deletion: access remains only through canonical paid-through.
- partial refund: preserves paid-through access and records manual review.
- full refund: revokes the Stripe source and idempotently cancels without proration/final invoice.
- dispute/funds withdrawn: revokes; won/reinstated dispute restores only after canonical validation.
- unknown status/configuration mismatch: fails closed for the Stripe source.

Complimentary and Stripe rows use independent source references. Portal changes, cancellation, refund, or dispute never erase an active complimentary source.

## Rollback and kill switch

Set `DISABLE_SUPPORTER_BILLING=1` and restart the app to stop new Checkout, portal, and webhook processing without disabling free features or deleting entitlement history. Restore webhook processing promptly after correction so signed events can be replayed. Roll back a bad non-secret ID/config value through the approved environment-specific configuration; roll back secrets by restoring the prior SSM SecureString version. Never repair by editing entitlement tables directly.

## Sandbox QA checklist (not yet executed)

Do not use live mode. In the standalone Excelsior sandbox, verify:

1. Checkout succeeds at `$3`, `$5`, `$10`, and a valid custom whole-dollar amount.
2. Client/API/Checkout cannot complete below quantity `3` or above the configured maximum.
3. Initial access appears only after signed `invoice.paid` and canonical retrieval.
4. Portal increase/decrease keeps the billing date and produces no immediate charge/credit.
5. Portal cannot reduce below `$3`.
6. Cancellation schedules period end and preserves access through paid-through.
7. Renewal, recovery/grace expiry, full/partial refund, dispute/reinstatement, duplicates, out-of-order delivery, stale processing reclaim, and reconciliation behave as documented.
8. Logs, analytics, and tables contain no prohibited payment or identity data.

Record test customer/subscription identifiers only in a private QA log, never in the repository.
