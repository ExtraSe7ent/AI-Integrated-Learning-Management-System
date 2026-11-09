# VJU LMS MCP — demo dùng chung cho ứng dụng AI

Dịch vụ trong `Moi/MCP`, gọi API của BE hiện tại, không sửa nghiệp vụ BE hoặc source FE. Chưa cần Vercel. Máy chạy server + tunnel phải bật trong suốt buổi demo.

## Bắt đầu ngay

Mở Terminal, chạy từng dòng:

```sh
cd /Users/quanganh/Documents/Study/Nam4/Ky1/Phat_trien_ung_dung_nang_cao/Moi/MCP
export PATH=/Users/quanganh/.nvm/versions/node/v24.22.0/bin:$PATH
npm run demo
```

Nếu phiên demo do agent khởi chạy đang còn bật, dùng luôn URL trong `.runtime/public.json`; không khởi chạy thêm vì sẽ trùng cổng. Node Homebrew trên máy hiện lỗi llhttp nên ví dụ dùng Node nvm. Cần Node ≥22, Java có thể chạy target21, BE jar đã build và FE/node_modules. Chạy lại `npm ci --ignore-scripts` trong MCP khi cần phục hồi dependency từ lockfile.

Launcher thực hiện:

1. BE riêng tại `127.0.0.1:18081`, H2 **RAM**, dữ liệu giả của project. Không dùng `BE/data`, không reset DB đang dùng, không gọi model hoặc SMTP.
2. Dùng lại mật khẩu mẫu `12345678` cho các tài khoản của phiên demo, lưu tại `.runtime/demo-private.json`, quyền file 600. Đăng nhập MCP bằng **GV001**; mọi giảng viên/Trưởng nhóm học phần hợp lệ được bật trong phiên demo.
3. Dùng cloudflared tạo URL HTTPS tạm cho MCP/OAuth ở `127.0.0.1:19090`. Chỉ các endpoint MCP/cấp quyền được public; không proxy BE API ra tunnel.
4. Chạy FE tại `http://127.0.0.1:15174`, trỏ đến cùng BE demo. Dùng GV001 và mật khẩu trong file riêng để xem nội dung do agent tạo.
5. In MCP URL và đường dẫn trang thu hồi kết nối; ghi URL không chứa bí mật vào `.runtime/public.json`.

**Tài khoản giảng viên demo: `GV001` / `12345678`.** Chỉ nhập nó vào trang đăng nhập LMS hoặc cấu hình xác thực phù hợp, không dán vào chat. Không commit/chia sẻ `.runtime`.

Ctrl+C ở terminal launcher dừng các dịch vụ con do launcher tạo. Dữ liệu H2, mã OAuth, client đăng ký, quyền đã cấp và lịch sử chống tạo trùng đều mất khi restart. Tạo kết nối lại trong ứng dụng AI, dùng URL mới được in. Tài khoản mẫu giữ nguyên `GV001` / `12345678`. Đây là giới hạn có chủ đích của demo RAM, chưa phải lưu trữ production.

Binary cloudflared hiện ở `.runtime/cloudflared`, tải từ release chính thức cho **macOS Intel**. Nếu chuyển máy hoặc folder không kèm runtime, cài cloudflared từ [Cloudflare](https://developers.cloudflare.com/tunnel/downloads/) và đặt `CLOUDFLARED_BIN` là đường dẫn tuyệt đối tới binary. Không cần cài lại binary mỗi lần chạy. Quick Tunnel là dịch vụ thử nghiệm; nếu không truy cập được, xem `.runtime/tunnel.log`. Không coi URL tạm là hostname production.

## Kết nối Claude trước

1. Mở Claude → Customize → Connectors → Add custom connector (tên menu có thể khác theo phiên bản).
2. Tên `VJU LMS`, URL là **toàn bộ MCP URL kết thúc bằng `/mcp`** trong terminal.
3. Chọn xác thực đăng nhập/OAuth. Ở lựa chọn OAuth client, dùng **Register automatically** vì bản demo hỗ trợ Dynamic Client Registration, chưa hỗ trợ published identity/CIMD.
4. Connect → trang LMS xuất hiện. Kiểm tra hostname đúng URL demo, đăng nhập GV001 với mật khẩu riêng, chọn quyền đọc và tạo nháp.
5. Trong chat bật connector, rồi thử prompt bên dưới. Không chọn “No sign in”.

[Tài liệu Claude](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp).

## Kết nối ChatGPT

Trong giao diện có quyền tạo custom MCP: Plugins → thêm custom MCP server (hoặc luồng Apps/Create ở giao diện cũ). Nhập MCP URL public và chọn OAuth. Dùng tự đăng ký client nếu UI hỗ trợ; hoàn tất đăng nhập LMS rồi chọn plugin trong chat. Nếu có ô scopes, điền `lms:read lms:draft`; tool cũng khai báo scope và challenge nâng quyền khi cần.

Nếu UI yêu cầu client ID/secret, lấy **đúng redirect URI được UI/tài liệu client cung cấp**, chạy từ thư mục MCP:

```sh
node register-client.mjs ChatGPT https://DIA-CHI-CALLBACK-CHINH-XAC
```

Đọc `.runtime/oauth-client-private.json` và chỉ điền `client_id`/`client_secret` vào ô OAuth tương ứng. Placeholder trên không phải callback dùng thật. Client hỗ trợ `client_secret_post` hoặc public client `none`; PKCE S256 bắt buộc. Không điền tài khoản/mật khẩu giảng viên vào ô client secret.

Quyền thêm custom MCP phụ thuộc tài khoản/workspace. Nếu không có nút thêm, đó chưa phải bằng chứng server lỗi. Chưa đăng nhập hoặc kiểm chứng bằng tài khoản ChatGPT của người dùng trong đợt này. [Hướng dẫn kết nối chính thức](https://developers.openai.com/plugins/deploy/connect-chatgpt), [OAuth](https://developers.openai.com/plugins/build/auth).

## Kết nối Gemini

Khi tài khoản có tính năng: Gemini web → Settings → Connected Apps → Custom apps → nhập MCP URL → Next → đăng nhập/cấp quyền. Server có DCR nên thường không cần tự điền client credentials.

Tài liệu Google hiện ghi custom apps yêu cầu tài khoản cá nhân, đủ 18 tuổi và ở Mỹ, cùng các điều kiện khác. Tài khoản ở Việt Nam hoặc tài khoản trường có thể chưa dùng được. Không đổi server để vượt điều kiện tài khoản; vẫn có thể kiểm thử chuẩn MCP bằng SDK client. [Điều kiện và thao tác chính thức](https://support.google.com/gemini/answer/17209137).

## Prompt demo

> Dùng VJU LMS xem các lớp tôi phụ trách. Hỏi lại tôi nếu có nhiều lớp phù hợp. Trong lớp tôi chọn, tạo bài giảng nháp “REST API cơ bản” gồm 3 trang nội dung và 5 câu hỏi trắc nghiệm bốn lựa chọn, mỗi câu có đáp án và giải thích. Giữ bản nháp để tôi duyệt trên web. Dùng requestKey ổn định cho từng thao tác, không tạo lại khi chỉ bị timeout.

Sau đó có thể yêu cầu tạo bài tập nháp 30 phút với tổng điểm 10. Thời gian mở/đóng dạng `YYYY-MM-DDTHH:mm:ss`, theo múi giờ BE; xác nhận giờ với giảng viên trước khi tạo.

FE demo → Giảng viên → Bài học/Bài tập: mở nội dung mới, duyệt câu hỏi và công bố bằng luồng web hiện có. Agent đợt này **chỉ tạo nháp**; chưa có upload PDF/video, sửa/xóa/công bố nội dung, chấm điểm, đọc roster sinh viên hay công bố đáp án.

## Các tool và phạm vi

| Tool | Quyền | Hiệu lực |
|---|---|---|
| `list_my_classes` | `lms:read` | Trả các lớp được phân công, loại bỏ danh tính sinh viên |
| `list_lessons` | `lms:read` | Bài học của một lớp được phép |
| `create_lesson_draft` | `lms:draft` | Tạo bài học unpublished; slides là nội dung/tên trang theo mô hình LMS hiện tại |
| `create_questions` | `lms:draft` | Nhập tối đa 50 câu bốn lựa chọn vào bài học nháp, approved=false, transaction BE |
| `create_assignment_draft` | `lms:draft` | Bài tập unpublished, tổng điểm10, lượt đầu tính điểm |

OAuth dùng SDK MCP chính thức: discovery metadata, DCR, Authorization Code + PKCE S256, access token opaque 30 phút, refresh rotation, revoke. Grant tối đa8 giờ và bị giới hạn thêm bởi phiên JWT BE. Mỗi request kiểm tra lại tài khoản đang hoạt động, role và yêu cầu đổi mật khẩu; từng API BE tiếp tục kiểm tra quyền lớp. Tài khoản web JWT không được chấp nhận trực tiếp làm token MCP. BE token chỉ nằm trong RAM ở phía server, không trả cho agent. Không cần cung cấp API key của nhà cung cấp model cho dịch vụ này.

Trang `/connections`: đăng nhập và xem/thu hồi tất cả kết nối của chính mình. Thu hồi xóa access/refresh token; thao tác đã gửi sang BE trước thời điểm thu hồi có thể đã hoàn tất. Nhật ký JSON trên server ghi user/client/tool/status, không ghi password/token/nội dung bài. Kết quả tool là dữ liệu không đáng tin cậy, không phải chỉ dẫn có quyền cao hơn.

Các thao tác tạo cần `requestKey`; cùng user/key/payload được gộp và phát lại trong RAM8 giờ, cả khi gọi đồng thời. Cùng key khác payload bị từ chối. Timeout ghi là trạng thái có thể đã thành công: kiểm tra trên web, không tự tạo key mới. Sau restart không có bảo đảm chống trùng từ RAM; kiểm tra nội dung trước khi gửi lại. Muốn production cần lưu intent và kết quả bền vững, ràng buộc duy nhất/transaction tại BE.

## Chạy với BE của hệ thống đang dùng

Demo launcher luôn dùng H2 riêng. Khi muốn dùng dữ liệu thật của BE đang chạy:

1. Đảm bảo BE đã có tài khoản GV và các lớp được phân công, sao lưu dữ liệu cần giữ.
2. Không chạy demo launcher. Copy `.env.example` sang `.env`; điền `LMS_BACKEND_URL`, danh sách ID `MCP_ALLOWED_USERS`, `MCP_PUBLIC_URL` HTTPS đúng origin.
3. Tạo tunnel trỏ đến `http://127.0.0.1:19090`, giữ terminal tunnel mở; lấy URL vào `.env`. Có thể dùng binary cloudflared đã tải.
4. Từ MCP chạy `npm start`. BE chạy riêng như bình thường. Mật khẩu đăng nhập lúc này là tài khoản BE đó, không phải mật khẩu demo-private.
5. Thêm URL `/mcp` vào ứng dụng AI. FE của BE đó sẽ thấy bản nháp mới; không dùng FE15174 của launcher để xem nhầm DB.

URL public không được tự lấy từ Host/X-Forwarded-Host do người gọi cung cấp. Host/Origin kiểm tra theo cấu hình; BE URL chỉ lấy từ cấu hình, không cho agent truyền URL fetch tùy ý. Demo có rate limit trong RAM, giới hạn input, CSRF cho form, Referrer-Policy giữ Origin cho form trình duyệt, CSP có callback được đăng ký, cookie HttpOnly và Secure khi HTTPS. Chỉ bind loopback; không tự mở cổng router hay sửa cấu hình hệ thống toàn cục.

## Kiểm thử và giới hạn

```sh
npm test
npm audit --omit=dev
# Khi npm run demo đang chạy, terminal khác:
node smoke-demo.mjs
node test-browser-demo.mjs
```

`smoke-demo.mjs` chỉ dùng runtime demo của launcher: OAuth qua HTTPS, SDK client, đọc lớp, tạo nháp, retry, lớp khác có thật bị chặn, dữ liệu về bootstrap và revoke. `test-browser-demo.mjs` dùng Brave trên macOS để kiểm tra trang cấp quyền/thu hồi và FE. Các script không gọi model AI. Bằng chứng tổng hợp trong `verification/`.

Cloudflare Quick Tunnel không hỗ trợ SSE; MCP này dùng stateless Streamable HTTP với JSON response, GET trả405. SDK client đã kiểm thử. Client yêu cầu SSE riêng có thể không tương thích; không quảng cáo hỗ trợ transport SSE cũ. [Giới hạn Quick Tunnel](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

Chưa chứng nhận production: chưa lưu grant/idempotency/audit bền vững, chưa triển khai CIMD/published identity, chưa test tải hoặc tất cả client/version, chưa vận hành nhiều instance. Không nhận định việc SDK client kết nối thành công đồng nghĩa tài khoản ChatGPT/Claude/Gemini thật đã kết nối. Khi chọn DB chính thức và hostname cố định, cần thay lưu RAM và kiểm tra vận hành trước khi dùng với dữ liệu thật.

## Giảng viên lấy link ngay trong LMS

Mở **Tài khoản → Kết nối agent AI** (hoặc Hồ sơ cá nhân → Kết nối agent AI). Trang lấy URL hiện hành từ MCP qua BE, có Sao chép link, hướng dẫn Claude/ChatGPT/Gemini, danh sách quyền của chính tài khoản và thu hồi từng kết nối/tất cả. Khi MCP tắt hoặc không phản hồi, không hiển thị link cũ. Khi chỉ chạy nội bộ, hướng dẫn người quản trị bật HTTPS, không tạo link public giả.

BE gọi các endpoint quản lý nội bộ của MCP bằng service key riêng và JWT của người đang đăng nhập. MCP xác minh lại danh tính từ BE; không tin userId do FE gửi. Key không được trả về FE. Với BE chạy riêng, đặt `LMS_MCP_INTERNAL_URL=http://127.0.0.1:19090` và `LMS_MCP_INTERNAL_KEY` cùng giá trị bí mật ≥32 ký tự với `MCP_INTERNAL_KEY` của Node MCP. Launcher demo tự cấu hình cặp key này. `MCP_ALLOWED_USERS=*` bật cho mọi giảng viên/Trưởng nhóm học phần hợp lệ, quyền lớp vẫn do BE kiểm tra; có thể giới hạn lại bằng danh sách ID.

Kiểm thử giao diện mới: chạy stack local với `MCP_PUBLIC_URL=https://mcp.example.test npm run demo:local`, sau đó `node test-web-connections.mjs`. Đây là hostname cấu hình QA, không mở tunnel và không phải link thật để đưa vào ứng dụng AI. Không chia sẻ URL example.test trong buổi demo. Dừng stack sau kiểm thử; để có link thật, lần chạy `npm run demo` sẽ tạo URL tunnel hiện hành.

## Công bố theo yêu cầu giảng viên

Bổ sung `publish_lesson` và `publish_assignment` (tổng7 tool), scope riêng `lms:publish`. Kết nối cũ chỉ có read/draft không tự được quyền này: khởi động lại MCP, cập nhật danh sách tool trong ứng dụng AI và kết nối/cấp quyền lại với scope bổ sung. Nếu có ô scopes, dùng `lms:read lms:draft lms:publish`.

Ví dụ: “Công bố bài giảng REST API vừa tạo cho lớp CSE301.01” hoặc “Công bố bài tập đã kiểm tra, giữ nguyên thời gian mở/đóng”. Agent phải xác định đúng ID/tên/lớp và yêu cầu rõ ràng từ giảng viên; tool yêu cầu confirmed=true. Tham số này ghi nhận ý định cho client, không phải bằng chứng độc lập rằng con người đã bấm xác nhận; kiểm soát cưỡng chế là scope OAuth và quyền/điều kiện công bố BE. Tool công bố được đánh dấu thao tác cần thận trọng để client có thể hỏi xác nhận.

Tool chỉ gửi published=true qua API BE, không sửa đề, giờ, điểm hoặc công bố đáp án. Câu hỏi chưa duyệt làm BE từ chối công bố bài giảng; giảng viên cần duyệt trên web rồi yêu cầu lại với requestKey mới. Bài đã công bố trả trạng thái hiện tại; retry cùng intent không tạo lần ghi khác.

Kiểm chứng bản bổ sung:18 test MCP qua (scope thiếu, confirmed=false, đúng quyền, retry, lớp khác, điều kiện BE từ chối, cả hai loại nội dung); FE build qua. Chưa thử lệnh công bố bằng tài khoản AI thật của người dùng trong lần này. Host đang chạy không tự nạp source mới; cần restart rồi refresh tool/cấp quyền lại.
