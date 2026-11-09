import {randomBytes, createHash} from 'node:crypto';
import {InvalidGrantError, InvalidTokenError, InvalidScopeError, InvalidTargetError, InvalidClientMetadataError, InvalidRequestError} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import {assertLecturer} from './backend.mjs';
export const SCOPES = {'lms:read':'Đọc các lớp và nội dung bạn phụ trách', 'lms:draft':'Tạo bài giảng, câu hỏi và bài tập nháp', 'lms:publish':'Công bố bài giảng và bài tập khi bạn yêu cầu'};
const random = () => randomBytes(32).toString('base64url');
const digest = value => createHash('sha256').update(value).digest('hex');
const now = () => Math.floor(Date.now()/1000);
export class LmsOAuthProvider {
  constructor({publicUrl, backend}) {
    this.publicUrl = new URL(publicUrl).origin;
    this.resource = `${this.publicUrl}/mcp`;
    this.backend = backend;
    this.clients = new Map(); this.pending = new Map(); this.codes = new Map(); this.grants = new Map();
    this.access = new Map(); this.refresh = new Map(); this.management = new Map();
    this.clientsStore = {
      getClient: async id => this.clients.get(id),
      registerClient: async client => {
        this.cleanup();
        if (JSON.stringify(client).length > 16000 || this.clients.size >= 1000 || !client.redirect_uris?.length || client.redirect_uris.length > 10) throw new InvalidClientMetadataError('Client registration limit.');
        for (const raw of client.redirect_uris) {
          const u = new URL(raw);
          if (u.hash || u.username || u.password || !(u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(u.hostname)))) throw new InvalidClientMetadataError('Redirect must use HTTPS or loopback HTTP.');
        }
        if (!['none','client_secret_post',undefined].includes(client.token_endpoint_auth_method)) throw new InvalidClientMetadataError('Unsupported client authentication method.');
        this.clients.set(client.client_id, {...client, storedAt:now()}); return client;
      },
    };
  }
  cleanup() {
    for (const map of [this.pending,this.codes,this.management]) for (const [key,value] of map) if(value.expiresAt <= now()) map.delete(key);
    for (const [id,g] of this.grants) if(g.expiresAt <= now()) this.removeGrant(id);
    // Demo registrations are temporary too; a restart or 24h idle age requires reconnecting.
    for (const [id,c] of this.clients) if(c.storedAt + 86400 < now() && ![...this.grants.values()].some(g=>g.clientId===id)) this.clients.delete(id);
  }
  requireResource(resource) {
    if (resource && resource.href !== this.resource) throw new InvalidTargetError('Token is only valid for this LMS MCP.');
  }
  async authorize(client, params, res) {
    this.cleanup(); this.requireResource(params.resource);
    const scopes = params.scopes?.length ? params.scopes : ['lms:read'];
    if (scopes.some(s=>!Object.hasOwn(SCOPES,s))) throw new InvalidScopeError('Unknown LMS scope.');
    if (this.pending.size >= 1000) throw new InvalidRequestError('Too many pending authorizations.');
    const id=random(), csrf=random();
    this.pending.set(id,{clientId:client.client_id,clientName:client.client_name || 'Ứng dụng MCP',redirectUri:params.redirectUri,codeChallenge:params.codeChallenge,state:params.state,scopes,csrf,expiresAt:now()+600});
    res.cookie('lms_mcp_flow',csrf,{httpOnly:true,secure:this.publicUrl.startsWith('https:'),sameSite:'lax',path:'/',maxAge:600000});
    res.redirect(`/consent?flow=${id}`);
  }
  issueCode(data) {
    this.cleanup();
    if(this.codes.size>=1000) throw new InvalidRequestError('Authorization code limit.');
    const code=random();this.codes.set(digest(code),{...data,expiresAt:now()+120});return code;
  }
  code(client, code) {
    const record=this.codes.get(digest(code));
    if(!record || record.expiresAt <= now() || record.clientId !== client.client_id) throw new InvalidGrantError('Invalid or expired authorization code.');
    return record;
  }
  async challengeForAuthorizationCode(client, code) {return this.code(client,code).codeChallenge;}
  async exchangeAuthorizationCode(client, code, _verifier, redirectUri, resource) {
    this.requireResource(resource);
    const record=this.code(client,code);
    if(redirectUri !== record.redirectUri) throw new InvalidGrantError('Redirect URI mismatch.');
    if(this.grants.size>=1000) throw new InvalidGrantError('Connection limit.');
    this.codes.delete(digest(code));
    const id=random();this.grants.set(id,{...record,createdAt:now(),expiresAt:now()+28800});
    return this.tokens(id,record.scopes);
  }
  tokens(id, scopes) {
    const accessToken=random(),refreshToken=random(),expiresAt=now()+1800;
    this.access.set(digest(accessToken),{grantId:id,scopes,expiresAt});
    this.refresh.set(digest(refreshToken),{grantId:id,scopes});
    return {access_token:accessToken,refresh_token:refreshToken,token_type:'Bearer',expires_in:1800,scope:scopes.join(' ')};
  }
  removeGrant(id) {
    this.grants.delete(id);
    for(const map of [this.access,this.refresh]) for(const [key,t] of map) if(t.grantId===id) map.delete(key);
  }
  grantFor(token, map) {
    this.cleanup();const record=map.get(digest(token)),grant=record && this.grants.get(record.grantId);
    if(!grant || (map===this.access && (!Number.isFinite(record.expiresAt) || record.expiresAt<=now()))) throw new InvalidTokenError('Invalid or expired MCP token.');
    return {record,grant};
  }
  async account(grant) {
    try {
      const a=assertLecturer(await this.backend.request('/api/auth/me',grant.backendToken));
      if(a.id !== grant.userId) throw new Error('Identity mismatch');
      return a;
    } catch {throw new InvalidTokenError('LMS session expired or teaching access revoked. Reconnect.');}
  }
  async exchangeRefreshToken(client, token, scopes, resource) {
    this.requireResource(resource);
    let found;try{found=this.grantFor(token,this.refresh);}catch{throw new InvalidGrantError('Invalid refresh token.');}
    const {record,grant}=found;
    if(grant.clientId !== client.client_id) throw new InvalidGrantError('Client mismatch.');
    const next=scopes || record.scopes;
    if(next.some(s=>!record.scopes.includes(s))) throw new InvalidScopeError('Cannot expand granted scope.');
    await this.account(grant);
    // One refresh may win; concurrent reuse is rejected after the asynchronous account check.
    if(!this.refresh.has(digest(token)) || !this.grants.has(record.grantId)) throw new InvalidGrantError('Refresh already consumed.');
    for(const map of [this.access,this.refresh]) for(const [key,t] of map) if(t.grantId===record.grantId) map.delete(key);
    return this.tokens(record.grantId,next);
  }
  async verifyAccessToken(token) {
    const {record,grant}=this.grantFor(token,this.access);await this.account(grant);
    if(!this.access.has(digest(token)) || !this.grants.has(record.grantId)) throw new InvalidTokenError('Connection revoked.');
    return {token,clientId:grant.clientId,scopes:record.scopes,expiresAt:record.expiresAt,resource:new URL(this.resource),extra:{userId:grant.userId,grantId:record.grantId}};
  }
  backendToken(auth) {
    const {record,grant}=this.grantFor(auth.token,this.access);
    if(record.grantId!==auth.extra.grantId) throw new InvalidTokenError('Connection revoked.');
    return grant.backendToken;
  }
  async revokeToken(client,{token}) {
    const record=this.access.get(digest(token)) || this.refresh.get(digest(token));
    if(record && this.grants.get(record.grantId)?.clientId===client.client_id) this.removeGrant(record.grantId);
  }
}
