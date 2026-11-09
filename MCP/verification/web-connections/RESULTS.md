# Kết nối agent ngay trên LMS — 07/11/2026

Luồng: **Giảng viên → Tài khoản → Kết nối agent AI**. Có đường dẫn từ Hồ sơ cá nhân; Trưởng nhóm học phần cũng có mục tương ứng. Sinh viên/Admin không được gọi API quản lý này.

- FE lấy link hiện hành từ BE, sao chép link, hướng dẫn Claude/ChatGPT/Gemini và nêu giới hạn tài khoản của nhà cung cấp.
- BE gọi MCP qua bridge loopback với service key riêng và JWT của người đang đăng nhập. MCP xác thực lại qua BE, lọc grant theo userId thực. Không nhận userId từ FE để thay đổi chủ sở hữu.
- Xem ứng dụng đã cấp quyền, scope và thời hạn; thu hồi từng kết nối hoặc tất cả, có xác nhận/Hủy, giữ nguyên khi thao tác thất bại. Thu hồi vô hiệu access/refresh của đúng người.
- Khi MCP tắt/chưa bật/chỉ chạy local, giao diện không bịa link public. Network error có thử lại; không hiển thị URL cũ khi làm mới lỗi.
- Launcher truyền service key ngẫu nhiên riêng giữa BE và Node MCP, tự lấy URL mới từ tunnel. Không đổi mật khẩu mẫu: GV001 / 12345678. Wildcard allowlist chỉ áp dụng giảng viên/Trưởng nhóm học phần hợp lệ; quyền lớp vẫn do BE quyết định.

## Kiểm chứng

BE: **266 test**, verify/package/coverage qua; line97.33%, branch83.55%, không hạ ngưỡng80/80. FE: **48 test**, TypeScript/Vite build qua, còn cảnh báo chunk lớn có từ trước. MCP: **15 test** qua, bao gồm key/JWT bridge và grant người khác. Browser: **7 ca** qua, kết nối/revoke dựa trên BE/MCP thật; các trạng thái lỗi UI dùng response mock được ghi rõ trong results.json.

QA chỉ dùng loopback và dữ liệu tạm. `https://mcp.example.test/mcp` là cấu hình kiểm thử, không phải link host thật. Không dùng tài khoản AI của người dùng, không gọi model/SMTP, không mở tunnel public trong lần QA này. Sau kiểm thử đã dừng các dịch vụ. Dữ liệu OAuth/grant/intent vẫn lưu RAM theo thiết kế demo, chưa có lưu trữ production.

## Figma

Ba frame chỉnh sửa được, tái sử dụng shell giảng viên và font hiện có:

- [Trang kết nối](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8/Untitled?node-id=170-2468)
- [Dịch vụ không khả dụng](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8/Untitled?node-id=172-2566)
- [Xác nhận thu hồi](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8/Untitled?node-id=172-2782)

Ảnh render và log nằm cùng thư mục. Node IDs dùng để tìm frame; URL trong thiết kế là placeholder example.test.

## Cấu hình khi chạy thực tế

Xem `Moi/MCP/README.md`, mục “Giảng viên lấy link ngay trong LMS”. Khi chạy launcher demo, hai phía tự cấu hình bridge. Khi chạy BE/MCP riêng, cấu hình cùng service key bí mật và internal URL loopback. Khi chưa cấu hình, trang hiển thị chưa bật dịch vụ thay vì trả link giả.
