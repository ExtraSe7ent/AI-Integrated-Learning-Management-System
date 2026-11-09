// Isolated, disposable demo: never points at BE/data or resets a user's database.
import {spawn} from 'node:child_process';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import net from 'node:net';
import {request as httpRequest} from 'node:http';
const root=fileURLToPath(new URL('./',import.meta.url)),runtime=root+'.runtime/';
await mkdir(runtime,{recursive:true,mode:0o700});
const children=[];let stopping=false;
function stop(){if(stopping)return;stopping=true;for(const p of children)p.kill('SIGTERM');}
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,stop);
function run(command,args,env,log){
 const child=spawn(command,args,{cwd:root,env:{...process.env,...env},stdio:['ignore','pipe','pipe']});children.push(child);
 const output=createWriteStream(runtime+log,{mode:0o600});child.stdout.pipe(output);child.stderr.pipe(output);
 child.on('error',()=>{console.error('Không khởi chạy được '+command);stop();process.exitCode=1;});
 child.on('exit',code=>{if(!stopping){console.error(command+' đã dừng ('+code+'). Xem .runtime/'+log);stop();process.exitCode=1;}});
 return child;
}
async function waitFor(test,timeout=90000){const until=Date.now()+timeout;while(Date.now()<until){if(stopping)throw new Error('Demo stopped');try{const value=await test();if(value)return value;}catch{}await new Promise(r=>setTimeout(r,500));}throw new Error('Hết thời gian chờ dịch vụ. Xem log trong .runtime.');}
try{
 for(const port of [18081,19090,15174])await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',()=>reject(new Error(`Cổng ${port} đang được sử dụng. Không tự dừng tiến trình khác.`)));s.listen(port,'127.0.0.1',()=>s.close(resolve));});
 await access(root+'../BE/target/lms-backend-1.0.0.jar');
 const password='12345678';
 const internalKey=randomBytes(32).toString('base64url');
 await writeFile(runtime+'demo-private.json',JSON.stringify({username:'GV001',password,note:'Demo account uses the original project sample password.'},null,2),{mode:0o600});
 const settings={server:{address:'127.0.0.1',port:18081},spring:{datasource:{url:'jdbc:h2:mem:lmsmcpdemo;MODE=PostgreSQL;DB_CLOSE_DELAY=-1'},mail:{host:''}},lms:{'default-password':password,mcp:{'internal-url':'http://127.0.0.1:19090','internal-key':internalKey},security:{'jwt-secret':randomBytes(48).toString('base64url')},crypto:{passphrase:randomBytes(32).toString('base64url'),salt:randomBytes(16).toString('hex')},storage:{root:runtime+'media'},seed:{enabled:true,demo:true,'clear-keep-accounts':false},reminder:{cron:'-','smtp-host':''},ai:{'openrouter-api-key':'','vilao-api-key':''},cors:{'allowed-origins':['http://127.0.0.1:15174']}}};
 console.log('1/4 Khởi chạy BE H2 RAM riêng, không dùng DB hiện có…');
 run('java',['-jar',root+'../BE/target/lms-backend-1.0.0.jar'],{SPRING_APPLICATION_JSON:JSON.stringify(settings)},'backend.log');
 await waitFor(async()=>{const r=await fetch('http://127.0.0.1:18081/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'GV001',password}),signal:AbortSignal.timeout(1500)});return r.ok;});
 let publicUrl=process.env.MCP_PUBLIC_URL||'http://127.0.0.1:19090';
 if(!process.argv.includes('--local-only')){
  const binary=process.env.CLOUDFLARED_BIN||runtime+'cloudflared';await access(binary);
  console.log('2/4 Tạo tunnel HTTPS chỉ cho MCP và OAuth…');
  const child=run(binary,['tunnel','--url','http://127.0.0.1:19090','--no-autoupdate'],{},'tunnel.log');let found;
  const read=chunk=>{const m=chunk.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(m)found=m[0];};child.stdout.on('data',read);child.stderr.on('data',read);
  publicUrl=await waitFor(()=>found,60000);
 }else console.log('2/4 Chế độ local: chưa mở tunnel.');
 console.log('3/4 Khởi chạy MCP và OAuth…');
 run(process.execPath,['src/main.mjs'],{MCP_PUBLIC_URL:publicUrl,MCP_PORT:'19090',LMS_BACKEND_URL:'http://127.0.0.1:18081',MCP_ALLOWED_USERS:'*',MCP_INTERNAL_KEY:internalKey},'mcp.log');
 await waitFor(()=>new Promise(resolve=>{const request=httpRequest('http://127.0.0.1:19090/health',{headers:{Host:new URL(publicUrl).host}},response=>{response.resume();resolve(response.statusCode===200);});request.on('error',()=>resolve(false));request.setTimeout(1500,()=>{request.destroy();resolve(false);});request.end();}));
 console.log('4/4 Khởi chạy FE cho cùng dữ liệu demo…');
 run(process.execPath,['../FE/node_modules/vite/bin/vite.js','--config','demo-vite.config.mjs'],{},'frontend.log');
 await waitFor(async()=>{const r=await fetch('http://127.0.0.1:15174',{signal:AbortSignal.timeout(1500)});return r.ok;});
 await writeFile(runtime+'public.json',JSON.stringify({mcpUrl:publicUrl+'/mcp',manageUrl:publicUrl+'/connections',webUrl:'http://127.0.0.1:15174',startedAt:new Date().toISOString()},null,2));
 console.log(`\nMCP URL: ${publicUrl}/mcp\nQuản lý: ${publicUrl}/connections\nWeb demo cùng dữ liệu: http://127.0.0.1:15174\nTài khoản/mật khẩu riêng của phiên demo: ${runtime}demo-private.json\nGiữ terminal mở. Ctrl+C dừng cả bốn dịch vụ; dữ liệu RAM và quyền MCP sẽ mất.\nNếu URL public chưa truy cập được, xem .runtime/tunnel.log và thử lại.`);
}catch(error){console.error(error.message);stop();process.exitCode=1;}
