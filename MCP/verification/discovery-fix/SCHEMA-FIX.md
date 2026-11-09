# Discovery schema compatibility — 07/11/2026

Live ChatGPT trace: server/discover400, legacy initialize200, initialized202, tools/list200. Therefore the latest failed connection did reach successful tool-list transport. The earlier Origin fix alone did not resolve the user report.

A regression against the actual exported tools/list schemas failed in Python re.compile with bad escape \p: ID schema exported JavaScript Unicode property escapes without portable client semantics. Moved this ID constraint to server-side Zod refinement; exported schema retains type/minLength/maxLength while the exact Unicode ID rule is still enforced on tool arguments. No class authorization or bearer checks relaxed.

17 MCP tests pass, including SDK client discovery, exported regex compilation in Python, and rejection of query-injection ID. No proof of the internal ChatGPT schema implementation is available, so real-account discovery must be retried after restart before declaring the reported issue fully resolved. An authorized grant displayed in LMS indicates OAuth permission, not successful tool import.
