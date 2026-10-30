# Kế hoạch triển khai

identity → account-import → course-class → ai-assistance → reminders → full-audit.

- Thiết kế native Admin/AI theo Campus agenda, tái sử dụng Button/logo/token trong Figma.
- State Admin trong DemoProvider; AccountProvider đọc registry này cho đăng nhập/active/role/password local. Source nghiệp vụ thuần tách khỏi UI.
- Mỗi increment có kiểm tra nghiệp vụ; chốt TypeScript/Vite, unit, E2E toàn bộ và ảnh desktop/mobile runtime.
- Đối chiếu Excel từng ID, phân biệt FE có UI/FE mô phỏng/cần backend/chưa đạt. Không sửa workbook gốc.
