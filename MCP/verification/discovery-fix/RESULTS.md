# Discovery compatibility fix — 07/11/2026

Reported: ChatGPT completed OAuth, then “Authentication succeeded, action discovery failed”. Existing server logs recorded consent but no per-request discovery traces.

Reproduced against running public endpoint: requests with Origin https://chatgpt.com returned403 “Unexpected origin” before token verification. Added exact MCP endpoint origin allowlist for ChatGPT, Claude and Gemini plus the configured server origin; did not relax consent form Origin/CSRF or bearer authorization. Unknown origins still rejected. Added safe request metadata logging (method/RPC method/status/duration/origin), without request bodies, tokens or passwords.

Regression: actual SDK clients now initialize and list five tools with each accepted AI Origin. A missing token still401 and unknown origins still403. Tests use loopback and mock BE, not the user's ChatGPT account. The public running process must be restarted to load the patch; ChatGPT discovery must then be retried. This reproduced compatibility issue is fixed, but the original ChatGPT request headers were not recorded, so it is not proof that this is the only cause of the screenshot error.
