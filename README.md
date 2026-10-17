# Kindo — pre-loved baby & kids gear and clothes

Kindo is an Australian peer-to-peer marketplace for pre-loved (and new) baby and
kids' gear and clothing. Sellers list free; buyers pay a protection fee; payment
is held until the buyer confirms receipt (or scans the seller's QR code at a
pickup/meetup).

This repository is the **frontend only**. Every piece of data flows through a
mock service layer so a real backend (database, auth, Stripe Connect) can be
plugged in without touching the UI.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm test           # unit tests for pricing, order state machine, formatting
```

You start signed out on the landing page. "Continue with Google" signs in the
demo user (Sam, who is also an admin). **Profile → Demo tools** lets you reset
the demo data or make every service call fail so you can check error states.

## Folder structure

```
src/
  config/
    business.ts      ← ALL fees, thresholds, timings and feature flags
    copy.ts          ← wording that must match everywhere (payout rule, fee rule, safety badge…)
    taxonomy.ts      ← categories, age groups, conditions, sizes, safety checklists
  types/models.ts    ← typed data model (User, Listing, Order, Handover, Offer, Dispute, …)
  lib/
    pricing.ts       ← buyer fee, per-seller shipping, honest totals (pure functions)
    orderState.ts    ← order state machine: allowed transitions, labels, badge tones
    format.ts        ← the one date/money formatter ("17 May 2026", "$1,220.00")
    listingValidation.ts, trust.ts, safety.ts, children.ts
  services/          ← the ONLY place components get data from
    auth.ts listings.ts saved.ts cart.ts orders.ts payments.ts messages.ts
    notifications.ts children.ts users.ts admin.ts recalls.ts
    events.ts        ← tiny pub/sub so screens refresh after changes
    mock/seed.ts     ← demo data: every category, order state, a dispute, reviews
    mock/db.ts       ← in-browser store (localStorage) + simulated latency
  components/        ← UI primitives, layout (sidebar, top bar, bottom nav), listing cards
  pages/             ← one file per route
  styles/index.css   ← design tokens (colours, radius, shadows, spacing) + dark mode
```

## Config file

`src/config/business.ts` holds every business number: `BUYER_FEE_PERCENT` (5),
`BUYER_FEE_FIXED` ($1.50), `BUYER_FEE_CAP` ($30), `FREE_SHIPPING_THRESHOLD`
($75 per seller), `LARGE_ITEM_CATEGORIES`, `AUTO_CONFIRM_DAYS` (3),
`PRO_PRICE_MONTHLY`, `PRO_FREE_BOOSTS` (4), satchel prices, offer expiry,
landing-page stat thresholds, and `FEATURES` flags for each new feature.
Nothing in a component hard-codes these values.

## Service layer

Each service exports async functions (`getListing(id)`, `createOrdersFromCart()`,
`confirmHandover(orderId, code)`, `ruleDispute(...)` …) returning the types in
`types/models.ts`. Today they read and write the mock DB with a 250–650 ms delay.
To connect the backend, replace each function body with an API call. The
signatures and return shapes are the contract.

Search the code for these markers:

| Marker | Meaning |
| --- | --- |
| `TODO(stripe)` | Must be wired to Stripe (Checkout/Payment Element, Connect onboarding, transfers, refunds, Billing) |
| `TODO(auth)` | Google OAuth → backend session |
| `TODO(api)` | Server persistence / realtime |
| `TODO(shipping)` | Live AusPost rates and courier quotes |
| `TODO(recalls)` | ACCC Product Safety recalls data |
| `TODO(legal)` | Placeholder legal copy needing review |

## What the backend needs to implement

1. **Auth**: Google sign-in, sessions, admin role.
2. **Listings**: CRUD, photo upload to object storage, search with filters
   (category, age, condition, price, distance by suburb centroid, delivery),
   drafts, boosts, reports. Re-run `validateForPublish` server-side.
3. **Orders & escrow**: enforce the state machine in `lib/orderState.ts`:
   - Post: `pending_payment → paid_in_escrow → shipped → delivered → completed`
   - Pickup/meetup: `pending_payment → paid_in_escrow → ready_for_handover → completed`
   - Side states: `cancelled`, `disputed`, `refunded`, `partially_refunded`
   - Funds release **only** on `completed`. Auto-complete `AUTO_CONFIRM_DAYS`
     after the carrier marks delivered unless disputed.
   - Handover: generate the 6-digit code + QR payload server-side; only the
     seller's device should ever receive it.
4. **Pricing**: compute fees and per-seller shipping on the server with the
   same rules as `lib/pricing.ts` (ideally serve `config/business.ts` values).
5. **Payments (Stripe Connect)**: PaymentIntent per checkout, platform-held
   funds, Transfer to the seller on completion, Refunds API for rulings,
   Express onboarding for payouts, Billing for Kindo Pro.
6. **Messaging & offers**: conversations, offers with counter/expiry, realtime.
7. **Notifications**: saved-search matches, price drops, order updates (push/email).
8. **Moderation**: disputes (refund / partial refund / release) and reports
   (remove listing, warn, suspend), admin-only.
9. **Reviews & trust tiers**: two-way reviews after completion; tier rules in
   `config/business.ts` → `TRUST_TIERS`.

Copy `.env.example` to `.env.local` for future variables. Never commit real keys.
