# Ackrad & Kaluya — Wedding RSVP, 2 January 2027

Wedding invitation: https://ackrad-data-analyst.github.io/Wedding/

The invitation is on GitHub Pages, with an automatically updating countdown and total capacity of 150. The **guest form is displayed**, but it cannot accept bookings until its Google Apps Script backend has been deployed. It must not show pretend confirmations.

## Enable actual registration (one-time owner setup)

1. Open https://script.google.com/home/start while logged into your Google account.
2. Create a new project and paste the contents of [backend/Code.gs](backend/Code.gs) into the script editor.
3. Add an **HTML** file with the name **Index** (not Index.html) and paste [backend/Index.html](backend/Index.html).
4. Run `getPublicStatus` in the script editor. Approve the Google access requests. This initializes the private guest-register spreadsheet. Do not share that sheet publicly.
5. **Deploy → New deployment → Web app**, execute as **Me**, access **Anyone**, and deploy. Copy the real URL ending in `/exec`.
6. Open the deployed app URL to confirm the form loads. Complete one test RSVP and check the confirmation code, seat count and private spreadsheet. Remove the test row after verifying, so capacity is accurate.
7. Edit [index.html](index.html) on GitHub. Near the bottom locate `const RSVP_WEB_APP_URL='';` and paste the /exec URL **between the quotes**. Commit the change to the main branch.
8. Return to https://ackrad-data-analyst.github.io/Wedding/ and verify the form is embedded and usable. If the Google form is blocked from embedding, guests can still click **Open the registration form in a new tab**.

### Important limits

- Only the first **150 valid adult RSVP submissions** can be confirmed.
- A **provisional** RSVP deadline of **15 December 2026, 23:59 Zambia time** is set in the backend.
- The site cannot currently check whether a guest is in a private list of invitees. Anyone with the public link can attempt to register; require door verification or add one-time invite codes.
- WhatsApp or SMS confirmation messages are **not** sent automatically. The form displays a confirmation reference to copy.
- Never publish guests' names, contact details or the private spreadsheet URL in this public repository.
