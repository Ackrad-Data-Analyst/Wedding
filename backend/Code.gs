/**
 * Ackrad & Kaluya — Wedding RSVP backend
 * Two independent family allocations: Groom 65 / Bride 85.
 * The existing private RSVP Google Sheet remains the source of truth.
 */
const CONFIG = {
  LIMITS: {Groom:65, Bride:85},
  EVENT: '2027-01-02T10:00:00+02:00',
  TZ: 'Africa/Lusaka',
  SHEET: 'RSVP',
  FIELDS: ['Timestamp','Confirmation','Title','First name','Surname','Side',
    'Age','WhatsApp','City','Country','Accessibility','Assistance details','Status']
};

function validSide_(side) {
  return side === 'Groom' || side === 'Bride';
}

function doGet(e) {
  const side = e && e.parameter ? e.parameter.side : '';
  if (!validSide_(side)) {
    return HtmlService.createHtmlOutput(
      '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<div style="max-width:500px;margin:8vh auto;font:18px Arial,sans-serif;padding:20px">' +
      '<h2>Wedding registration</h2>' +
      '<p>Please use the private family registration link supplied by the wedding organizers.</p>' +
      '</div>'
    ).setTitle('Ackrad & Kaluya — Wedding RSVP');
  }
  const template = HtmlService.createTemplateFromFile('Index');
  template.registrationSide = side;
  return template.evaluate()
    .setTitle((side === 'Groom' ? "Groom's" : "Bride's") + ' side | Wedding RSVP')
    .addMetaTag('viewport','width=device-width,initial-scale=1');
}

function sheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('RSVP_SPREADSHEET_ID');
  if (!id) {
    const ss = SpreadsheetApp.create('Ackrad and Kaluya — Private Wedding RSVPs');
    id = ss.getId();
    props.setProperty('RSVP_SPREADSHEET_ID',id);
  }
  const ss = SpreadsheetApp.openById(id);
  let sheet = ss.getSheetByName(CONFIG.SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET);
    sheet.appendRow(CONFIG.FIELDS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rows_(sheet) {
  const last = sheet.getLastRow();
  return last < 2 ? [] : sheet.getRange(2,1,last-1,CONFIG.FIELDS.length).getValues();
}

function status_(rows, side) {
  if (!validSide_(side)) throw new Error('Invalid family-side registration link.');
  const capacity = CONFIG.LIMITS[side];
  const confirmed = rows.filter(r =>
    String(r[5]).trim() === side &&
    String(r[12]).trim().toLowerCase() === 'confirmed'
  ).length;
  const remaining = Math.max(0, capacity-confirmed);
  const deadlineString = PropertiesService.getScriptProperties()
    .getProperty('RSVP_DEADLINE') || '2026-12-15T23:59:00+02:00';
  const deadline = Date.parse(deadlineString);
  let reason = '';
  if (!Number.isFinite(deadline)) reason = 'RSVP deadline is not configured.';
  else if (Date.now() > deadline) reason = 'The RSVP deadline has passed.';
  else if (Date.now() >= Date.parse(CONFIG.EVENT)) reason = 'The wedding has already begun.';
  else if (remaining === 0) reason = 'All '+capacity+' places on this family side are reserved.';
  return {
    side, capacity, confirmed, remaining,
    open: !reason, reason,
    deadlineDisplay: Number.isFinite(deadline)
      ? Utilities.formatDate(new Date(deadline),CONFIG.TZ,'d MMMM yyyy, HH:mm') : ''
  };
}

function getPublicStatus(side) {
  return status_(rows_(sheet_()),validSide_(side) ? side : 'Groom');
}

function scrub_(value,max) {
  return String(value == null ? '' : value).trim().slice(0,max)
    .replace(/^[=+@-]/, "'$&");
}

function registerGuest(g) {
  if (!g || !validSide_(g.side)) {
    return {ok:false,message:'Invalid family registration link.'};
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) {
    return {ok:false,message:'Registration is busy; please try again.'};
  }
  try {
    const sheet = sheet_();
    const rows = rows_(sheet);
    const status = status_(rows,g.side);
    if (!status.open) return {ok:false,message:status.reason};

    const titles = ['Mr','Mrs','Miss','Ms','Dr','Prof','Rev','Other'];
    const first = scrub_(g.firstName,70);
    const last = scrub_(g.lastName,70);
    const age = Number(g.age);
    const phone = scrub_(g.whatsapp,32);
    const city = scrub_(g.city,90);
    const country = scrub_(g.country,90);
    if (!titles.includes(g.title) || !first || !last || !city || !country ||
        !Number.isInteger(age) || age < 18 || age > 120 ||
        !/^\+?[0-9\s()-]{8,22}$/.test(phone)) {
      return {ok:false,message:'Please enter a valid name, title, age, WhatsApp number, city and country.'};
    }
    const digits = phone.replace(/\D/g,'');
    if (rows.some(r =>
      String(r[7]).replace(/\D/g,'')===digits &&
      String(r[12]).trim().toLowerCase()==='confirmed'
    )) {
      return {ok:false,message:'This WhatsApp number already has a confirmed registration. Contact the organizers for help.'};
    }
    const code = (g.side === 'Groom' ? 'GR-' : 'BR-') +
      Utilities.formatDate(new Date(),CONFIG.TZ,'yyMMdd') + '-' +
      Utilities.getUuid().slice(0,8).toUpperCase();

    sheet.appendRow([
      new Date(),code,g.title,first,last,g.side,age,"'"+phone,city,country,
      g.accessibility === 'Yes' ? 'Yes' : 'No',
      scrub_(g.assistanceDetails,350),'Confirmed'
    ]);
    return {ok:true,code,status:status_(rows_(sheet),g.side)};
  } finally {
    lock.releaseLock();
  }
}

/** Run in Apps Script editor to display the private Google Sheet URL. */
function adminShowSheet() {
  const sheet = sheet_();
  Logger.log(sheet.getParent().getUrl());
}

/** To release a seat, edit a guest's Status cell to "Cancelled". */
