# AI Integrated Learning Management System

Hệ thống lớp học online theo mô hình LMS/lớp học đảo ngược, định hướng tích hợp AI.

## Cấu trúc

- [FE](FE/README.md): React + TypeScript + Vite; source, tài nguyên giao diện, kiểm thử và tài liệu frontend.
- [SRS_Checklist_Flipped_Classroom.xlsx](SRS_Checklist_Flipped_Classroom.xlsx): danh sách yêu cầu theo vai trò.
- [Logo](Logo/): logo gốc; bản dùng trong ứng dụng nằm trong `FE/public/brand/`.

Frontend hiện có Sinh viên, Giảng viên, Trưởng khoa và Trưởng nhóm HP. Dữ liệu được mô phỏng và lưu trên trình duyệt; backend Java chưa được triển khai trong repository này.

## Chạy frontend

Cài Node.js 24, mở terminal tại thư mục repository rồi chạy:

```sh
cd FE
npm ci
npm run dev
```

Mở [http://127.0.0.1:5173](http://127.0.0.1:5173).

Tài khoản kiểm thử: `23110149` (Sinh viên), `GV001` (Giảng viên), `TK001` (Trưởng khoa), `TN001` (Trưởng nhóm HP). Mật khẩu chung: `12345678`. Đây là tài khoản fixture, không phải tài khoản thật.

```sh
npm test
npm run build
```

Xem [hướng dẫn FE](FE/README.md) và [giới hạn tích hợp](FE/docs/limitations.md) trước khi phát triển tiếp. Hướng dẫn E2E nằm trong README của FE.

## Thiết kế

- [File Figma](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8)
- [Hệ thống thiết kế](FE/DESIGN.md)
- [Đối chiếu yêu cầu](FE/docs/requirements.md)

`node_modules`, bản build, cache và kết quả kiểm thử được bỏ qua bởi `.gitignore`. Giữ `FE/package-lock.json` để các thành viên cài cùng phiên bản thư viện bằng `npm ci`.
