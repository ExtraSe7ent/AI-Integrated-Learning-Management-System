import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/dang-nhap');
await page.getByLabel('Mã tài khoản',{exact:true}).fill('TK001');
await page.getByLabel('Mật khẩu',{exact:true}).fill('12345678');
await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
await page.waitForURL('**/truong-khoa/tong-quan');
const output='.impeccable/review/dean';await fs.mkdir(output,{recursive:true});
const captures=[['desktop','tong-quan',1440],['courses','hoc-phan',1440],['course','hoc-phan/cs301',1440],['class','hoc-phan/cs301/lop/CSE301.01',1440],['alerts','canh-bao',1440],['profile','ho-so',1440],['notifications','tong-quan',1440,'bell'],['empty','tong-quan?ky=2026-2',1440],['mobile','tong-quan',390],['mobile-class','hoc-phan/cs301/lop/CSE301.01',390],['tablet','canh-bao',800]];
const reports=[];
for(const [name,route,width,action]of captures){
 await page.setViewportSize({width,height:width===390?844:1000});
 await page.goto('http://127.0.0.1:5173/truong-khoa/'+route);
 await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
 if(action==='bell')await page.getByRole('button',{name:'Thông báo',exact:true}).click();
 await page.screenshot({path:output+'/'+name+'.png',fullPage:true});
 reports.push({name,route,width,...await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,images:[...document.images].map(i=>({src:new URL(i.src).pathname,ok:i.complete&&i.naturalWidth>0,w:i.getBoundingClientRect().width,h:i.getBoundingClientRect().height})),font:getComputedStyle(document.body).fontFamily}))});
}
await fs.writeFile(output+'/runtime.json',JSON.stringify({errors,reports},null,2));
console.log(JSON.stringify({errors,captures:reports.map(r=>({name:r.name,width:r.width,scroll:r.scroll,brokenImages:r.images.filter(i=>!i.ok)}))}));
await browser.close();
