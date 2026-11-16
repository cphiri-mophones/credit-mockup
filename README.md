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
| 1. Verify | `#/verify` | Documents and next of kin marked Valid or Invalid in one list, send back to the sales agent; a collapsed Risk section where the final risk score is optional (the system CRB score stands unless overridden) |
| 2. Offer | `#/offer` | Device, deposit, plan and initial weeks picked once, checked against the Fate Guide limit, with one upfront figure |
| 3. Call | `#/call` | Script filled with the real offer, ID and name checked against the record, required fields listed on save, call outcome (decide, call back, cannot go ahead) |
| 4. Decide | `#/decide` | Summary with Edit links, approve loan, cash offer or reject in one place |
| 5. Activate | `#/activate` | Order creation, payment and payer, hand-over code and ID photos, device lock, then activate |

The context panel on the right (customer, Fate Guide, CRB, checks, next of kin, activity) stays on every step except Call. On Call it is replaced by a cross-check panel that stays in view while the agent scrolls the script: the customer (with live ticks as the ID and name are typed), the offer to read out, next of kin, M-Pesa cross-check, credit and what the sales agent submitted.

## Credit flow and application details

A button at the top right of the application's title bar switches between two views: **View application details** in the flow, **Back to credit flow** in the details.

- **Credit flow**: the five steps above, for working the application.
- **Application details** (`#/details/<tab>`): everything about the application in tabs, read-only, covering what the old Mo.OS detail page showed plus what the flow has captured so far: Overview, Validation checks (with next-of-kin consent), KYC documents, Pre-screening, Product and offer, CRB, Risk assessment, Credit call, Decision and activation, Audit trail, Notes and Raw details. Each tab that is filled in by a step has an "Edit in the flow" link back to that step.

Switching back and forth returns to the step or tab you were on. **Add Note** in the header opens the Notes tab. The queue row has a **Details** link next to **Open**.

On the Activate screen, the dashed **Mock only** panel stands in for things that happen outside Mo.OS: the customer's payment, a different payer, the rider's hand-over, the device locking, and an order that fails to create. Order and sale creation finish on their own after a few seconds.

## Proposals built into the mockup

These differ from the current flow and need a decision before building:

- One owner from claim to activation, one queue with a Stage column.
- The customer gets one SMS at the decision, not one per credit-status change.
- Reject sits next to Approve in Decide, not behind a separate Update Credit Status button.
- Activate stays disabled until payment, payer, hand-over code and device lock are all in. A different payer needs an explicit confirmation.
- The upfront amount is deposit + initial weeks × weekly instalment, and the same figure appears on the Offer, the call script and Activate. Confirm this formula with pricing: in the walkthrough the real order asked for KES 41,199 while the call quoted a KES 19,899 deposit.

Figures for MoSaver and MoStandard 25 were not seen in Mo.OS, so those plans show "Figures not in the mock data".
