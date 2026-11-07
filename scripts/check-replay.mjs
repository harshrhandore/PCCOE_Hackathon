import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:360,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/?mode=replay&episode=era5-2024-04-26&date=2024-04-26');
 await page.locator('.ward-row').first().waitFor({timeout:30000});
 if(!(await page.locator('.simulation-banner').first().innerText()).includes('2024-04-26'))throw new Error('Replay period banner missing');
 await page.screenshot({path:'reports/visual/replay-phone.png',fullPage:true});
 if(errors.length)throw new Error(errors.join('\n'));
 console.log('PASS: real replay loaded, date/banner persisted, no page errors; screenshot captured.');
} finally {await browser.close();}
