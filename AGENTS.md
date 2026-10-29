# Codex Handoff — Ackrad & Kaluya Wedding RSVP

This repository is an active wedding invitation + RSVP system. Treat this file as the source of truth for project context and user constraints. Do not redesign or restructure unrelated parts of the site unless explicitly requested.

## Core project

Wedding date: 2 January 2027  
Venue: Andrew's Motel, Lusaka, Zambia

Two separate invitation sides:
- Groom / Ackrad: 70 maximum guests
- Bride / Kaluya: 90 maximum guests
- Public venue/catering wording may still say 150 guests total. Do not change that unless explicitly asked.

Existing invitation links already shared with guests and MUST remain unchanged:
- Ackrad: https://ackrad-data-analyst.github.io/Wedding/groom/
- Kaluya: https://ackrad-data-analyst.github.io/Wedding/bride/

Dedicated registration pages:
- Ackrad: https://ackrad-data-analyst.github.io/Wedding/groom/register/
- Kaluya: https://ackrad-data-analyst.github.io/Wedding/bride/register/

Original Google Apps Script deployment URL MUST remain unchanged:
https://script.google.com/macros/s/AKfycbyVkW0_32J0gIyR6gUHUelbAWiXqjpi4LDQfH66CkRGUGogAI_guJBrE4Z1PO1y4vH8Jg/exec

Deployment ID:
AKfycbyVkW0_32J0gIyR6gUHUelbAWiXqjpi4LDQfH66CkRGUGogAI_guJBrE4Z1PO1y4vH8Jg

Apps Script project:
https://script.google.com/home/projects/1Owjh-RxHkoSyDm6yrDMBbtV1rRQK4g-jqKCS3tu3QguR334CuzkUfqqA/edit

Private RSVP Google Sheet:
https://docs.google.com/spreadsheets/d/1ui9Wp2zt033v6qpHmKbnmUvI_zoh4KrOspKn-gN0fHY/edit

Sheet tab: RSVP

## Repository structure

Important files:
- groom/index.html — Ackrad landing page
- bride/index.html — Kaluya landing page
- groom/register/index.html — Ackrad registration page
- bride/register/index.html — Kaluya registration page
- backend/Code.gs — Google Apps Script backend source
- backend/Index.html — old Google-hosted form source / reference
- assets/qrcode.min.js — local QR generator used by confirmation ticket
- tests/verify-wedding.js — Playwright verification
- .github workflows — GitHub Pages + tests

## Non-negotiable user constraints

1. Do NOT change the old invitation URLs.
2. Do NOT create a new Apps Script deployment URL.
3. When Apps Script changes are needed, update the EXISTING deployment:
   Deploy -> Manage deployments -> Edit existing deployment -> New version -> Deploy.
4. Do NOT change landing-page design, wording, order, maps, countdown, gift note, or unrelated content unless explicitly requested.
5. Ackrad and Kaluya must remain separate registration sides.
6. Guest limits are 70 Groom / 90 Bride.
7. No Google login, email login, account creation, or technical troubleshooting should ever be required for a guest.
8. A guest should be able to:
   open invitation -> tap register -> fill form -> submit -> receive confirmation number + QR ticket -> save ticket.
9. Backend must prevent overbooking and duplicate confirmed WhatsApp registrations.
10. If seats are full, show a clear warning and block registration.
11. Couple registration reserves 2 seats and is only for husband/wife.
12. No children/uninvited guests.
13. Current requirement: AGE and ASSISTANCE must be removed completely from the forms and backend code. No visible fields, no hidden compatibility fields, no age validation, no accessibility/assistance handling.

## Current form fields

Individual registration should collect:
- Title
- First name
- Surname
- WhatsApp number including country code
- City / town
- Country
- confirmations/consents already present

Couple registration should additionally collect:
- spouse relationship: husband or wife
- spouse title
- spouse first name
- spouse surname

Do not ask for age.
Do not ask for accessibility.
Do not ask for assistance details.

## Confirmation / QR flow

After a SUCCESSFUL backend save only, show:
- confirmation number
- guest name(s)
- number of places reserved
- QR code
- wedding date and venue
- Save confirmation button
- Copy confirmation code button
- WhatsApp group join button

Current WhatsApp group invite:
https://chat.whatsapp.com/CgcQJLu21oJ2vK3ci808sy?s=cl&p=i&mlu=4&ilr=4&iam=2

The QR generator is bundled locally in:
assets/qrcode.min.js

The confirmation ticket can be saved as a PNG. QR payload currently includes a wedding identifier, confirmation code, side, and reserved seats.

Future gate-check-in idea:
- QR scan should validate registration
- show guest name(s), side, seats
- mark checked in
- detect reused QR / already checked in

Do not implement gate check-in unless requested.

## Important history / failure lessons

The original Google-hosted Apps Script form worked on laptop but produced Google Drive / "unable to open the file" errors on some iPhones/mobile browsers.

The visible registration form was moved to GitHub Pages while Apps Script remained the backend.

A major bug was found where the submit button id/name behavior caused form.submit() to be shadowed. Fixed by using:
HTMLFormElement.prototype.submit.call(form)

Do not revert that fix.

The cross-origin response mechanism has been fragile. Current code uses Apps Script POST + receipt polling / JSONP support. Be very careful with mobile cross-origin behavior.

Do not solve mobile failures by merely increasing timeouts or hiding errors. Verify an actual registration reaches the Sheet and a confirmation number is returned.

The most recent recurring failure was:
"Please enter a valid name, title, age, WhatsApp number, city and country."

That error proves the LIVE Apps Script deployment was still serving an older Code.gs that validates age. The repository Code.gs has since been changed to remove age validation, but the live Apps Script deployment must be updated by the user when backend code changes because GitHub cannot deploy Apps Script automatically.

If a screenshot still shows an error mentioning age, first suspect the LIVE Apps Script deployment is stale, not the GitHub form.

## Sheet compatibility

Existing Sheet rows and old registrations must not be damaged.

Historically the sheet used 13 columns:
Timestamp, Confirmation, Title, First name, Surname, Side, Age, WhatsApp, City, Country, Accessibility, Assistance details, Status

The current backend should preserve the 13-column physical layout for compatibility with existing rows, but the removed age/assistance positions should be blank for new registrations.

Do not rename/move/delete the live Sheet or existing data.

## Current public wording / landing-page details

Main heading:
Ackrad & Kaluya

Wedding-day programme:
- Western Traditional Wedding — 10:00 AM
- Zambian Traditional Wedding Celebration — 3:00–7:00 PM

Ackrad landing page only was changed so:
- photo-session explanations were removed from both programme cards
- programme note no longer mentions photo-session timings
- smoking wording is courteous, with no security-removal consequence:
  "No smoking or vaping will be allowed at the event. We kindly ask everyone to respect this arrangement."

Kaluya's landing page was intentionally left unchanged for those wording changes.

Gift note must retain the user's chosen language, including minimum K500, unless explicitly asked to change.

## Testing requirements

Do not declare the system fixed merely because GitHub Pages deploys.

Run / inspect:
- GitHub Pages build
- tests/verify-wedding.js
- registration pages load
- correct side and capacities
- no visible age/assistance fields
- QR library loads
- QR generated after simulated successful confirmation
- save-ticket canvas works
- live invitation counts work

Most importantly, for backend changes verify:
- actual submission reaches Apps Script
- actual row is saved to the existing RSVP Sheet
- confirmation number returned
- QR shown only after success
- full-capacity rejection works
- couple registration consumes two seats
- duplicate WhatsApp protection works

Avoid creating fake permanent guest rows during automated tests unless explicitly cleaned up afterward. Prefer non-saving validation probes where possible.

## Current user priority

The user wants this system to be reliable and simple for non-technical guests. They are frustrated by repeated loops and partial fixes. When debugging:
- identify the exact failing layer first
- inspect live behavior, not only repository source
- fix the root cause
- run tests
- state clearly what is verified vs what still needs user-side Apps Script deployment

Do not make the user repeat details already in this file.

## Codex working style

Before changing code:
1. Read this AGENTS.md.
2. Inspect the exact current file versions.
3. Preserve all old public URLs.
4. Make the smallest targeted changes.
5. Run tests.
6. If backend/Code.gs changes, explicitly tell the user they must update the SAME Apps Script deployment, not create a new deployment.
7. Never claim the live backend is updated unless it has actually been deployed and verified.
