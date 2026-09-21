# Supporter Feature Page

`SupporterPage` is the public, shareable Supporter overview at `/supporter`.  Signed-in visitors
keep the standard app shell.  Signed-out visitors receive a compact public header and can review
the Supporter program before creating an account.

## Purpose

- Give Supporter details a durable home as additional thank-you features are added.
- Lead with support for an independent community tool rather than a product sale.
- Show real Saved Database Views and Enhanced Draw Hand captures from a local Supporter account.
- Keep the promise that game knowledge and data will never be gated prominent.
- Combine the public feature overview with inline purchase and billing management.

## Interactions

- Feature tabs swap the visible screenshot, explanation, and benefit list.
- `/supporter#saved-views` and `/supporter#draw-hand` select the corresponding preview.
- Clicking the screenshot opens the complete capture in an accessible modal.
- The hero support card renders the root-owned `SupporterFlow` inline. Guests sign in before
  Checkout; persistent users receive server-created Stripe-hosted URLs; paid Supporters receive a
  fresh hosted-portal URL. Home, Database, and Profile link to this page instead of opening a drawer.
- Escape or clicking the scrim closes the image modal.

## Assets

The two PNGs in `assets/` were captured locally using the dedicated
`supporter-preview-briefs` Supporter account.  They contain no production customer information.
