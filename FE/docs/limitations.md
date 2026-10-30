# Giới hạn của frontend · 30/10/2026

Bản hiện tại dùng để trình diễn và kiểm tra luồng FE cục bộ. [Matrix 146 yêu cầu](requirements.md) phân biệt phần hoạt động, mô phỏng, Partial FE và chưa kiểm chứng; [audit](audit-2026-10-30.md) ghi các lỗi đã sửa. Chưa xác nhận toàn bộ SRS hoặc production.

## Backend và tài khoản

Không có Java backend, API, cơ sở dữ liệu hay xác thực/phân quyền máy chủ. Năm tài khoản mẫu là `23110149`, `GV001`, `TK001`, `TN001`, `AD001`, mật khẩu khởi tạo `12345678`. Registry Admin điều khiển tài khoản active, role, hash mật khẩu demo và `mustChange`; import/reset bắt buộc đổi mật khẩu trước vào workspace. Đổi mật khẩu có lưu và tác dụng cục bộ. `sessionStorage` chỉ giữ ID phiên; đây không phải cơ chế bảo mật production. Quên mật khẩu hướng dẫn liên hệ Admin, không gửi OTP/email.

## Admin và tích hợp giữa vai trò

AD-01–AD-06 có thao tác registry thật trong trình duyệt: import XLSX/preview lỗi, gán role cho giảng viên, reset và vô hiệu hóa giữ dữ liệu. Import chỉ ghi khi mọi dòng hợp lệ và được kiểm lại tại thời điểm ghi. Giới hạn parser là 5MB/5000 dòng; preview rất lớn có thể nặng vì chưa phân trang.

**AD-07–AD-10 còn khoảng trống tích hợp FE:** CRUD học phần/lớp, phân công GV/Trưởng nhóm HP và ghi danh đã hoạt động trong Admin registry, nhưng các workspace cũ còn dùng danh mục/phạm vi/roster fixture. Tạo lớp, đổi phân công hoặc nhập SV chưa tự xuất hiện xuyên suốt trong mọi vai trò. Cần nối các nguồn FE này với nhau; không được ghi phần còn thiếu này là “chỉ cần backend”.

Tài khoản import đăng nhập/đổi mật khẩu được, nhưng học tập, hồ sơ, chat, tiến độ, roster và dữ liệu lớp chưa indexed đầy đủ theo từng account/class mới. Chuyển tài khoản cũ trong cùng hồ sơ trình duyệt vẫn dùng dữ liệu học tập demo chung. Không dùng dữ liệu cá nhân hoặc mật khẩu thật.

## Dữ liệu và đồng bộ

Khóa `vju-learning-demo-v1` trong `localStorage` lưu trạng thái; tab cùng origin/hồ sơ nhận `storage` event. Không đồng bộ khác thiết bị/trình duyệt/origin, không xử lý xung đột nhiều người dùng hoặc lưu server. Khi localStorage đầy, thay đổi có thể chỉ còn trong phiên với thông báo lỗi. Ảnh phản hồi PNG/JPEG/WebP/GIF được lưu bằng IndexedDB và xem lại cục bộ; giới hạn 5 ảnh/tổng 5MB, không upload máy chủ. Xóa localStorage không đồng nghĩa xóa dữ liệu ảnh IndexedDB.

Điểm hiện tổng hợp từ các phiên/bài đã công bố qua helper chung; nhiều tên, lớp và thống kê vẫn là mẫu. Nội dung học các phiên còn chung phạm vi bài RESTful API/CSE301. Thêm bài/phiên không tạo ra dữ liệu sản xuất theo từng lớp/người học.

## Trưởng khoa và phạm vi dữ liệu

Roster khởi tạo có 3 học phần/4 lớp, 12 SV không trùng và 23 lượt ghi danh. Mốc khởi tạo 67% là trung bình theo lượt học; tiến độ/điểm động có thể làm thay đổi số này. Học kỳ II rỗng. Bộ đếm phân biệt dòng SV–lớp với số SV cần hỗ trợ. Các thẻ giảng viên cũ còn sĩ số mẫu 110/36/42/32, không phải tổng roster đại diện Trưởng khoa.

Dòng `sv1` ở CSE301.01 lấy summary học tập động; các roster khác còn mẫu. Ngưỡng `<50%` tiến độ hoặc `<5` điểm là giả định fixture, không phải chính sách trường. Danh mục khoa/lớp chưa nối đầy đủ Admin registry. Hồ sơ `deanProfile` và cờ đọc `readDeanNotices` là trường riêng trong cùng kho cục bộ; chưa có inbox sự kiện hoặc quyền dữ liệu máy chủ.

## Trưởng nhóm HP và điều phối học liệu

Kho `coordination` khởi tạo hai học phần (`cs301`, `cs204`), ba lớp và chín học liệu. M0 Chưa rà soát, M1 Đang xử lý, M2 Cần điều chỉnh, M3 Đạt chuẩn là định nghĩa quy trình đã chốt cho bản này; workbook không quy định sẵn các mức đó.

TN001 và panel GV001 trên `/giang-vien/bai-hoc` dùng cùng bản ghi điều phối: yêu cầu → M2; GV sửa/trả lời → M1; TN duyệt M3 đóng yêu cầu. Yêu cầu chưa trả lời chặn M3; follow-up lại mở yêu cầu. Hoàn thành lớp cần đủ ba loại học liệu, mọi mục M3, không yêu cầu mở; sửa/rà soát/yêu cầu làm mất dấu hoàn thành. Đây là kiểm tra scope/quyền local, không có audit log bất biến hay khóa xung đột máy chủ.

Kho này chưa hợp nhất với Lesson/Question/Assignment cũ, nên sửa điều phối chưa đổi slide SV/ngân hàng câu hỏi/đề/điểm. TN-08 mới có editor nội dung chữ và URL tham chiếu, chưa có structured quiz/assignment editor hoặc nhập PDF/PPT tương đương GV. `editable` kiểm ở UI/model, ví dụ `api2-slides` chỉ đọc. Hồ sơ/chuông riêng vẫn local. Mười khung Figma cũ chưa mô tả mọi nhánh hoặc panel trả lời mới của GV.

## AI và học liệu

Không gọi model/RAG hoặc suy luận đa lượt thật. Trợ lý dùng luật/từ khóa và nguồn mẫu, có fallback ngoài phạm vi, disclaimer và rating/report lưu cục bộ. Khi metadata không còn khớp, nguồn mới và link nguồn lịch sử bị ẩn để tránh trích dẫn sai; điều này không thay thế grounding thật.

Luyện tập lọc ngân hàng mẫu theo phạm vi, đổi vòng, kiểm từng câu, giải thích/nguồn/tổng kết và không ghi điểm. Không sinh câu mới bằng model. Chấm nháp tự luận đọc nội dung theo tiêu chí mẫu; giảng viên quyết định điểm cuối. Insights tính câu sai/kiến thức mờ từ state demo, chưa phân tích dữ liệu toàn trường.

Slide SV là nội dung HTML minh họa; rail số/tên không phải thumbnail PDF. Soạn bài lưu metadata trang/video theo bài và preview PDF qua object URL; không trích xuất, chỉnh sửa PDF gốc hoặc giữ file PDF mới sau reload. Thay metadata không tạo nội dung trang mới đầy đủ cho reader. Video YouTube là link, chưa player nhúng. Tài liệu tham khảo chưa đủ upload/sửa/sắp xếp.

## Bài tập, điểm và phúc khảo

Đề mới vẫn theo ba câu mẫu điểm 4/3/3; chưa tùy chỉnh cấu trúc/số câu/điểm, import đề đầy đủ hoặc ngẫu nhiên hóa thực. Import ngân hàng XLSX/CSV khác import một đề; export là XLSX, parser CSV chưa bao phủ mọi biến thể nhiều dòng.

TN/điền chấm bằng đáp án, tự luận cần GV duyệt. Điểm/phúc khảo đã lưu theo câu và snapshot, cộng lại tổng/summary; pending chặn attempt mới và duyệt tự luận giữ điểm đã phúc khảo. Feedback AI cá nhân và tỷ lệ đúng đầy đủ vẫn còn Partial. Bảng điểm chưa tách Họ đệm/Tên; dashboard chưa đủ mọi field thời gian nộp/% đúng/quiz live.

## Phiên trực tiếp, nhắc hạn và thời gian

Poll đồng bộ tab cùng origin với mã mẫu `261016`; mã/QR không cung cấp realtime khác thiết bị. QR localhost không đưa máy khác vào kho dữ liệu giảng viên. Đếm đã trả lời/timeout dựa participant local; không đảm bảo xử lý khi mọi tab đóng. Mất mạng chỉ có UI/local state, chưa reconnect máy chủ.

Timer/deadline dựa đồng hồ trình duyệt. Bài tập tự nộp khi tab chạy hoặc mở lại draft hết hạn. Phiên tự học suy trạng thái theo thời gian khi render, chưa bảo đảm re-render đúng ranh giờ. Nhắc hạn quét theo thời điểm chọn, chỉ scope CSE301.01 và SV demo; ghi notice/nhật ký chống trùng cục bộ. Email là preview ghi rõ chưa gửi; không có scheduler hoặc email thật.

## Kiểm chứng giao diện và phi chức năng

E2E/ảnh xác nhận các route và trạng thái mẫu ở viewport giả lập 1440/390px, thêm ảnh Admin/AI 800px. Không phải kiểm mọi thiết bị, trình duyệt, trạng thái, screen reader hoặc chứng nhận WCAG; metadata cũ nhỏ vẫn cần rà khả năng đọc/zoom. Chưa đo NFR-02 ≤2 giây. Không có load test 500 người, SLA AI ≤30 giây, uptime 99,5% hoặc HTTPS/mã hóa production.

Figma có 67 khung desktop native, gồm 13 Admin/AI mới; không tạo lại mobile Figma. Khung thiết kế là trạng thái đại diện, runtime kế thừa chrome hiện có và thích ứng responsive; không tuyên bố mọi pixel/nhánh trùng Figma.
