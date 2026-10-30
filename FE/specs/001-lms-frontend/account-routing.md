# Điều hướng theo tài khoản

- Một trang đăng nhập chung với mã tài khoản và mật khẩu; không chọn hoặc suy đoán vai trò từ giao diện/prefix.
- Vai trò nằm trong kết quả tài khoản. Hiện hai tài khoản giả lập có role được gán sẵn; chưa có backend.
- Không có menu đổi vai trò. Menu tài khoản gồm hồ sơ, đổi mật khẩu và đăng xuất.
- Trang thuộc role khác chuyển về không gian của tài khoản hiện tại; chưa đăng nhập chuyển về đăng nhập. Đăng xuất xóa lựa chọn tài khoản của phiên trình duyệt.
- Không lưu mật khẩu, token hoặc giả lập thêm các role chưa có màn hình.
- Thay câu giới thiệu đăng nhập bằng ngôn ngữ trực tiếp, giữ thương hiệu và bố cục.
- Kiểm chứng bằng unit về ánh xạ tài khoản và lỗi, browser về login/logout/route, build và native Figma.

Hoàn tất: build đạt, 11/11 unit và 16/16 browser test đạt (gồm đăng nhập từng tài khoản, chặn URL khác role, khôi phục qua reload, lỗi mật khẩu và đăng xuất). Figma dùng chung một màn đăng nhập, xóa biến thể đăng nhập theo role cũ.
