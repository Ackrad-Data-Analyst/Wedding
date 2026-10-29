const { chromium } = require('playwright');
const BASE='https://ackrad-data-analyst.github.io/Wedding/';
const CASES=[
 {side:'Groom',label:"Groom's family & friends",limit:70,path:'groom/'},
 {side:'Bride',label:"Bride's family & friends",limit:90,path:'bride/'}
];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1200,height:850}});
 let failed=false;
 for(const t of CASES){
  const page=await context.newPage();
  try{
   const response=await page.goto(BASE+t.path,{waitUntil:'domcontentloaded',timeout:40000});
   const http=response&&response.status();
   const heading=await page.title();
   const text=await page.locator('body').innerText();
   const ctas=page.locator('a.btn[href*="/Wedding/"][href$="/register/"]');
   const n=await ctas.count();
   const href=n===1?await ctas.first().getAttribute('href'):'';
   const target=n===1?await ctas.first().getAttribute('target'):'';
   const checks={status200:http===200,correctCapacity:text.includes('Maximum number of guests budgeted for')&&await page.locator('.stat strong').first().innerText()===String(t.limit),deadline:text.includes('15 November 2026'),hasFullInvitation:text.includes('Our wedding day')&&text.includes('Western Traditional Wedding')&&text.includes('Zambian Traditional Wedding')&&text.includes('A note from the wedding organizing team'),oneRegistrationButton:n===1,buttonNewWindow:target==='_blank',correctSideForm:href===BASE+t.path+'register/',noEmbeddedForm:await page.locator('#rsvpForm').count()===0};
   console.log('INVITATION '+t.side+': '+JSON.stringify({http,title:heading,checks}));
   if(Object.values(checks).some(x=>!x)){failed=true;console.log('FAIL INVITATION '+t.side);}
   try{
     await page.waitForFunction(() => document.querySelector('#confirmed')?.textContent.trim() !== '—' &&
       document.querySelector('#remaining')?.textContent.trim() !== '—',null,{timeout:12000});
   }catch(e){console.log('LIVE INVITATION COUNTS UNAVAILABLE '+t.side);}
   const liveConfirmed=Number(await page.locator('#confirmed').innerText());
   const liveRemaining=Number(await page.locator('#remaining').innerText());
   const liveOk=Number.isInteger(liveConfirmed)&&Number.isInteger(liveRemaining)&&
     liveConfirmed>=0&&liveRemaining>=0&&liveConfirmed+liveRemaining===t.limit;
   console.log('LIVE INVITATION COUNTS '+t.side+': '+JSON.stringify({confirmed:liveConfirmed,remaining:liveRemaining,valid:liveOk}));
   if(!liveOk){failed=true;console.log('FAIL LANDING LIVE COUNTS '+t.side);}
   if(href){
    const form=await context.newPage();
    try{
     const r=await form.goto(href,{waitUntil:'domcontentloaded',timeout:40000});
     await form.waitForTimeout(5500);
     const frameTexts=await Promise.all(form.frames().map(async frame=>{try{return {url:frame.url().slice(0,125),text:(await frame.locator('body').innerText({timeout:4000})).slice(0,3000)}}catch(e){return {url:frame.url().slice(0,125),text:'[unavailable]'}}}));
     const txt=frameTexts.map(x=>x.text).join('\n');
     const qrTest=await form.evaluate(()=>{
       const lib=typeof QRCode==='function';
       let generated=false,ticketCanvas=false,saveFunction=false;
       if(lib&&typeof createConfirmationTicket==='function'){
         createConfirmationTicket('TEST-QR-123','Test Guest',2);
         generated=!!document.querySelector('#qrCode canvas, #qrCode img');
         if(typeof buildTicketCanvas==='function'){
           const c=buildTicketCanvas(currentTicket);
           ticketCanvas=!!c&&c.width===1080&&c.height===1350;
         }
         saveFunction=typeof saveConfirmationTicket==='function';
       }
       return {lib,generated,ticketCanvas,saveFunction,saveButton:!!document.getElementById('saveTicket'),codeField:!!document.getElementById('ticketCode')};
     });
     const result={http:r&&r.status(),url:form.url(),showsSide:txt.includes(t.side==='Groom'?"Ackrad's invited guests":"Kaluya's invited guests"),hasForm:txt.includes('Confirm your attendance'),hasCurrentQuota:txt.includes(String(t.limit)),hasGuestFields:txt.includes('WhatsApp number'),hasDeadline:txt.includes('2 JANUARY 2027'),qrTicket:qrTest};
     console.log('REGISTRATION FORM '+t.side+': '+JSON.stringify({...result,visibleTextPreview:txt.slice(0,650),frames:frameTexts.map(z=>z.url)}));
     if(!result.showsSide||!result.hasForm||!result.hasCurrentQuota||!result.hasGuestFields||Object.values(qrTest).some(x=>!x)){failed=true;console.log('FAIL REGISTRATION FORM '+t.side);}
    }catch(e){failed=true;console.log('FAIL REGISTRATION FORM '+t.side+' '+String(e));}
    await form.close();
   }
  }catch(e){failed=true;console.log('FAIL INVITATION '+t.side+' '+String(e))}
  await page.close();
 }
 await browser.close();
 if(failed)process.exitCode=1;
})();
