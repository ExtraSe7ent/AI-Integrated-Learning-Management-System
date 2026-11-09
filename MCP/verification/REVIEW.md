# Review MCP demo — 07/11/2026

Phạm vi: mới trong `Moi/MCP`, không sửa BE/FE source, không merge/push Git. Dịch vụ gọi API đã có thay vì nhân bản quy tắc lớp/điểm.

- Correctness: test OAuth binding client/redirect/resource, PKCE, mã dùng một lần, expiry, refresh rotation, role thay đổi, revoke, scope, idempotency/concurrency và schema. Runtime smoke dùng BE H2 RAM thật và SDK client qua HTTPS.
- Security: chỉ GV được bật theo ID, không nhận token BE trực tiếp tại MCP, token opaque riêng, BE token trong RAM; form cookie+CSRF+Origin, CSP cho callback đã đăng ký; host cố định; loopback-only server, trust proxy loopback; giới hạn tốc độ/body/map; không nhận URL fetch tùy ý từ agent.
- Privacy: danh sách lớp loại bỏ studentIds; không cung cấp grading/roster/publish/release/delete; audit không ghi nội dung/token/password; runtime secrets không thuộc source/verification.
- Architecture/readability: tách backend adapter, OAuth state/provider, MCP tools, HTTP/form và launcher. README mô tả chạy demo và trỏ tới BE hiện hành, lifecycle RAM và cách kết nối client. SDK v1.32.2 dùng theo API thực tế đã cài; Zod đã cập nhật4.6.7 sau advisory high, audit cuối0.
- Performance: danh sách phân trang, câu hỏi/bài tập bounded, intent8h/cap10000, OAuth/client/pending bounded và TTL cleanup; backend timeout15s. Chưa test tải/multi-instance.

Browser QA phát hiện Origin=null do Referrer-Policy no-referrer và CSP không cho callback external. Sửa policy đúng luồng form, chỉ mở callback origin đã đăng ký; kiểm chứng lại bằng browser chứ không chỉ test HTTP thủ công. Không hạ CSRF check để vượt lỗi.

Giới hạn: quyền/idempotency/client đăng ký ở RAM; restart cần kết nối lại, timeout ghi cần đối soát trên web. Chưa dùng production hoặc lưu dữ liệu thật. Chưa kiểm chứng đăng nhập từ tài khoản ChatGPT/Claude/Gemini thật; SDK client không thay thế bước đó. Gemini/account workspace có giới hạn từ phía nhà cung cấp. Quick Tunnel URL tạm và không hỗ trợ SSE; dùng JSON Streamable HTTP.
