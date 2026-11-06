# AI Integrated Learning Management System

Frontend hệ thống quản lý học tập theo mô hình lớp học đảo ngược, xây dựng bằng React, TypeScript và Vite.

## Chạy ứng dụng

Sử dụng Node.js 24 và npm. Từ thư mục gốc repository:

```sh
cd FE
npm ci
npm run dev
```

Mở http://127.0.0.1:5173.

## Tài khoản mẫu

| Vai trò | Tài khoản |
| --- | --- |
| Sinh viên | `23110149` |
| Giảng viên | `GV001` |
| Trưởng khoa | `TK001` |
| Trưởng nhóm học phần | `TN001` |
| Admin | `AD001` |

Mật khẩu khởi tạo chung: `12345678`. Đây là tài khoản minh họa, không dùng mật khẩu hoặc dữ liệu cá nhân thật.

## Chức năng

- Sinh viên: học bài, tự học, làm bài tập, luyện tập và xem điểm.
- Giảng viên: quản lý học liệu, câu hỏi, phiên học, bài tập và chấm bài.
- Trưởng khoa: theo dõi học phần, lớp và cảnh báo học tập.
- Trưởng nhóm học phần: rà soát học liệu, so sánh lớp và gửi yêu cầu điều chỉnh.
- Admin: quản lý tài khoản, import Excel, học phần, lớp và ghi danh.
- AI: giao diện trợ lý, luyện tập, chấm nháp, phân tích và nhắc hạn mô phỏng.

## Kiểm tra và build

Chạy trong thư mục `FE/`:

```sh
npm test
npm run build
npm run preview
```

`npm test` chạy unit test trong `src/`. Bản build được tạo tại `FE/dist/`; lệnh preview mở tại http://127.0.0.1:4173. Khi triển khai trên máy chủ tĩnh, cấu hình chuyển các route của ứng dụng về `index.html` để hỗ trợ tải lại trang.

## Cấu trúc repository

```text
FE/
  public/             Logo, SVG và tài liệu mẫu dùng trong giao diện
  src/                Mã nguồn và unit test
  index.html          Trang HTML gốc
  package.json        Thư viện và lệnh phát triển
  package-lock.json   Phiên bản thư viện đã khóa
  tsconfig.json       Cấu hình TypeScript
  vite.config.ts      Cấu hình Vite
Logo/                 Logo nguồn
SRS_Checklist_Flipped_Classroom.xlsx   Danh sách yêu cầu
```

[Thiết kế Figma](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8).

## Phạm vi hiện tại

Dữ liệu được mô phỏng và lưu trong trình duyệt. Repository chưa có backend Java, API, cơ sở dữ liệu hoặc xác thực/phân quyền máy chủ. AI dùng luật và dữ liệu mẫu; chưa gọi model, gửi email hoặc chạy scheduler thật. Đồng bộ dữ liệu chỉ trong phạm vi trình duyệt, chưa có realtime giữa thiết bị.

Thay đổi học phần, phân công và ghi danh trong Admin chưa phản ánh đầy đủ sang các vai trò khác. Dữ liệu học tập chưa tách hoàn toàn theo tài khoản/lớp mới; cấu trúc đề và xử lý PDF còn giới hạn. Danh sách yêu cầu là tài liệu đầu vào, không phải xác nhận toàn bộ chức năng đã hoàn tất.

## Quy ước Git

Dùng một `.gitignore` tại gốc cho toàn bộ repository. Không commit thư viện đã cài, bản build, cache, báo cáo kiểm thử hoặc `.env` chứa cấu hình riêng. Có thể commit `.env.example` với giá trị mẫu. Giữ `package-lock.json` để cài đặt bằng `npm ci`.

`.gitattributes` chuẩn hóa file văn bản trong Git, giúp hạn chế khác biệt xuống dòng giữa các hệ điều hành.
