const { chromium } = require('playwright');
const BASE='https://ackrad-data-analyst.github.io/Wedding/';
const CASES=[
 {side:'Groom',label:"Groom's family & friends",limit:65,path:'groom/'},
 {side:'Bride',label:"Bride's family & friends",limit:85,path:'bride/'}
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
   const ctas=page.locator('a.btn[href*="script.google.com/macros/s/"]');
   const n=await ctas.count();
   const href=n===1?await ctas.first().getAttribute('href'):'';
   const target=n===1?await ctas.first().getAttribute('target'):'';
   const checks={status200:http===200,correctCapacity:text.includes('Guest allocation')&&await page.locator('.stat strong').first().innerText()===String(t.limit),deadline:text.includes('15 November 2026'),hasFullInvitation:text.includes('Our wedding day')&&text.includes('Marriage Blessing')&&text.includes('Traditional Reception')&&text.includes('A note from the wedding organizing team'),oneRegistrationButton:n===1,buttonNewWindow:target==='_blank',correctSideForm:href.includes('side='+t.side),noEmbeddedForm:await page.locator('#rsvpForm').count()===0};
   console.log('INVITATION '+t.side+': '+JSON.stringify({http,title:heading,checks}));
   if(Object.values(checks).some(x=>!x)){failed=true;console.log('FAIL INVITATION '+t.side);}
   if(href){
    const form=await context.newPage();
    try{
     const r=await form.goto(href,{waitUntil:'domcontentloaded',timeout:40000});
     await form.waitForTimeout(5500);
     const txt=await form.locator('body').innerText();
     const result={http:r&&r.status(),url:form.url(),showsSide:txt.includes(t.label),hasForm:txt.includes('Confirm your attendance'),hasCurrentQuota:txt.includes(String(t.limit)),hasGuestFields:txt.includes('WhatsApp number'),hasDeadline:txt.includes('15 November 2026')};
     console.log('GOOGLE FORM '+t.side+': '+JSON.stringify(result));
     if(!result.showsSide||!result.hasForm||!result.hasCurrentQuota||!result.hasGuestFields){failed=true;console.log('FAIL GOOGLE FORM '+t.side+' - existing Google deployment probably not updated.');}
    }catch(e){failed=true;console.log('FAIL GOOGLE FORM '+t.side+' '+String(e));}
    await form.close();
   }
  }catch(e){failed=true;console.log('FAIL INVITATION '+t.side+' '+String(e))}
  await page.close();
 }
 await browser.close();
 if(failed)process.exitCode=1;
})();
