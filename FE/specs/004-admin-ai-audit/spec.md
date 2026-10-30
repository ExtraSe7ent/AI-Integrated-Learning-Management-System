# Admin, AI và rà soát toàn bộ FE

Ngày: 2026-10-30. Phạm vi đã được người dùng xác nhận: FE trước, theo Excel; giữ nhận diện hiện có, desktop Figma; không dịch vụ Java/AI/email thật.

## Nguồn và mục tiêu
`../SRS_Checklist_Flipped_Classroom.xlsx`: AD-01–AD-10, AI-01–AI-07; rà soát SV-01–SV-65, GV-01–GV-44, TK-01–TK-04, TN-01–TN-08 và NFR. Không lấy cột hiện trạng Django cũ làm yêu cầu công nghệ.

## Các luồng độc lập
1. P1 Tài khoản: Admin đăng nhập, import SV/GV từ XLSX có file mẫu/xem trước/lỗi từng dòng/không commit dòng lỗi; gán vai trò, reset, vô hiệu hóa không xóa dữ liệu; trạng thái có hiệu lực ở đăng nhập FE. Tài khoản mới/reset phải đổi mật khẩu.
2. P1 Học phần/lớp: tạo/sửa mã, tên, khoa; lớp gồm tên/học kỳ/năm/đợt, gán GV/Trưởng nhóm HP hợp lệ; import danh sách SV chỉ nhận tài khoản SV đang hoạt động, không lặp danh sách.
3. P1 AI: hỏi đáp theo học liệu có nguồn bấm được, không gắn trích dẫn giả khi không có học liệu/phạm vi ngoài bài; luyện tập theo phạm vi slide có đáp án/giải thích và tạo bộ mới; chấm nháp/giải thích chờ GV duyệt; phân tích vùng yếu từ dữ liệu FE.
4. P2 Nhắc hạn: xem mục sẽ đến hạn trong 24h, xem email cá nhân hóa, chạy mô phỏng, nhật ký có event key chống trùng, thông báo cho SV; không hiển thị như email đã gửi thật.
5. Rà soát: tái hiện và sửa lỗi FE hiện hữu, bổ sung UX có thể thực hiện cục bộ; ghi riêng mọi yêu cầu cần BE hoặc chưa được kiểm chứng.

## Chấp nhận và biên
- Native editable Figma trước UI mới; không khung ảnh chụp thay UI.
- Source riêng `src/Admin`, `src/AI`, dùng shared primitives và token. Không cài thêm thư viện nếu ExcelJS/Playwright đã có.
- Unit kiểm tra import/khóa tài khoản/quan hệ lớp/AI nguồn và deadline chống trùng; E2E qua UI, có lỗi/rỗng/khôi phục/tải lại/role guard.
- LocalStorage chỉ phục vụ FE; không coi guard/credential local là bảo mật máy chủ.
- Không thay đổi bản GitHub `AI-Integrated-Learning-Management-System` hoặc mang cấu hình skill vào đó.
