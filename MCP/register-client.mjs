// For clients whose setup UI explicitly asks for a client ID and client secret.
// Run from MCP after demo startup. Do not paste credentials into an AI conversation.
import {readFile,writeFile} from 'node:fs/promises';
const [name,...redirects]=process.argv.slice(2);
if(!name||!redirects.length)throw new Error('Usage: node register-client.mjs ClientName https://exact-callback-shown-by-client');
const {mcpUrl}=JSON.parse(await readFile(new URL('./.runtime/public.json',import.meta.url)));
const response=await fetch(new URL('/register',mcpUrl),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_name:name,redirect_uris:redirects,token_endpoint_auth_method:'client_secret_post',grant_types:['authorization_code','refresh_token'],response_types:['code']})});
if(!response.ok)throw new Error('Registration failed: '+response.status);
const result=await response.json();const file=new URL('./.runtime/oauth-client-private.json',import.meta.url);await writeFile(file,JSON.stringify(result,null,2),{mode:0o600});console.log('Client credentials saved locally: '+file.pathname+'\nUse only in the client OAuth configuration. Restarting MCP invalidates this registration.');
