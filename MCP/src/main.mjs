import {createApp} from './app.mjs';
const port=Number(process.env.MCP_PORT||19090);
const publicUrl=process.env.MCP_PUBLIC_URL||`http://127.0.0.1:${port}`;
const {app,provider}=createApp({publicUrl,backendUrl:process.env.LMS_BACKEND_URL||'http://127.0.0.1:8080',internalKey:process.env.MCP_INTERNAL_KEY||'',allowedUsers:(process.env.MCP_ALLOWED_USERS||'').split(',').map(s=>s.trim()).filter(Boolean)});
const server=app.listen(port,'127.0.0.1',()=>console.log(`VJU LMS MCP: ${provider.resource}\nQuản lý kết nối: ${publicUrl}/connections\nOAuth/grants/idempotency ở RAM: khởi động lại phải kết nối lại.`));
const timer=setInterval(()=>provider.cleanup(),60000);timer.unref();
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{clearInterval(timer);server.close(()=>process.exit(0));});
