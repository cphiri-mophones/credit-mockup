# Credit review mockup

A clickable mockup of the combined credit screen: one person takes an application from scoring to an activated loan on one screen, instead of three role-based screens (scorer, caller, decisioner).

It runs on mock data for the example application from the "Credit Process: Current State" doc (Jeff Clooney, Samsung Galaxy S23 Ultra 256GB). There is no backend: state lives in the browser and survives a reload. **Reset mockup** in the top bar starts over.

```bash
npm install
npm run dev
```

## Mo.OS shell

Every screen sits inside a copy of the Mo.OS shell (`src/components/MoosShell.tsx`), taken from `DoubleSidebarLayout` and `DomainSidebar` in mophones-ui: the collapsible slate sidebar with the Analytics, CRM Systems and Operations groups, Global Search (⌘K), the notification bell and the theme toggle. Only the Credit menu works; the other menu items are there for the look.

In the Credit menu, **Credit work** (marked NEW) replaces Scoring, Calling and Decisioning, which are shown struck through. **Show/Hide menu changes** in the top bar switches between that and the clean final menu. The two dashed amber buttons in the top bar are mockup controls, not part of the design. The mockup is light mode only.

## What's in it

| Screen | Route | What it shows |
| --- | --- | --- |
| Credit work | `#/queue` | One queue replacing the Scoring, Calling and Decisioning queues, with Mine, Call backs due, Waiting on system and Closed |

### Queue columns

The queue brings back the columns credit staff used on the old Scoring, Calling and Decisioning lists. **Columns** (top right of the list) shows or hides each one, and **Reset to default** restores the set below. Applicant and the ⋯ menu always show. Clicking a row (or the applicant's name) opens the application at its current step; the ⋯ menu, pinned to the right edge so it never needs a sideways scroll, has Open application and View details.

| Shown by default | Hidden by default |
|---|---|
| ID number, Phone, Type, Stage, Next action, Call status, Fate Guide, FPM, Time in queue | Device, Location, Channel type, Seller, Sales agent, Submitted, Owner |

The choice is saved per user. The mockup keeps it in the browser (`credit-review-mockup:queue-columns:<user>`), and **Reset mockup** leaves it alone. In Mo.OS it should use the per-user saved views the Applications explorer already has (`view_config.columns`), so it follows the person across devices. NOK Call Status from the old lists is left out: the old form never filled it, so it was always blank. Sample rows' values are illustrative; Jeff Clooney's FPM band was not seen in Mo.OS, so it shows a dash.
| 1. Verify | `#/verify` | Documents and next of kin marked Valid or Invalid in one list; click a document to open it in a viewer (statement analysis for M-Pesa, checks and consent for next of kin) with Valid / Invalid and Previous / Next; send back to the sales agent; a collapsed Risk section where the final risk score is optional (the system CRB score stands unless overridden) |
| 2. Offer | `#/offer` | Device, deposit, plan and initial weeks picked once, checked against the Fate Guide limit, with one upfront figure |
| 3. Call | `#/call` | Script filled with the real offer, ID and name checked against the record, required fields listed on save, call outcome (decide, call back, cannot go ahead) |
| 4. Decide | `#/decide` | Summary with Edit links, approve loan, cash offer or reject in one place. Approving a cash offer warns that it converts the application to a cash application |
| 5. Activate | `#/activate` | Order creation, payment and payer, hand-over code and ID photos, then activate. The device lock is shown for information only: ops locks it at enrolment and activation unlocks it |

The context panel on the right (customer, Fate Guide, CRB, checks, next of kin, activity) stays on every step except Call. On Call it is replaced by a cross-check panel that stays in view while the agent scrolls the script: the customer (with live ticks as the ID and name are typed), the offer to read out, next of kin, M-Pesa cross-check, credit and what the sales agent submitted.

## Credit flow and application details

A button at the top right of the application's title bar switches between two views: **View application details** in the flow, **Back to credit flow** in the details.

- **Credit flow**: the five steps above, for working the application.
- **Application details** (`#/details/<tab>`): everything about the application in tabs, read-only, covering what the old Mo.OS detail page showed plus what the flow has captured so far: Overview, Validation checks (with next-of-kin consent), KYC documents, Pre-screening, Product and offer, CRB, Risk assessment, Credit call, Decision and activation, Audit trail, Notes and Raw details. Each tab that is filled in by a step has an "Edit in the flow" link back to that step.

Switching back and forth returns to the step or tab you were on. **Add Note** in the header opens the Notes tab. The queue row's ⋯ menu has **View details** next to **Open application**.

Actions that take the application off your desk land on the matching details tab rather than the queue, with a banner saying what happened and a link back to Credit work: a call back goes to Credit call, a rejection to Decision and activation, and sending back to the agent to KYC documents. A call back is restarted with **Start call back** on the Call step or the Credit call tab: earlier answers are kept, while "May I proceed?" and the outcome are cleared for the new attempt, which is numbered and logged.

On the Call screen, the dashed **Mock only** panel fills the whole call form for an outcome you pick: reached and ready for a decision, not reached with a call back tomorrow, asked to call later, not ready for a loan, or a full call where the customer is not on terms. It only fills the answers; you still save the call yourself.

On the Activate screen, the dashed **Mock only** panel stands in for things that happen outside Mo.OS: the customer's payment, a different payer, the rider's hand-over, and an order that fails to create. Order and sale creation finish on their own after a few seconds.

## Activating as loan or cash

A loan application can be activated as a loan or, if the customer paid the full price, as a cash sale. Once a cash offer is approved in Decide the application becomes a cash application (the header chip reads "Cash (converted from loan)") and can only be activated as a cash sale.

## Hand-over photos

On both activation steps the Hand-over card shows the rider's photos of the customer's ID (front and back) once the delivery is done, each with a rider and time stamp. In the loan flow, the ID front and back from Verify sit below them for comparison. Every photo is an illustration watermarked SAMPLE and opens full size on click, with Previous and Next.

## Cash applications

Cash applications skip scoring, the credit call and the decision. In the queue they show with a Cash chip (the sample is Grace Atieno, a fictional customer) and have two steps:

1. **Device** (`#/cash-device`): search and pick the phone; out-of-stock devices are disabled. The cash price is the amount to collect. Continuing creates the order and delivery, after which the device choice is fixed; changing it means ops cancels the order first. Only the S23 Ultra price was seen in Mo.OS; the others are illustrative.
2. **Activate** (`#/cash-activate`): waits for the order, then checks payment in full, the payer (a different payer needs a confirmation tick), the hand-over code and the IMEI. "Complete cash sale" unlocks only when all pass. A short payment shows the balance still due. Once the rider hands over, the rider's ID photos (front and back) appear; click one to open it full size. The Mock only panel simulates paying in full, paying short, someone else paying, the rider hand-over and an order-creation failure.

"View application details" switches to `#/cash-details/<tab>`: Overview (with progress), Device and payment, Audit trail, Notes and Raw details.

## Proposals built into the mockup

These differ from the current flow and need a decision before building:

- One owner from claim to activation, one queue with a Stage column.
- The customer gets one SMS at the decision, not one per credit-status change.
- Reject sits next to Approve in Decide, not behind a separate Update Credit Status button.
- Activate stays disabled until payment, payer and hand-over code are all in. A different payer needs an explicit confirmation.
- The upfront amount is deposit + initial weeks × weekly instalment, and the same figure appears on the Offer, the call script and Activate. Confirm this formula with pricing: in the walkthrough the real order asked for KES 41,199 while the call quoted a KES 19,899 deposit.

The KYC documents (ID front and back, selfie, M-Pesa statement, next of kin) are illustrated sample images drawn in `src/components/SampleDocs.tsx`, watermarked SAMPLE.

Figures for MoSaver and MoStandard 25 were not seen in Mo.OS, so those plans show "Figures not in the mock data".

## Comments on the design

Reviewers pin comments to the page with [SitePing](https://github.com/NeosiaNexus/SitePing). The round button at the bottom right opens it: draw a box over an element, pick a type and write the comment. Others see the pin and can reply in a thread. Pins belong to the screen they were left on (`#/call`, `#/details/crb`…), so a pin on Call doesn't show on Decide.

**Admin inbox** (`#/admin`): lists every comment with search and filters, and lets you change status (open, in progress, resolved, won't fix), reply as "MoPhones team", delete, and jump to the comment on its page. Sign in with `SITEPING_API_KEY`; the browser keeps an HttpOnly session cookie for 30 days, so the key itself never sits in the page. Signed-in admins also get Resolve and Delete in the widget on the mockup itself.

- **Storage:** Turso, through the `MAIN_JUICE_TURSO_DATABASE_URL` and `MAIN_JUICE_TURSO_AUTH_TOKEN` env vars from the Vercel integration. `npm run db:push` creates the three `siteping_*` tables (schema in `server/schema.ts`).
- **API:** each `api/*.ts` runs as a Vercel Function: `/api/siteping` for comments and `/api/admin-session` for admin sign-in. `npm run dev` serves the same handlers through a small Vite middleware, so local and deployed behave alike. Run `vercel env pull .env.local` first.
- **Who can do what:** anyone with the link can read, pin and reply, and delete their own pins and replies. Ownership is the email the reviewer typed into the widget, sent as an `X-Reviewer-Email` header and matched against the comment's author email. It isn't verified, which is fine for an internal tool. Deleting your own pin also deletes the replies under it. Changing status, and deleting other people's comments, need an admin: either the session cookie or `Authorization: Bearer <SITEPING_API_KEY>` for scripts. Reviewer emails are only shown to admins.
- **Links to a comment** open `/<screen>?siteping=<id>`. `vercel.json` sends those paths to the app, which turns them back into its `#/<screen>` route.
