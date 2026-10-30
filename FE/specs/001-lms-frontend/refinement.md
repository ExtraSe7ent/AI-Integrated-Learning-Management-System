# Điều chỉnh giao diện theo phản hồi

- Địa chỉ gốc mở trang đăng nhập; hai vai trò có phong cách điều hướng riêng, vẫn dùng thương hiệu đỏ/trắng/be.
- Chuông mở panel tại chỗ, có đánh dấu đã đọc, đóng bằng Escape hoặc click ngoài.
- Bỏ nhãn demo/trải nghiệm/frontend và thông tin triển khai khỏi giao diện; giới hạn tích hợp giữ trong tài liệu.
- Tiêu đề môn học canh trên cùng, tối đa hai dòng và dấu ba chấm.
- Đầu trang chỉ hiện mục hiện tại; bấm để mở danh sách điều hướng nhanh.
- Mobile tự đóng drawer và menu tài khoản sau mọi lựa chọn, kể cả mục hiện tại/hồ sơ.
- Kiểm chứng: tests/navigation.spec.ts, toàn bộ regression, build, ảnh desktop/mobile và đồng bộ native Figma.

Hoàn tất: 6 kiểm thử mới đạt; toàn bộ 14 E2E, 8 unit và build đạt. Các khung cũ giữ nguyên ID; bổ sung ba khung trạng thái/đăng nhập giảng viên. Không triển khai backend hoặc xác thực trong lần sửa giao diện này.
