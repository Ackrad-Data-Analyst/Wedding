const { chromium } = require('playwright');
const BASE='https://script.google.com/macros/s/AKfycbyVkW0_32J0gIyR6gUHUelbAWiXqjpi4LDQfH66CkRGUGogAI_guJBrE4Z1PO1y4vH8Jg/exec';
(async () => {
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:950,height:800}});
 let anyFailure=false;
 try{
  for (const [side,capacity,lastDigit] of [['Groom',65,1],['Bride',85,2]]) {
   const page=await context.newPage();
   try {
    await page.goto(BASE+'?side='+side,{waitUntil:'domcontentloaded',timeout:40000});
    await page.waitForTimeout(2000);
    const appsFrame=page.frames().find(f=>f.url().includes('userCodeAppPanel'));
    if(!appsFrame)throw Error('Google HTML form frame not found');
    await appsFrame.locator('#submit').waitFor({state:'visible',timeout:15000});
    await appsFrame.waitForFunction(()=>!document.querySelector('#submit').disabled,{timeout:15000});
    if((await appsFrame.locator('#capacity').innerText())!==String(capacity))throw Error('Wrong capacity');
    await appsFrame.locator('#title').selectOption('Mr');
    await appsFrame.locator('#firstName').fill('QAONLY');
    await appsFrame.locator('#lastName').fill(side+'TestRemove');
    await appsFrame.locator('#age').fill('30');
    await appsFrame.locator('#whatsapp').fill('+260 000 000 00'+lastDigit);
    await appsFrame.locator('#city').fill('QA_TEST');
    await appsFrame.locator('#country').fill('Zambia');
    await appsFrame.locator('#assistanceDetails').fill('Automated QA test — delete this row.');
    for(const id of ['adultOnly','attend','rules','privacy'])await appsFrame.locator('#'+id).check();
    await appsFrame.locator('#submit').click();
    await appsFrame.locator('#success').waitFor({state:'visible',timeout:20000});
    const confirmation=await appsFrame.locator('#confirmationText').innerText();
    const updatedConfirmed=await appsFrame.locator('#confirmed').innerText();
    const updatedRemaining=await appsFrame.locator('#remaining').innerText();
    console.log('E2E '+side+': '+JSON.stringify({success:true,confirmation,confirmed:updatedConfirmed,remaining:updatedRemaining}));
    if(!confirmation.includes('Confirmation number:')||updatedConfirmed!=='1'||updatedRemaining!==String(capacity-1))throw Error('Unexpected confirmation or counts');
   }catch(e){anyFailure=true;console.log('E2E ERROR '+side+': '+String(e));}
   await page.close();
  }
 }finally{await browser.close();}
 if(anyFailure)process.exitCode=1;
})();
