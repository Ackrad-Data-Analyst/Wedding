# Ackrad & Kaluya — Wedding Invitations and RSVP

**Saturday 2 January 2027 · Andrew's Motel, Lusaka, Zambia**

## Share these TWO distinct invitation pages

- **Groom's invited family and friends (65 places):** https://ackrad-data-analyst.github.io/Wedding/groom/
- **Bride's invited family and friends (85 places):** https://ackrad-data-analyst.github.io/Wedding/bride/

Each is a full wedding invitation website with ceremony programme, location, house rules, organizer's gift note, event countdown and its own family-side seat numbers. Each has **ONE** registration button, opening a separate browser tab with ONLY that family's Google RSVP form. The form is never embedded in the invitation page.

The central invitation-only website remains at https://ackrad-data-analyst.github.io/Wedding/ and intentionally has no registration buttons.

## One remaining owner update — deadline and live status

**Required: update the EXISTING Google Apps Script deployment to the new Code.gs.** Without this, the displayed deadline on the invitation and the actual enforced deadline in the Google backend may disagree, and the live confirmed/remaining counts on each invitation will not load.

1. Open the **existing** Google Apps Script project associated with your current deployed wedding RSVP web app.
2. Open **Code.gs** and replace its entire contents with [backend/Code.gs](backend/Code.gs). Save.
3. Leave **Index.html** unchanged if you have already installed the separate bride/groom full-page form from [backend/Index.html](backend/Index.html). If the Apps Script form is old, replace Index.html with that file as well.
4. Go to **Deploy → Manage deployments → existing web-app deployment → Edit (pencil) → Version: New version → Deploy**. Do **not** create a second deployment; keep the same /exec link.
5. Verify that the bride landing page displays **85** places and the groom landing page displays **65**; confirmed and remaining counts should load from Google.
6. Open each landing page's **Register & confirm attendance** button; each should open in a separate new tab, showing **only its side-specific RSVP form**, not the wedding landing page. Test a registration from each side (different WhatsApp numbers), verify each affects only its corresponding count in the private Sheet, then cancel the test row(s) by setting Status to Cancelled.
7. Share each invitation URL only with that side's invited family and friends.

**RSVP deadline:** **15 November 2026 at 23:59 Zambia time (CAT)**. The Code.gs enforces that deadline.

**Capacity allocation:** Groom 65; Bride 85; combined 150. The backend tracks each allocation separately, while preserving the existing private Google Spreadsheet in the same script.

## Important limits

- Existing personal guest information stays **private** in the Google Sheet. The public invitation displays aggregate totals only.
- Prior manually prepared invitation lists do not automatically become confirmed registrations.
- An invitation link can be forwarded; without individual invite tokens the form cannot cryptographically verify that a registrant was personally invited.
- Successful RSVP shows a confirmation number on-screen; automatic WhatsApp or SMS messaging is **not** part of this deployment.
- Monetary gifts are voluntary and never a requirement to attend. The organizer's suggested minimum **for guests choosing to give** is K500.
