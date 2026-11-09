import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash,randomBytes} from 'node:crypto';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {createApp} from '../src/app.mjs';
let http,base,provider,writes=[],handler;
const account={id:'gv1',name:'Lecturer',active:true,mustChange:false,role:'giang-vien'};
const backend={
 async login(username,password){if(username!=='gv1'||password!=='demo-password')throw new Error('bad login');return {token:'BE-JWT-NEVER-EXPOSE',account};},
 async request(path,token,options={}){
  assert.equal(token,'BE-JWT-NEVER-EXPOSE');
  if(path==='/api/auth/me')return account;
  if(options.method==='PUT'){if(path.includes('foreign')||path.includes('pending')){const e=new Error('Publication denied');e.status=path.includes('foreign')?403:400;throw e;}writes.push(options);return {id:path.split('/').at(-1),...options.body};}
  if(path.startsWith('/api/class-info/search'))return {content:[{id:'class1',name:'My class',studentIds:['private-student'],studentCount:1}],page:0,size:20,totalElements:1,totalPages:1};
  if(path==='/api/class-info/foreign'){const e=new Error('Không có quyền thao tác trong lớp này.');e.status=403;throw e;}
  if(options.method==='POST'){if(options.body.classId==='foreign'){const e=new Error('Không có quyền thao tác trong lớp này.');e.status=403;throw e;}writes.push(options);return {id:`created-${writes.length}`,...options.body};}
  if(path==='/api/lessons/draft')return {id:'draft',published:false};
  if(path==='/api/lessons/live')return {id:'live',published:true};
  return {content:[]};
 }
};
before(async()=>{
 http=createServer((req,res)=>handler(req,res));await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${http.address().port}`;
 const result=createApp({publicUrl:base,backend,allowedUsers:['gv1'],internalKey:'test-bridge-key-01234567890123456789',audit:()=>{}});handler=result.app;provider=result.provider;
});
after(()=>new Promise(resolve=>http.close(resolve)));
const post=(path,body,headers={})=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),redirect:'manual'});
async function begin(scopes='lms:read lms:draft'){
 const registered=await post('/register',{client_name:'Demo <agent>',redirect_uris:['https://client.example/callback'],token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code']});assert.equal(registered.status,201);const client=await registered.json();
 const verifier=randomBytes(32).toString('base64url'),challenge=createHash('sha256').update(verifier).digest('base64url');
 const q=new URLSearchParams({client_id:client.client_id,response_type:'code',redirect_uri:'https://client.example/callback',code_challenge:challenge,code_challenge_method:'S256',scope:scopes,state:'test-state',resource:base+'/mcp'});
 const response=await fetch(base+'/authorize?'+q,{redirect:'manual'});assert.equal(response.status,302);
 const location=response.headers.get('location'),cookie=response.headers.get('set-cookie').split(';')[0];const flow=new URL(location,base).searchParams.get('flow');
 const csrf=cookie.split('=')[1];return {client,verifier,cookie,flow,csrf,location};
}
async function approve(f){
 return fetch(base+'/consent',{method:'POST',redirect:'manual',headers:{Origin:base,Cookie:f.cookie,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({flow:f.flow,csrf:f.csrf,username:'gv1',password:'demo-password',scopes:'lms:read',decision:'allow'})});
}
async function exchange(f,code,verifier=f.verifier){return fetch(base+'/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:f.client.client_id,redirect_uri:'https://client.example/callback',code,code_verifier:verifier,resource:base+'/mcp'})});}
async function access(scopes=['lms:read','lms:draft']){
 const c=provider.issueCode({clientId:'test',redirectUri:'https://test.example/cb',codeChallenge:'c',scopes,backendToken:'BE-JWT-NEVER-EXPOSE',userId:'gv1'});
 return (await provider.exchangeAuthorizationCode({client_id:'test'},c,undefined,'https://test.example/cb')).access_token;
}
async function connect(token){const client=new Client({name:'test',version:'1'});await client.connect(new StreamableHTTPClientTransport(new URL(base+'/mcp'),{requestInit:{headers:{Authorization:`Bearer ${token}`}}}));return client;}
test('OAuth discovery and unauthenticated requests advertise the correct resource',async()=>{
 const r=await post('/mcp',{});assert.equal(r.status,401);assert.match(r.headers.get('www-authenticate'),/oauth-protected-resource\/mcp/);
 const metadata=await(await fetch(base+'/.well-known/oauth-authorization-server')).json();assert.deepEqual(metadata.code_challenge_methods_supported,['S256']);assert.equal(metadata.registration_endpoint,base+'/register');
 assert.equal((await(await fetch(base+'/.well-known/oauth-protected-resource/mcp')).json()).resource,base+'/mcp');
});
test('consent escapes client metadata, requires browser cookie and CSRF, PKCE then succeeds once',async()=>{
 const f=await begin();const form=await fetch(base+f.location,{headers:{Cookie:f.cookie}});assert.match(form.headers.get('content-security-policy'),/form-action 'self' https:\/\/client.example/);const html=await form.text();assert.match(html,/Demo &lt;agent&gt;/);assert.ok(!html.includes('BE-JWT-NEVER-EXPOSE'));
 assert.equal((await fetch(base+f.location)).status,400);
 assert.equal((await post('/consent',{flow:f.flow,csrf:f.csrf,decision:'allow'},{Origin:base})).status,403);
 const approved=await approve(f);assert.equal(approved.status,302);const dest=new URL(approved.headers.get('location'));assert.equal(dest.searchParams.get('state'),'test-state');assert.equal(dest.searchParams.get('iss'),base+'/');const code=dest.searchParams.get('code');
 assert.equal((await exchange(f,code,'bad-verifier')).status,400);const response=await exchange(f,code);assert.equal(response.status,200);const t=await response.json();assert.equal(t.scope,'lms:read');assert.notEqual(t.access_token,'BE-JWT-NEVER-EXPOSE');
 assert.equal((await exchange(f,code)).status,400);
});
test('consent refuses a cross-origin form and denial returns access_denied',async()=>{
 const f=await begin();assert.equal((await post('/consent',{flow:f.flow,csrf:f.csrf},{Cookie:f.cookie,Origin:'https://evil.example'})).status,403);
 const r=await fetch(base+'/consent',{method:'POST',redirect:'manual',headers:{Origin:base,Cookie:f.cookie,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({flow:f.flow,csrf:f.csrf,decision:'deny'})});assert.equal(new URL(r.headers.get('location')).searchParams.get('error'),'access_denied');
});
test('actual SDK client lists tools and returns class summaries without student identities',async()=>{
 const c=await connect(await access());try{const tools=await c.listTools();assert.equal(tools.tools.length,7);assert.deepEqual(tools.tools[0]._meta.securitySchemes,[{type:'oauth2',scopes:['lms:read']}]);assert.ok(!tools.tools.some(t=>/grade|release|delete/.test(t.name)));const r=await c.callTool({name:'list_my_classes',arguments:{}});assert.ok(!JSON.stringify(r).includes('private-student'));assert.ok(!JSON.stringify(r).includes('BE-JWT'));}finally{await c.close();}
});
test('read scope cannot write; foreign classes denied; schema cannot smuggle published flag',async()=>{
 const c=await connect(await access(['lms:read']));try{const r=await c.callTool({name:'create_lesson_draft',arguments:{requestKey:'read-denied',classId:'class1',title:'Test',slides:[]}});assert.equal(r.isError,true);assert.match(r._meta['mcp/www_authenticate'][0],/insufficient_scope/);}finally{await c.close();}
 const w=await connect(await access());try{assert.equal((await w.callTool({name:'list_lessons',arguments:{classId:'foreign'}})).isError,true);assert.equal((await w.callTool({name:'create_lesson_draft',arguments:{requestKey:'foreign-denied',classId:'foreign',title:'Test',slides:[]}})).isError,true);const r=await w.callTool({name:'create_lesson_draft',arguments:{requestKey:'published-smuggle',classId:'class1',title:'Test',slides:[],published:true}});assert.ok(!r.isError);assert.equal(r.structuredContent.result.published,false);}finally{await w.close();}
});
test('retry and simultaneous writes are deduplicated; changed payload rejected',async()=>{
 const c=await connect(await access());try{
  const args={requestKey:'same-intent-test',classId:'class1',title:'Same',slides:['One']};const initial=writes.length;
  const [a,b]=await Promise.all([c.callTool({name:'create_lesson_draft',arguments:args}),c.callTool({name:'create_lesson_draft',arguments:args})]);assert.deepEqual(a,b);assert.equal(writes.length,initial+1);
  assert.equal((await c.callTool({name:'create_lesson_draft',arguments:{...args,title:'Changed'}})).isError,true);
  assert.equal((await c.callTool({name:'create_questions',arguments:{requestKey:'live-question',lessonId:'live',questions:[{text:'Q',options:['A','B','C','D'],correct:0,explanation:'A'}]}})).isError,true);
 }finally{await c.close();}
});
test('revoked connection no longer initializes MCP; foreign Origin is refused',async()=>{
 const token=await access();assert.equal((await post('/mcp',{}, {Origin:'https://evil.example',Authorization:`Bearer ${token}`})).status,403);
 await provider.revokeToken({client_id:'test'},{token});assert.equal((await post('/mcp',{}, {Authorization:`Bearer ${token}`})).status,401);
});
test('management requires login and CSRF, and revokes only the signed-in lecturer',async()=>{
 const token=await access();
 const response=await fetch(base+'/connections'),html=await response.text(),cookie=response.headers.get('set-cookie').split(';')[0];const csrf=html.match(/name="csrf" value="([^"]+)"/)[1];
 assert.equal((await fetch(base+'/connections',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrf,username:'gv1',password:'demo-password',action:'revoke-all'})})).status,403);
 const result=await fetch(base+'/connections',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrf,username:'gv1',password:'demo-password',action:'revoke-all'})});assert.equal(result.status,200);assert.match(await result.text(),/Đã thu hồi/);await assert.rejects(provider.verifyAccessToken(token));
});
test('malformed quiz batch does not reach BE',async()=>{
 const c=await connect(await access());try{const initial=writes.length;const r=await c.callTool({name:'create_questions',arguments:{requestKey:'invalid-quiz',lessonId:'draft',questions:[{text:'Q',options:['A'],correct:0,explanation:'A'}]}});assert.equal(r.isError,true);assert.equal(writes.length,initial);}finally{await c.close();}
});
test('web bridge requires service key plus lecturer JWT and exposes only own grants',async()=>{
 const own=await access();
 const otherCode=provider.issueCode({clientId:'other',redirectUri:'https://test.example/cb',codeChallenge:'c',scopes:['lms:read'],backendToken:'BE-OTHER',userId:'gv2'});
 await provider.exchangeAuthorizationCode({client_id:'other'},otherCode,undefined,'https://test.example/cb');
 assert.equal((await fetch(base+'/internal/connections')).status,404);
 const headers={'X-LMS-MCP-Key':'test-bridge-key-01234567890123456789',Authorization:'Bearer BE-JWT-NEVER-EXPOSE'};
 const response=await fetch(base+'/internal/connections',{headers});assert.equal(response.status,200);const data=await response.json();assert.ok(data.connections.length);assert.ok(!data.connections.some(g=>g.clientName==='other'));assert.ok(!JSON.stringify(data).includes('BE-JWT'));
 const foreign=[...provider.grants.entries()].find(([,g])=>g.userId==='gv2')[0];assert.equal((await fetch(base+'/internal/connections/'+foreign,{method:'DELETE',headers})).status,404);
 const grantId=(await provider.verifyAccessToken(own)).extra.grantId;assert.equal((await fetch(base+'/internal/connections/'+grantId,{method:'DELETE',headers})).status,200);
 await assert.rejects(provider.verifyAccessToken(own));assert.ok(provider.grants.has(foreign));
});

test('ChatGPT, Claude and Gemini origins can discover tools with a valid token',async()=>{
 const token=await access();
 for(const origin of ['https://chatgpt.com','https://claude.ai','https://gemini.google.com']){
 const c=new Client({name:'origin-check',version:'1'});
 try{await c.connect(new StreamableHTTPClientTransport(new URL(base+'/mcp'),{requestInit:{headers:{Authorization:`Bearer ${token}`,Origin:origin}}}));assert.equal((await c.listTools()).tools.length,7);}finally{await c.close();}
 }
 assert.equal((await post('/mcp',{}, {Origin:'https://chatgpt.com'})).status,401);
});
test('advertised schema regexes compile in non-JavaScript validators',async()=>{
 const c=await connect(await access());try{const {tools}=await c.listTools();
 const {spawnSync}=await import('node:child_process');
 const result=spawnSync('python3',['-c',`import json,re,sys
def walk(v):
 if isinstance(v,dict):
  if 'pattern' in v: re.compile(v['pattern'])
  for x in v.values(): walk(x)
 elif isinstance(v,list):
  for x in v: walk(x)
walk(json.load(sys.stdin))`],{input:JSON.stringify(tools),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 assert.equal((await c.callTool({name:'list_lessons',arguments:{classId:'class1,teacherId:other'}})).isError,true);
 }finally{await c.close();}
});
test('publishing needs its own scope, explicit confirmation, and uses BE publication command only',async()=>{
 const args={lessonId:'draft',requestKey:'publish-intent',confirmed:true};
 const draftClient=await connect(await access());
 try{assert.equal((await draftClient.callTool({name:'publish_lesson',arguments:args})).isError,true);}finally{await draftClient.close();}
 const c=await connect(await access(['lms:read','lms:publish']));
 try{
  const initial=writes.length;
  assert.equal((await c.callTool({name:'publish_lesson',arguments:{...args,confirmed:false}})).isError,true);assert.equal(writes.length,initial);
  const result=await c.callTool({name:'publish_lesson',arguments:args});assert.ok(!result.isError);assert.equal(writes.length,initial+1);assert.deepEqual(writes.at(-1).body,{published:true});assert.equal(writes.at(-1).method,'PUT');
  await c.callTool({name:'publish_lesson',arguments:args});assert.equal(writes.length,initial+1);
  assert.equal((await c.callTool({name:'publish_lesson',arguments:{...args,lessonId:'foreign',requestKey:'publish-foreign'}})).isError,true);
  assert.equal((await c.callTool({name:'publish_lesson',arguments:{...args,lessonId:'pending',requestKey:'publish-pending'}})).isError,true);
  const exam=await c.callTool({name:'publish_assignment',arguments:{assignmentId:'exam-draft',requestKey:'publish-exam',confirmed:true}});assert.ok(!exam.isError);assert.deepEqual(writes.at(-1).body,{published:true});
 }finally{await c.close();}
});
