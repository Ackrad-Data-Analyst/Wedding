/**
 * Ackrad & Kaluya — Wedding RSVP backend
 * Two independent family allocations: Groom 70 / Bride 90.
 * The existing private RSVP Google Sheet remains the source of truth.
 */
const CONFIG = {
  LIMITS: {Groom:70, Bride:90},
  EVENT: '2027-01-02T10:00:00+02:00',
  TZ: 'Africa/Lusaka',
  SHEET: 'RSVP',
  WIDTH: 13
};

function validSide_(side) {
  return side === 'Groom' || side === 'Bride';
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const side = p.side || '';
  // Cross-site JSONP: public aggregate status or a one-time receipt token only.
  // No guest names, phone numbers or other personal details enter the URL.
  if (p.view === 'receipt' && validSide_(side)) {
    const nonce = String(p.nonce || '');
    const key = side + '_' + nonce;
    const allowed = /^[a-zA-Z0-9_-]{12,100}$/.test(nonce);
    const stored = allowed ? CacheService.getScriptCache().get(key) : null;
    const receipt = stored ? JSON.parse(stored) : null;
    const result = JSON.stringify({side:side,nonce:nonce,ready:!!receipt,result:receipt});
    return ContentService.createTextOutput('window.AKReceiveReceipt('+result+');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  if (p.view === 'public-count' && validSide_(side)) {
    const status = JSON.stringify(getPublicStatus(side));
    return ContentService.createTextOutput('window.AKReceiveStatus('+status+');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  if (validSide_(side) && e && e.parameter && e.parameter.view === 'status') {
    // A minimal, read-only status bridge for each public family invitation.
    // Sends aggregate counts only; guest names, phone numbers and sheet data stay private.
    const page = HtmlService.createHtmlOutput(
      '<!doctype html><html><head><meta name="robots" content="noindex"></head><body>' +
      '<script>google.script.run.withSuccessHandler(function(data){' +
      'window.top.postMessage({type:"ACKRAD_KALUYA_SIDE_STATUS",status:data},' +
      '"https://ackrad-data-analyst.github.io");' +
      '}).getPublicStatus('+JSON.stringify(side)+');<\/script>' +
      '</body></html>'
    );
    return page.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
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
    sheet.appendRow(['Timestamp','Confirmation','Title','First name','Surname','Side','Reserved','WhatsApp','City','Country','Reserved 2','Reserved 3','Status']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rows_(sheet) {
  const last = sheet.getLastRow();
  return last < 2 ? [] : sheet.getRange(2,1,last-1,CONFIG.WIDTH).getValues();
}

function status_(rows, side) {
  if (!validSide_(side)) throw new Error('Invalid family-side registration link.');
  const capacity = CONFIG.LIMITS[side];
  const confirmed = rows.filter(r =>
    String(r[5]).trim() === side &&
    String(r[12]).trim().toLowerCase() === 'confirmed'
  ).length;
  const remaining = Math.max(0, capacity-confirmed);
  const deadlineString = '2026-11-15T23:59:00+02:00'; // Fixed RSVP deadline chosen by the organizers.
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
    const isCouple = g.registrationType === 'couple';
    const seats = isCouple ? 2 : 1;
    if (status.remaining < seats) return {ok:false,message:'Not enough guest places remain for this registration. A couple requires two available places.'};

    const titles = ['Mr','Mrs','Miss','Ms','Dr','Prof','Rev','Other'];
    const first = scrub_(g.firstName,70);
    const last = scrub_(g.lastName,70);
    const phone = String(g.whatsapp == null ? '' : g.whatsapp).trim().slice(0,32); // Keep a leading + for international dialling; the saved Sheet value is quoted separately.
    const otherFirst = scrub_(g.partnerFirstName,70);
    const otherLast = scrub_(g.partnerLastName,70);
    const city = scrub_(g.city,90);
    const country = scrub_(g.country,90);
    if (!titles.includes(g.title) || !first || !last || !city || !country ||
        !/^\+?[0-9\s()-]{8,22}$/.test(phone)) {
      return {ok:false,message:'Please enter a valid name, title, WhatsApp number, city and country.'};
    }
    if (isCouple && (!['husband','wife'].includes(g.spouseRelationship) || !titles.includes(g.partnerTitle) || !otherFirst || !otherLast)) {
      return {ok:false,message:'Please confirm whether the second guest is your husband or wife, and provide their name and title.'};
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

    const primary = [
      new Date(),code,g.title,first,last,g.side,'',"'"+phone,city,country,'','','Confirmed'
    ];
    const entries = [primary];
    if (isCouple) entries.push([
      new Date(),code,g.partnerTitle,otherFirst,otherLast,g.side,'',
      "'"+phone,city,country,'','','Confirmed'
    ]);
    const startingRow = sheet.getLastRow()+1;
    sheet.getRange(startingRow,1,entries.length,CONFIG.WIDTH).setValues(entries);
    SpreadsheetApp.flush();
    return {ok:true,code,seats,status:status_(rows_(sheet),g.side)};
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

/**
 * Receives registration from the GitHub-hosted form without exposing guest details in URLs.
 * Posts the outcome to the originating invitation page. Keep this in the EXISTING deployment.
 */
function doPost(e) {
  const p = e && e.parameter ? e.parameter : {};
  const side = p.side;
  const nonce = String(p.nonce || '').slice(0,100);
  let response;
  try {
    if (!validSide_(side) || !/^[a-zA-Z0-9_-]{12,100}$/.test(nonce))
      throw new Error('Invalid registration request.');
    response = registerGuest(p);
  } catch (err) {
    response = {ok:false,message:'The registration could not be completed. Please contact the organizers if you already submitted.'};
  }
  // Save receipt so the GitHub page can retrieve it without iframe postMessage.
  if (validSide_(side) && /^[a-zA-Z0-9_-]{12,100}$/.test(nonce)) {
    CacheService.getScriptCache().put(side+'_'+nonce,JSON.stringify(response),21600);
  }
  const payload = JSON.stringify({type:'ACKRAD_KALUYA_REGISTRATION_RESULT',side:side,nonce:nonce,result:response}).replace(/</g,'\\u003c');
  const html = '<!doctype html><html><head><meta name="robots" content="noindex"></head><body>'+
    '<script>window.top.postMessage('+payload+',"https://ackrad-data-analyst.github.io");</script>'+
    '</body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
