// Only this launcher's disposable H2 demo. Never use against another environment.
import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const runtime=new URL('./.runtime/',import.meta.url);
const info=JSON.parse(await readFile(new URL('public.json',runtime))),credentials=JSON.parse(await readFile(new URL('demo-private.json',runtime)));
const base=new URL(info.mcpUrl).origin,results=[];
const check=async(name,fn)=>{await fn();results.push({name,status:'PASS'});console.log('PASS',name);};
const request=async(path,body)=>fetch(base+path,{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
let token,clientInfo,grant,lessonId,assignmentId,classes,client;
try{
 await check('Public HTTPS metadata and missing-token challenge',async()=>{
  assert.equal((await fetch(base+'/health')).status,200);assert.equal((await request('/mcp',{})).status,401);
  const metadata=await(await fetch(base+'/.well-known/oauth-protected-resource/mcp')).json();assert.equal(metadata.resource,info.mcpUrl);
 });
 await check('OAuth authorization code + PKCE through public tunnel',async()=>{
  const r=await request('/register',{client_name:'VJU MCP demo verification',redirect_uris:['https://example.invalid/callback'],token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code']});assert.equal(r.status,201);clientInfo=await r.json();
  const verifier=randomBytes(32).toString('base64url'),challenge=createHash('sha256').update(verifier).digest('base64url');
  const q=new URLSearchParams({client_id:clientInfo.client_id,redirect_uri:'https://example.invalid/callback',response_type:'code',code_challenge:challenge,code_challenge_method:'S256',scope:'lms:read lms:draft',resource:info.mcpUrl,state:'demo-smoke'});
  const start=await fetch(base+'/authorize?'+q,{redirect:'manual'});assert.equal(start.status,302);const cookie=start.headers.get('set-cookie').split(';')[0],flow=new URL(start.headers.get('location'),base).searchParams.get('flow'),csrf=cookie.split('=')[1];
  assert.equal((await fetch(base+start.headers.get('location'),{headers:{Cookie:cookie}})).status,200);
  const body=new URLSearchParams({flow,csrf,username:credentials.username,password:credentials.password,decision:'allow'});body.append('scopes','lms:read');body.append('scopes','lms:draft');
  const consent=await fetch(base+'/consent',{method:'POST',redirect:'manual',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/x-www-form-urlencoded'},body});assert.equal(consent.status,302);
  const code=new URL(consent.headers.get('location')).searchParams.get('code');
  const exchange=await fetch(base+'/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:clientInfo.client_id,redirect_uri:'https://example.invalid/callback',code,code_verifier:verifier,resource:info.mcpUrl})});assert.equal(exchange.status,200);grant=await exchange.json();token=grant.access_token;
 });
 client=new Client({name:'demo-verifier',version:'1'});await client.connect(new StreamableHTTPClientTransport(new URL(info.mcpUrl),{requestInit:{headers:{Authorization:`Bearer ${token}`}}}));
 const call=async(name,args)=>{const result=await client.callTool({name,arguments:args});assert.ok(!result.isError,JSON.stringify(result));return result.structuredContent.result;};
 await check('Remote SDK connects and lists only seven scoped tools',async()=>{assert.equal((await client.listTools()).tools.length,7);});
 await check('Read assigned classes without roster identities',async()=>{const result=await call('list_my_classes',{});classes=result.content;assert.ok(classes.length);assert.ok(!JSON.stringify(result).includes('studentIds'));});
 const key=randomBytes(10).toString('hex');
 await check('Create lesson draft; retry reuses same BE record',async()=>{const args={requestKey:key+'-lesson',classId:classes[0].id,title:'MCP demo REST API '+key,slides:['REST API: tài nguyên và phương thức HTTP','GET đọc, POST tạo tài nguyên'],week:1};const a=await call('create_lesson_draft',args),b=await call('create_lesson_draft',args);assert.equal(a.id,b.id);assert.equal(a.published,false);lessonId=a.id;});
 await check('Create unapproved quiz questions via transactional BE import',async()=>{const q=await call('create_questions',{requestKey:key+'-quiz',lessonId,questions:[{text:'Phương thức nào thường dùng để tạo tài nguyên?',options:['GET','POST','HEAD','OPTIONS'],correct:1,explanation:'POST gửi yêu cầu tạo tài nguyên.',page:1}]});assert.equal(q.length,1);assert.equal(q[0].approved,false);});
 await check('Create unpublished assignment with official first-attempt policy',async()=>{const a=await call('create_assignment_draft',{requestKey:key+'-assignment',classId:classes[0].id,title:'MCP demo assignment '+key,minutes:30,opens:'2026-01-01T00:00:00',closes:'2099-01-01T00:00:00',questions:[{type:'choice',text:'HTTP nào dùng đọc tài nguyên?',options:['GET','POST'],correct:'0',points:10,explanation:'GET đọc tài nguyên.'}]});assert.equal(a.published,false);assert.equal(a.attempts,1);assignmentId=a.id;});
 await check('Existing class owned by another lecturer is rejected by actual BE',async()=>{
  const login=await fetch('http://127.0.0.1:18081/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'AD001',password:credentials.password})});assert.equal(login.status,200);const adminToken=(await login.json()).token;
  const create=async(path,body)=>{const r=await fetch('http://127.0.0.1:18081/api'+path,{method:'POST',headers:{Authorization:`Bearer ${adminToken}`,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.ok(r.ok);return r.json();};
  const course=await create('/courses',{id:'mcp-course-'+key,code:'MCP'+key,title:'MCP isolated scope test',faculty:'CNTT'});
  const cls=await create('/class-info',{id:'mcp-foreign-'+key,courseId:course.id,name:'MCP foreign class',teacherId:'GV002',term:'I',year:'2026-2027',round:'1'});
  const r=await client.callTool({name:'list_lessons',arguments:{classId:cls.id}});assert.equal(r.isError,true);
  const write=await client.callTool({name:'create_lesson_draft',arguments:{requestKey:key+'-foreign',classId:cls.id,title:'Forbidden',slides:[]}});assert.equal(write.isError,true);
 });
 await check('Created data visible through normal lecturer bootstrap API',async()=>{
  const login=await fetch('http://127.0.0.1:18081/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(credentials)});assert.equal(login.status,200);const backendToken=(await login.json()).token;
  const result=await(await fetch('http://127.0.0.1:18081/api/bootstrap',{headers:{Authorization:`Bearer ${backendToken}`}})).json();const text=JSON.stringify(result);assert.ok(text.includes(lessonId));assert.ok(text.includes(assignmentId));
 });
 await check('Token revocation invalidates remote MCP access',async()=>{const r=await fetch(base+'/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientInfo.client_id,token})});assert.equal(r.status,200);assert.equal((await fetch(info.mcpUrl,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:'{}'})).status,401);});
 await writeFile(new URL('smoke-results.json',runtime),JSON.stringify({at:new Date().toISOString(),publicOrigin:base,results,lessonId,assignmentId},null,2));
 console.log(`${results.length}/${results.length} PASS. Evidence: .runtime/smoke-results.json`);
}catch(error){console.error('FAIL',error.message);process.exitCode=1;}finally{await client?.close();}
