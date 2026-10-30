import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire('/Users/quanganh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await fs.mkdir('.impeccable/review',{recursive:true});
for(const [name,route] of [['desktop','sinh-vien/tong-quan'],['teacher-desktop','giang-vien/tong-quan'],['reader-desktop','sinh-vien/hoc/cs301']]){
 await page.goto(`http://127.0.0.1:5173/${route}`);await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));await page.screenshot({path:`.impeccable/review/${name}.png`,fullPage:true});
}
await page.setViewportSize({width:390,height:844});
for(const [name,route] of [['mobile','sinh-vien/tong-quan'],['teacher-mobile','giang-vien/tong-quan'],['reader-mobile','sinh-vien/hoc/cs301']]){
 await page.goto(`http://127.0.0.1:5173/${route}`);await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));await page.screenshot({path:`.impeccable/review/${name}.png`,fullPage:true});
 console.log(route,await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth})));
}
console.log(JSON.stringify({errors}));await browser.close();
