# Ackrad & Kaluya — Wedding Invitation and Private Family RSVPs

Wedding: **Saturday 2 January 2027**, Andrew's Motel, Lusaka, Zambia.

## Public invitation (no forms or registration buttons)
https://ackrad-data-analyst.github.io/Wedding/

## Two separate RSVP links

- **Groom's side: 65 guests** — https://ackrad-data-analyst.github.io/Wedding/groom/
- **Bride's side: 85 guests** — https://ackrad-data-analyst.github.io/Wedding/bride/

Each GitHub link opens a different, family-specific Google Apps Script form in the browser. The form has its own confirmed / remaining / capacity counts. No side selector is shown to guests. Both use the existing **private** Google Sheet, recording the side in its own column; quotas are enforced independently inside the Apps Script backend. Former registrations in the existing sheet are preserved.

**IMPORTANT: The new 65/85 quotas and form-only pages do NOT work until the existing Google Apps Script deployment is updated to the revised source files below.** Do not share the two links before completing the following:

1. Open your existing Google Apps Script project (the original wedding RSVP project).
2. In `Code.gs`, select all and replace with the complete contents of [backend/Code.gs](backend/Code.gs).
3. In `Index.html`, select all and replace with [backend/Index.html](backend/Index.html). This newer HTML contains **only** the RSVP form and quota / countdown status, no original wedding invitation content.
4. Save **both** files.
5. Go to **Deploy → Manage deployments** → select existing web-app deployment → **Edit** (pencil) → Version **New version** → **Deploy**. Keep **Execute as: Me** and **Access: Anyone**.
6. Test the groom and bride URLs. They should show headings **Groom's family & friends** (65 capacity) and **Bride's family & friends** (85 capacity), respectively.
7. Submit one test on each form (using different WhatsApp numbers), inspect the existing private spreadsheet, and verify separate counters. Change the two test rows' Status to `Cancelled` afterward if they were not genuine RSVPs. Do not share invitations until both tests pass.

The existing deployed Apps Script URL is:
https://script.google.com/macros/s/AKfycbyVkW0_32J0gIyR6gUHUelbAWiXqjpi4LDQfH66CkRGUGogAI_guJBrE4Z1PO1y4vH8Jg/exec

The two private links use that unchanged deployment with `?side=Groom` or `?side=Bride`.

## Notes

- Both family sides together total 150 adult seats, but they **cannot use one another's allocation**. The backend checks each allocation inside a script lock to prevent overselling.
- Existing confirmed registrations, if any, are counted according to their saved Groom/Bride side. A prior invite list is not automatically a confirmed registration.
- The sheet is private; the public pages show counts only, never personal information.
- A guest cannot register twice using the same WhatsApp number.
- The current RSVP deadline is **15 December 2026, 23:59 Zambia time**, unless overridden via the `RSVP_DEADLINE` Apps Script property.
- A link can be forwarded. This simple registration does not verify names against an invitation list. For strictly by-invitation registration, add one-time invite tokens or verify guests at entry.
- A successful registration displays a confirmation code. The system does **not** automatically send WhatsApp/SMS messages.
