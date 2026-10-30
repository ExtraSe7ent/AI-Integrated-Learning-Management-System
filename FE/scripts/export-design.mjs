import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import {ensureAccount} from './browser-account.mjs';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const routes=[
 ['student','Tổng quan','sinh-vien/tong-quan'],['student','Khóa học','sinh-vien/khoa-hoc'],['student','Nội dung lớp','sinh-vien/khoa-hoc/cs301'],['student','Phiên tự học','sinh-vien/tu-hoc'],['student','Học bài và câu hỏi','sinh-vien/hoc/cs301'],['student','Bài tập','sinh-vien/bai-tap'],['student','Làm bài tập','sinh-vien/lam-bai'],['student','Kết quả bài tập','sinh-vien/ket-qua'],['student','Luyện tập','sinh-vien/luyen-tap'],['student','Tham gia lớp trực tiếp','sinh-vien/tren-lop'],['student','Kết quả học tập','sinh-vien/diem-so'],['student','Trợ lý AI','sinh-vien/tro-ly-ai'],['student','Tài liệu tham khảo','sinh-vien/tai-lieu'],['student','Phản hồi','sinh-vien/phan-hoi'],
 ['teacher','Tổng quan','giang-vien/tong-quan'],['teacher','Lớp giảng dạy','giang-vien/lop-hoc'],['teacher','Nội dung lớp','giang-vien/lop-hoc/cs301'],['teacher','Bài học','giang-vien/bai-hoc'],['teacher','Soạn bài học','giang-vien/soan-bai'],['teacher','Phiên tự học','giang-vien/phien-tu-hoc'],['teacher','Ngân hàng câu hỏi','giang-vien/ngan-hang-cau-hoi'],['teacher','Bài tập','giang-vien/bai-tap'],['teacher','Tạo bài tập','giang-vien/tao-bai-tap'],['teacher','Chấm bài','giang-vien/cham-bai'],['teacher','Hỏi trên lớp','giang-vien/tren-lop'],['teacher','Theo dõi học tập','giang-vien/tien-do'],['teacher','Bảng điểm','giang-vien/diem-so'],['teacher','Phản hồi và giải đáp','giang-vien/phan-hoi'],['teacher','Phúc khảo','giang-vien/phuc-khao'],
 ['auth','Đăng nhập','dang-nhap'],['auth','Đổi mật khẩu lần đầu','doi-mat-khau'],
 ['student','Hồ sơ sinh viên','sinh-vien/ho-so'],['teacher','Hồ sơ giảng viên','giang-vien/ho-so'],
 ['teacher','Trợ lý AI','giang-vien/tro-ly-ai'],['teacher','Tài liệu tham khảo','giang-vien/tai-lieu'],
 ['student','Thông báo · Popup từ chuông','sinh-vien/tong-quan?state=thong-bao'],
 ['teacher','Thông báo · Popup từ chuông','giang-vien/tong-quan?state=thong-bao']
];
await fs.mkdir('artifacts/design',{recursive:true});
for(const [index,[role,name,route,width=1440]] of routes.entries()){
 await ensureAccount(page,route);
 await page.setViewportSize({width,height:width===390?844:1000});
 await page.goto('http://127.0.0.1:5173/'+route);await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
 if(route==='sinh-vien/lam-bai'){await page.goto('http://127.0.0.1:5173/sinh-vien/bai-tap');await page.getByRole('button',{name:'Bắt đầu làm bài'}).click();}
 if(route==='sinh-vien/ket-qua'){await page.goto('http://127.0.0.1:5173/sinh-vien/lam-bai');await page.getByRole('button',{name:'Nộp bài',exact:true}).click();}
 if(route.includes('state=thong-bao'))await page.getByRole('button',{name:'Thông báo',exact:true}).click();
 await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
 const design=await page.evaluate(()=>{
  const nums=value=>value.match(/[\d.]+/g)?.map(Number)||[];
  function walk(node,origin={x:0,y:0}){
   if(node.nodeType===Node.TEXT_NODE){const text=node.textContent.replace(/\s+/g,' ').trim();if(!text)return null;const range=document.createRange();range.selectNodeContents(node);const r=range.getBoundingClientRect();if(r.width<.1||r.height<.1)return null;const s=getComputedStyle(node.parentElement);return {kind:'text',text,x:r.x-origin.x,y:r.y-origin.y,w:r.width+1,h:r.height,fontSize:parseFloat(s.fontSize),weight:Number(s.fontWeight)||400,color:s.color,lineHeight:parseFloat(s.lineHeight)||parseFloat(s.fontSize)*1.6,align:s.textAlign,spacing:parseFloat(s.letterSpacing)||0};}
   if(node.nodeType!==Node.ELEMENT_NODE)return null;
   const el=node,s=getComputedStyle(el),r=el.getBoundingClientRect();
   if(['SCRIPT','STYLE','NOSCRIPT','BR','OPTION','DIALOG'].includes(el.tagName)||s.display==='none'||s.visibility==='hidden'||r.width<.1||r.height<.1||r.right<=0||r.bottom<=0||el.classList.contains('skip-link'))return null;
   const n={kind:'frame',name:el.getAttribute('data-figma')||el.className?.baseVal||el.className||el.tagName.toLowerCase(),x:r.x-origin.x,y:r.y-origin.y,w:r.width,h:r.height,bg:s.backgroundColor,border:s.borderColor,borderWidth:parseFloat(s.borderWidth)||0,radius:Math.min(parseFloat(s.borderTopLeftRadius)||0,r.width/2,r.height/2),opacity:parseFloat(s.opacity),children:[]};
   if(el.tagName==='svg'){const copy=el.cloneNode(true);copy.setAttribute('width',r.width);copy.setAttribute('height',r.height);copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('color',s.color);n.kind='svg';n.svg=copy.outerHTML.replace(/currentColor/g,s.color);return n;}
   if(el.tagName==='IMG'){n.kind='image';n.src=el.currentSrc||el.src;return n;}
   if(el.tagName==='PROGRESS'){n.kind='progress';n.value=el.value/el.max;return n;}
   if(['INPUT','TEXTAREA','SELECT'].includes(el.tagName)){n.kind='input';n.inputType=el.type;n.checked=el.checked;n.text=el.tagName==='SELECT'?el.options[el.selectedIndex]?.textContent:el.value||el.placeholder||'';n.fontSize=parseFloat(s.fontSize);n.color=s.color;n.padding=nums(s.padding);return n;}
   n.component=['button','badge','nav-item','avatar','course-card','workspace-mark'].find(c=>el.classList.contains(c));
   for(const child of el.childNodes){const result=walk(child,{x:r.x,y:r.y});if(result)n.children.push(result);}
   return n;
  }
  return {width:innerWidth,height:document.documentElement.scrollHeight,root:walk(document.querySelector('#root'))};
 });
 await fs.writeFile(`artifacts/design/${String(index).padStart(2,'0')}.json`,JSON.stringify({role,name,route,width,...design}));
 console.log(index,role,name);
}
await browser.close();
