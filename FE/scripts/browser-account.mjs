export async function ensureAccount(page,route){
 const role=route.startsWith('giang-vien')?'giang-vien':route.startsWith('sinh-vien')?'sinh-vien':null;
 if(!role||await page.locator(role==='giang-vien'?'.teacher-workspace':'.student-workspace').count())return;
 await page.goto('http://127.0.0.1:5173/dang-nhap');
 await page.getByLabel('Mã tài khoản',{exact:true}).fill(role==='giang-vien'?'GV001':'23110149');
 await page.getByLabel('Mật khẩu',{exact:true}).fill('12345678');
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await page.waitForURL('**/'+role+'/tong-quan');
}
