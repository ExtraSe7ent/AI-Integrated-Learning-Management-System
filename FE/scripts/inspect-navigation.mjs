import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import {ensureAccount} from './browser-account.mjs';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'});
const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
await fs.mkdir('.impeccable/review/refinement',{recursive:true});
for(const [name,route,width,action]of [
 ['student','sinh-vien/tong-quan',1440],['teacher','giang-vien/tong-quan',1440],
 ['grades','giang-vien/diem-so',1440],['teacher-profile','giang-vien/ho-so',1440],
 ['student-ai','sinh-vien/tro-ly-ai',1440],['teacher-ai','giang-vien/tro-ly-ai',1440],
 ['student-materials','sinh-vien/tai-lieu',1440],['teacher-materials','giang-vien/tai-lieu',1440],
 ['student-notifications','sinh-vien/tong-quan',1440,'notifications'],['teacher-notifications','giang-vien/tong-quan',1440,'notifications'],
 ['login','dang-nhap',1440],['teacher-mobile-check','giang-vien/tong-quan',390,'sidebar']]){
 if(process.argv[2] && name!==process.argv[2])continue;
 await ensureAccount(page,route);
 await page.setViewportSize({width,height:width===390?844:1000});await page.goto('http://127.0.0.1:5173/'+route);
 await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
 if(action==='notifications')await page.getByRole('button',{name:'Thông báo',exact:true}).click();
 if(action==='navigation')await page.getByRole('button',{name:'Chuyển mục: Tổng quan'}).click();
 if(action==='sidebar')await page.getByRole('button',{name:'Mở menu',exact:true}).click();
 await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
 await page.screenshot({path:'.impeccable/review/refinement/'+name+'.png',fullPage:!action});
 console.log(name,await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth})));
}
console.log(JSON.stringify({errors}));await browser.close();
