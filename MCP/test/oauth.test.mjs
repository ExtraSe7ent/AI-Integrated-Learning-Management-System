import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LmsOAuthProvider} from '../src/oauth.mjs';
const backend={request:async()=>({id:'gv1',role:'giang-vien',active:true,mustChange:false})};
const setup=()=>new LmsOAuthProvider({publicUrl:'http://localhost:19090',backend});
test('rejects foreign resources and unsafe redirect registrations',async()=>{
 const p=setup();
 await assert.rejects(p.clientsStore.registerClient({client_id:'x',redirect_uris:['http://evil.example/cb']}));
 await assert.rejects(p.authorize({client_id:'x'},{resource:new URL('https://evil.example/mcp')},{}));
});
test('code is bound to client, redirect, resource, expires and is single use',async()=>{
 const p=setup();const code=p.issueCode({clientId:'a',redirectUri:'https://client.example/cb',codeChallenge:'challenge',scopes:['lms:read'],backendToken:'backend-secret',userId:'gv1'});
 await assert.rejects(p.exchangeAuthorizationCode({client_id:'b'},code,undefined,'https://client.example/cb'));
 await assert.rejects(p.exchangeAuthorizationCode({client_id:'a'},code,undefined,'https://client.example/wrong'));
 const t=await p.exchangeAuthorizationCode({client_id:'a'},code,undefined,'https://client.example/cb');
 assert.notEqual(t.access_token,'backend-secret');
 const info=await p.verifyAccessToken(t.access_token);assert.equal(info.extra.userId,'gv1');assert.deepEqual(info.scopes,['lms:read']);
 await assert.rejects(p.exchangeAuthorizationCode({client_id:'a'},code,undefined,'https://client.example/cb'));
 await p.revokeToken({client_id:'b'},{token:t.access_token});await p.verifyAccessToken(t.access_token);
 await p.revokeToken({client_id:'a'},{token:t.access_token});await assert.rejects(p.verifyAccessToken(t.access_token));
});
test('refresh rotates tokens, cannot add scope or change resource',async()=>{
 const p=setup();const c=p.issueCode({clientId:'a',redirectUri:'https://client.example/cb',codeChallenge:'c',scopes:['lms:read'],backendToken:'secret',userId:'gv1'});
 const t=await p.exchangeAuthorizationCode({client_id:'a'},c,undefined,'https://client.example/cb');
 await assert.rejects(p.exchangeRefreshToken({client_id:'a'},t.refresh_token,['lms:draft']));
 await assert.rejects(p.exchangeRefreshToken({client_id:'a'},t.refresh_token,undefined,new URL('https://evil.example/mcp')));
 const next=await p.exchangeRefreshToken({client_id:'a'},t.refresh_token);assert.notEqual(next.refresh_token,t.refresh_token);
 await assert.rejects(p.exchangeRefreshToken({client_id:'a'},t.refresh_token));
 await assert.rejects(p.verifyAccessToken(t.access_token));
});
test('changed account role or disabled identity invalidates access',async()=>{
 const p=setup();const c=p.issueCode({clientId:'a',redirectUri:'https://client.example/cb',codeChallenge:'c',scopes:['lms:read'],backendToken:'secret',userId:'gv1'});
 const t=await p.exchangeAuthorizationCode({client_id:'a'},c,undefined,'https://client.example/cb');
 p.backend={request:async()=>({id:'gv1',role:'sinh-vien',active:true})};await assert.rejects(p.verifyAccessToken(t.access_token));
});
test('expired code and access tokens are refused',async()=>{
 const p=setup();const c=p.issueCode({clientId:'a',redirectUri:'https://client.example/cb',codeChallenge:'c',scopes:['lms:read'],backendToken:'secret',userId:'gv1'});
 for(const r of p.codes.values())r.expiresAt=0;
 await assert.rejects(p.challengeForAuthorizationCode({client_id:'a'},c));
 const next=p.issueCode({clientId:'a',redirectUri:'https://client.example/cb',codeChallenge:'c',scopes:['lms:read'],backendToken:'secret',userId:'gv1'});
 const t=await p.exchangeAuthorizationCode({client_id:'a'},next,undefined,'https://client.example/cb');
 for(const r of p.access.values())r.expiresAt=0;
 await assert.rejects(p.verifyAccessToken(t.access_token));
});
