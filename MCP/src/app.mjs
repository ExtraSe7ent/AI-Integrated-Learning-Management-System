import express from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {timingSafeEqual} from 'node:crypto';
import {mcpAuthRouter,getOAuthProtectedResourceMetadataUrl} from '@modelcontextprotocol/sdk/server/auth/router.js';
import {requireBearerAuth} from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {LmsBackend,assertLecturer} from './backend.mjs';
import {LmsOAuthProvider,SCOPES} from './oauth.mjs';
import {buildMcp,IntentStore} from './tools.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const cookie=(req,name)=>req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);
const page=(title,body)=>`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · VJU LMS</title><style>body{font:16px/1.6 system-ui;background:#f7f6f3;color:#242424;margin:0;padding:32px 20px}main{max-width:560px;margin:32px auto;background:white;border:1px solid #ddd;border-radius:12px;padding:28px}h1{font-size:26px;line-height:1.3}label{display:block;margin:16px 0}input:not([type=checkbox]){display:block;box-sizing:border-box;width:100%;font:inherit;padding:10px;border:1px solid #888;border-radius:6px}button{font:inherit;padding:10px 16px;border-radius:6px;border:1px solid #a51c30;background:#a51c30;color:white;margin:12px 8px 0 0;cursor:pointer}button.secondary{background:white;color:#333;border-color:#888}small{display:block;overflow-wrap:anywhere;color:#555}a{color:#a51c30}.error{color:#a51c30}input:focus,button:focus,a:focus{outline:3px solid #2574c5;outline-offset:2px}</style><main>${body}</main></html>`;
const loginFields='<label>Tài khoản giảng viên<input name="username" autocomplete="username" required maxlength="128"></label><label>Mật khẩu<input name="password" type="password" autocomplete="current-password" required maxlength="256"></label>';
export function createApp({publicUrl,backendUrl,backend=new LmsBackend(backendUrl),allowedUsers=[],internalKey='',audit=event=>console.log(JSON.stringify({...event,at:new Date().toISOString()}))}){
 const url=new URL(publicUrl);
 if(url.pathname!=='/'||url.search||url.hash||url.username||url.password||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname))))throw new Error('MCP_PUBLIC_URL must be an HTTPS origin (loopback HTTP for tests).');
 if(!allowedUsers.length)throw new Error('Set MCP_ALLOWED_USERS to lecturer account IDs before starting.');
 const provider=new LmsOAuthProvider({publicUrl,backend}),intents=new IntentStore(),app=express();
 app.disable('x-powered-by');
 // Only the local tunnel/reverse proxy can reach this loopback-bound server.
 app.set('trust proxy','loopback');
 app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'none'"],styleSrc:["'unsafe-inline'"],formAction:["'self'"],frameAncestors:["'none'"],baseUri:["'none'"],upgradeInsecureRequests:url.protocol==='https:'?[]:null}},strictTransportSecurity:url.protocol==='https:'?undefined:false}));
 app.use((req,res,next)=>{
  res.set('Cache-Control','no-store');res.set('Referrer-Policy','strict-origin-when-cross-origin');
  if(req.path.startsWith('/internal/') && internalKey.length>=32 && equal(req.get('X-LMS-MCP-Key'),internalKey))return next();
  if(req.headers.host!==url.host && !['127.0.0.1','localhost'].some(h=>req.headers.host===`${h}:${url.port||443}`))return res.status(421).send('Unexpected host.');
  if(req.path==='/mcp' && req.headers.origin && ![url.origin,'https://chatgpt.com','https://claude.ai','https://gemini.google.com'].includes(req.headers.origin))return res.status(403).send('Unexpected origin.');
  next();
 });
 app.get('/health',(_req,res)=>res.json({status:'ok',service:'vju-lms-mcp'}));
 app.get('/',(_req,res)=>res.send(page('Kết nối agent',`<h1>VJU LMS · Kết nối agent</h1><p>Thêm địa chỉ sau vào ứng dụng AI hỗ trợ MCP remote:</p><small>${escape(provider.resource)}</small><p>Đăng nhập tài khoản giảng viên và chọn quyền khi ứng dụng yêu cầu. Công cụ tạo nháp; chỉ công bố khi bạn cấp quyền công bố và yêu cầu rõ ràng.</p><p><a href="/connections">Quản lý và thu hồi kết nối</a></p><p>Dữ liệu cấp quyền demo lưu trong RAM. Khởi động lại server cần kết nối lại.</p>`)));
 app.use(express.urlencoded({extended:false,limit:'16kb'}));
 app.use(express.json({limit:'1mb'}));
 app.use(mcpAuthRouter({provider,issuerUrl:url,resourceServerUrl:new URL(provider.resource),scopesSupported:Object.keys(SCOPES),resourceName:'VJU LMS – Giảng viên'}));
 // Compatibility alias for clients discovering metadata at the origin root.
 app.get('/.well-known/oauth-protected-resource',(_req,res)=>res.json({resource:provider.resource,authorization_servers:[url.href],scopes_supported:Object.keys(SCOPES)}));
 const internalGuard=async(req,res,next)=>{
  if(internalKey.length<32 || !equal(req.get('X-LMS-MCP-Key'),internalKey))return res.status(404).end();
  const match=req.get('Authorization')?.match(/^Bearer (\S+)$/);
  if(!match)return res.status(401).end();
  try{req.lecturer=assertLecturer(await backend.request('/api/auth/me',match[1]));next();}catch{return res.status(403).end();}
 };
 app.get('/internal/connections',internalGuard,(req,res)=>{
  provider.cleanup();const eligible=allowedUsers.includes('*')||allowedUsers.includes(req.lecturer.id),remote=url.protocol==='https:';
  const connections=[...provider.grants.entries()].filter(([,g])=>g.userId===req.lecturer.id).map(([id,g])=>({id,clientName:provider.clients.get(g.clientId)?.client_name||g.clientName||'Ứng dụng AI',scopes:g.scopes,createdAt:g.createdAt,expiresAt:g.expiresAt}));
  res.json({status:!eligible?'disabled':remote?'ready':'local',message:!eligible?'Tài khoản của bạn chưa được bật kết nối agent. Liên hệ quản trị viên.':!remote?'MCP đang chạy nội bộ. Người quản trị cần bật địa chỉ HTTPS để kết nối ứng dụng AI.':'',mcpUrl:eligible&&remote?provider.resource:null,connections});
 });
 app.delete('/internal/connections/:id',internalGuard,(req,res)=>{
  const grant=provider.grants.get(req.params.id);if(!grant||grant.userId!==req.lecturer.id)return res.status(404).json({message:'Không tìm thấy kết nối của bạn.'});
  provider.removeGrant(req.params.id);audit({event:'mcp_web_revoke',userId:req.lecturer.id});res.json({revoked:1});
 });
 app.post('/internal/connections/revoke-all',internalGuard,(req,res)=>{
  const ids=[...provider.grants.entries()].filter(([,g])=>g.userId===req.lecturer.id).map(([id])=>id);
  for(const id of ids)provider.removeGrant(id);audit({event:'mcp_web_revoke_all',userId:req.lecturer.id});res.json({revoked:ids.length});
 });
 const formLimit=rateLimit({windowMs:900000,limit:10,standardHeaders:'draft-8',legacyHeaders:false,message:'Quá nhiều lần đăng nhập. Thử lại sau.'});
 const allowed=account=>{if(!allowedUsers.includes('*')&&!allowedUsers.includes(account.id))throw new Error('Account not enabled for this demo.');};
 const flow=(req)=>{provider.cleanup();const f=provider.pending.get(req.method==='GET'?req.query.flow:req.body.flow);return f&&equal(cookie(req,'lms_mcp_flow'),f.csrf)?f:null;};
 const sameOrigin=(req,res,next)=>req.headers.origin===url.origin?next():res.status(403).send('Invalid form origin.');
 const allowCallback=(res,f)=>res.set('Content-Security-Policy',res.get('Content-Security-Policy').replace("form-action 'self'","form-action 'self' "+new URL(f.redirectUri).origin));
 const consentHtml=(id,f,error='')=>page('Cấp quyền cho agent',`<h1>Cấp quyền cho ứng dụng AI</h1><p>Ứng dụng yêu cầu: <strong>${escape(f.clientName)}</strong></p><small>Địa chỉ nhận kết quả: ${escape(f.redirectUri)}</small><p>Tên ứng dụng do bên kết nối khai báo. Chỉ tiếp tục nếu bạn vừa chủ động thêm MCP này.</p>${error?`<p class="error" role="alert">${escape(error)}</p>`:''}<form method="post" action="/consent"><input type="hidden" name="flow" value="${escape(id)}"><input type="hidden" name="csrf" value="${escape(f.csrf)}">${loginFields}${f.scopes.map(s=>`<label><input type="checkbox" name="scopes" value="${s}" checked> ${SCOPES[s]}</label>`).join('')}<p>Nội dung tool trả về sẽ được chia sẻ với ứng dụng AI bạn đang dùng. Quyền công bố là tùy chọn riêng. Không cấp quyền xem danh tính sinh viên, chấm điểm hay mở đáp án.</p><button name="decision" value="allow">Đăng nhập và cấp quyền</button><button class="secondary" name="decision" value="deny" formnovalidate>Từ chối</button></form>`);
 app.get('/consent',(req,res)=>{const f=flow(req);if(!f)return res.status(400).send('Phiên cấp quyền hết hạn. Quay lại ứng dụng AI và kết nối lại.');allowCallback(res,f);res.send(consentHtml(req.query.flow,f));});
 app.post('/consent',formLimit,sameOrigin,async(req,res)=>{
  const f=flow(req);if(!f||!equal(req.body.csrf,f.csrf))return res.status(403).send('Invalid or expired form.');
  allowCallback(res,f);const destination=new URL(f.redirectUri);destination.searchParams.set('iss',url.href);if(f.state)destination.searchParams.set('state',f.state);
  if(req.body.decision==='deny'){provider.pending.delete(req.body.flow);destination.searchParams.set('error','access_denied');return res.redirect(destination.href);}
  try{
   if(req.body.decision!=='allow'||typeof req.body.username!=='string'||typeof req.body.password!=='string'||req.body.username.length>128||req.body.password.length>256)throw new Error('Invalid form.');
   const selected=[req.body.scopes||[]].flat();if(!selected.length||selected.some(s=>!f.scopes.includes(s)))throw new Error('Invalid scopes.');
   const result=await backend.login(req.body.username,req.body.password);allowed(result.account);
   if(!provider.pending.has(req.body.flow))return res.status(409).send('Phiên đã được sử dụng.');
   provider.pending.delete(req.body.flow);
   const code=provider.issueCode({...f,scopes:selected,backendToken:result.token,userId:result.account.id});destination.searchParams.set('code',code);
   audit({event:'mcp_consent',userId:result.account.id,clientId:f.clientId,scopes:selected});res.clearCookie('lms_mcp_flow',{path:'/'});res.redirect(destination.href);
  }catch{res.status(401).send(consentHtml(req.body.flow,f,'Không thể cấp quyền. Kiểm tra tài khoản giảng viên được bật cho demo, mật khẩu và BE.'));}
 });
 app.get('/connections',(_req,res)=>{
  provider.cleanup();if(provider.management.size>=1000)return res.status(429).send('Thử lại sau.');
  const csrf=cryptoRandom();provider.management.set(csrf,{expiresAt:Math.floor(Date.now()/1000)+300});res.cookie('lms_mcp_manage',csrf,{httpOnly:true,secure:url.protocol==='https:',sameSite:'strict',path:'/connections',maxAge:300000});
  res.send(page('Quản lý kết nối',`<h1>Quản lý kết nối agent</h1><form method="post" action="/connections"><input type="hidden" name="csrf" value="${csrf}">${loginFields}<p>Đăng nhập để xem hoặc thu hồi các kết nối của chính bạn.</p><button name="action" value="list">Xem kết nối</button><button class="secondary" name="action" value="revoke-all">Thu hồi tất cả kết nối của tôi</button></form>`));
 });
 app.post('/connections',formLimit,sameOrigin,async(req,res)=>{
  provider.cleanup();const csrf=req.body.csrf;
  if(typeof csrf!=='string'||!provider.management.has(csrf)||!equal(cookie(req,'lms_mcp_manage'),csrf))return res.status(403).send('Phiên quản lý hết hạn. Mở lại trang.');
  try{
   if(typeof req.body.username!=='string'||typeof req.body.password!=='string'||req.body.username.length>128||req.body.password.length>256)throw new Error('Invalid login');
   const {account}=await backend.login(req.body.username,req.body.password);allowed(account);provider.management.delete(csrf);
   const grants=[...provider.grants.entries()].filter(([,g])=>g.userId===account.id);
   if(req.body.action==='revoke-all'){for(const [id] of grants)provider.removeGrant(id);audit({event:'mcp_revoke_all',userId:account.id});}
   else if(req.body.action!=='list')return res.status(400).send('Invalid action.');
   res.send(page('Kết nối của bạn',`<h1>${req.body.action==='revoke-all'?'Đã thu hồi kết nối':'Kết nối đang hoạt động'}</h1><p>${escape(account.name||account.id)}</p>${req.body.action==='list'?`<ul>${grants.map(([,g])=>`<li>${escape(provider.clients.get(g.clientId)?.client_name||g.clientId)} — ${escape(g.scopes.join(', '))}</li>`).join('')}</ul>`:`<p>Đã thu hồi ${grants.length} kết nối. Token truy cập và làm mới của chúng không còn dùng được.</p>`}<a href="/connections">Quay lại quản lý</a>`));
  }catch{res.status(401).send(page('Không đăng nhập được','<h1>Không đăng nhập được</h1><p>Kiểm tra tài khoản và BE, rồi <a href="/connections">thử lại</a>.</p>'));}
 });
 const authMiddleware=requireBearerAuth({verifier:provider,resourceMetadataUrl:getOAuthProtectedResourceMetadataUrl(new URL(provider.resource)),expectedResource:provider.resource});
 app.use('/mcp',(req,res,next)=>{const started=Date.now();res.on('finish',()=>audit({event:'mcp_http',method:req.method,rpcMethod:typeof req.body?.method==='string'?req.body.method.slice(0,80):undefined,status:res.statusCode,elapsedMs:Date.now()-started,origin:req.headers.origin}));next();});
 app.all('/mcp',rateLimit({windowMs:60000,limit:300,standardHeaders:'draft-8',legacyHeaders:false}),authMiddleware,async(req,res)=>{
  if(req.method!=='POST'){res.set('Allow','POST');return res.status(405).end();}
  const server=buildMcp({provider,backend,auth:req.auth,intents,audit});
  const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
  res.on('close',()=>{void transport.close();void server.close();});
  try{await server.connect(transport);await transport.handleRequest(req,res,req.body);}catch{if(!res.headersSent)res.status(500).json({error:'MCP request failed.'});}
 });
 app.use((error,_req,res,_next)=>{res.status(error.status===413?413:400).json({error:'Invalid request.'});});
 return {app,provider,intents};
}
import {randomBytes} from 'node:crypto';
const cryptoRandom=()=>randomBytes(32).toString('base64url');
