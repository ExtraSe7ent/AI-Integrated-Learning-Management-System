# Hướng dẫn kiểm thử Phase 1 (Nền tảng) và Phase 2 (Nội dung bài giảng)

Tài liệu này giúp bạn kiểm tra 7 Use Case của Phase 1–2 theo ba cách: test tự động backend, test giao diện tự động (Playwright) và test tay trên trình duyệt.

| Phase | Use Case | Màn hình | API chính |
| --- | --- | --- | --- |
| 1.1 | UC-G04 Đăng nhập | `/dang-nhap`, `/doi-mat-khau` | `POST /api/auth/login`, `POST /api/auth/change-password` |
| 1.1 | UC-G05 Tài khoản & phân quyền | Admin → Tài khoản | `/api/users/*` |
| 1.2 | UC-G06 Học phần & lớp | Admin → Học phần | `/api/courses`, `/api/class-info`, `/api/class-info/{id}/enroll` |
| 1.2 | UC-G02 Quản lý bài học | GV → Bài học & học liệu | `/api/lessons` |
| 2.1 | UC-A01 Nội dung bài học + quiz | GV → Soạn bài, Ngân hàng câu hỏi | `/api/lessons/{id}`, `/api/questions`, `/api/questions/import`, `/api/materials`, `/api/ai/question-suggestions` |
| 2.1 | UC-A04 Tài liệu tham khảo | GV/SV → Tài liệu tham khảo | `/api/resources`, `/api/resources/upload`, `/api/resources/{id}/file` |
| 2.2 | UC-A02 Phiên tự học | GV → Phiên tự học | `/api/sessions` |

## 0. Chuẩn bị

- **JDK 21.** Máy đang để Java 17 trong PATH, nên trước khi chạy backend hãy mở PowerShell và đặt:
  ```powershell
  $env:JAVA_HOME = "C:\Users\quoca\.jdks\jdk-21.0.13+9"
  ```
- **Node.js 24** cho frontend.
- Tài khoản mẫu (mật khẩu `12345678`): `AD001` Admin · `GV001` Giảng viên · `TN001` Trưởng nhóm HP · `TK001` Trưởng khoa · `23110149` Sinh viên.

## 1. Test tự động backend (nhanh nhất, không cần mở trình duyệt)

```powershell
cd lms-backend
.\mvnw.cmd verify
```

Kết quả mong đợi: `Tests run: 223, Failures: 0`, `All coverage checks have been met`, `BUILD SUCCESS`. Lệnh fail nếu coverage dòng hoặc nhánh dưới 80%.

Chỉ chạy test các quy tắc Phase 1–2:

```powershell
.\mvnw.cmd test "-Dtest=TeachingContentRestTest,AuthRestTest,ClassInfoRestTest,CourseRestTest,LessonRestTest,QuestionRestTest,StudySessionRestTest,ResourceItemRestTest"
```

`TeachingContentRestTest` kiểm tra: phạm vi lớp (GV lớp khác bị 403, TNHP được sửa), validate bài học/câu hỏi/phiên, chặn xóa khi có dữ liệu SV, import câu hỏi nguyên khối, SV không thấy câu chưa duyệt, upload/tải file tài liệu, GV phải có Khoa.

## 2. Test giao diện tự động (Playwright)

Test E2E chạy trên server thật. Profile `e2e` bật API `POST /api/e2e/reset` **xóa và nạp lại dữ liệu mẫu trước mỗi test**, nên luôn dùng một database riêng, đừng trỏ vào thư mục `data/` bạn đang dùng.

Terminal 1, backend với DB tạm:

```powershell
cd lms-backend
$env:JAVA_HOME = "C:\Users\quoca\.jdks\jdk-21.0.13+9"
$env:SPRING_PROFILES_ACTIVE = "dev,e2e"
$env:SPRING_DATASOURCE_URL = "jdbc:h2:file:./e2e-data/lms;MODE=PostgreSQL"
$env:LMS_STORAGE_ROOT = "./e2e-media"
.\mvnw.cmd spring-boot:run
```

Terminal 2, frontend:

```powershell
cd FE
npm run dev
```

Terminal 3, chạy test:

```powershell
cd FE
npx playwright test tests/phase1-2.spec.ts                 # 5 kịch bản mới của Phase 1–2
npx playwright test tests/admin-ai.spec.ts tests/navigation.spec.ts tests/audit-regressions.spec.ts:3 tests/course-leader.spec.ts
npx playwright show-report artifacts/playwright-report      # xem báo cáo, ảnh và trace khi lỗi
```

Lần chạy gần nhất: `phase1-2.spec.ts` 5/5 pass; các test đăng nhập, import, khóa/reset tài khoản, học phần/lớp, soạn bài, TNHP, điều hướng 25/25 pass.

Unit test frontend: `npm test` (40 test).

## 3. Test tay trên trình duyệt

Chạy `run-backend.cmd` (sau khi đặt `JAVA_HOME`) và `run-frontend.cmd`, rồi mở http://127.0.0.1:5173.

Ở mỗi bước, sau khi thao tác hãy **F5 tải lại trang**: dữ liệu còn nghĩa là server đã lưu. Khi server từ chối, góc màn hình hiện thông báo lỗi và dữ liệu quay về trạng thái của server. Muốn về dữ liệu mẫu ban đầu: dừng backend, xóa `lms-backend/data` và `lms-backend/private_media`.

### UC-G04 Đăng nhập

| # | Thao tác | Kết quả đúng |
| --- | --- | --- |
| 1 | Đăng nhập lần lượt 5 tài khoản mẫu | Mỗi vai trò vào đúng workspace và menu riêng |
| 2 | Nhập sai mật khẩu | Báo lỗi, vẫn ở trang đăng nhập |
| 3 | Đăng nhập bằng tài khoản vừa import hoặc vừa reset (mục G05) | Bị chuyển sang `/doi-mat-khau`, chưa vào được workspace |
| 4 | Đổi mật khẩu ngắn hơn 8 ký tự, hoặc trùng mật khẩu cũ | Bị từ chối |
| 5 | Bấm "Quên mật khẩu" | Hướng dẫn liên hệ Admin (AF-3) |

### UC-G05 Tài khoản & phân quyền (đăng nhập `AD001`)

| # | Thao tác | Kết quả đúng |
| --- | --- | --- |
| 1 | Import Excel sinh viên (Mã SV, Họ tên, Email) có một dòng sai email | Xem trước báo lỗi, **không dòng nào được tạo** |
| 2 | Import file hợp lệ | Tài khoản role Sinh viên, buộc đổi mật khẩu |
| 3 | Import GV thiếu cột Khoa | Bị chặn ở xem trước; nếu gọi thẳng API, server trả "Thiếu khoa của giảng viên" |
| 4 | Import trùng mã hoặc trùng email | Bị từ chối |
| 5 | Gán vai trò Trưởng nhóm HP / Trưởng khoa cho một GV | Đăng nhập lại vào đúng workspace mới; không gán được cho tài khoản SV |
| 6 | Reset mật khẩu | Mật khẩu về `12345678`, lần đăng nhập sau buộc đổi |
| 7 | Vô hiệu hóa tài khoản | Không đăng nhập được; dữ liệu học tập vẫn giữ |

### UC-G06 Học phần & lớp (đăng nhập `AD001`)

| # | Thao tác | Kết quả đúng |
| --- | --- | --- |
| 1 | Tạo học phần trùng mã | Bị từ chối |
| 2 | Tạo lớp (tên, học kỳ, năm học dạng `2026–2027`, đợt), gán GV và TNHP | Lớp xuất hiện, còn sau F5 |
| 3 | Tạo lớp trùng tên + kỳ + đợt | Bị từ chối |
| 4 | Import danh sách mã SV vào lớp, có một mã không tồn tại | Bị từ chối, nêu mã lỗi |
| 5 | Xóa học phần đang có lớp | Bị từ chối |

### UC-G02 Quản lý bài học (đăng nhập `GV001`, menu "Bài học & học liệu")

| # | Thao tác | Kết quả đúng |
| --- | --- | --- |
| 1 | Tạo bài "4.1 Kiểm thử API" | Có trong danh sách sau F5, trạng thái Bản nháp |
| 2 | Đổi tên, đưa lên/xuống | Giữ nguyên sau F5 |
| 3 | Thử xóa "Kiến trúc ứng dụng web hiện đại" | Nút xóa bị khóa: bài đã có dữ liệu SV |
| 4 | Xóa bài vừa tạo | Biến mất; các câu hỏi và phiên tự học của bài cũng bị xóa theo |
| 5 | (API) Gửi `activity: false` để xóa bài đã có dữ liệu | Server vẫn chặn: cờ này do server tính, client không ghi đè được |

### UC-A01 Nội dung bài học & câu hỏi (đăng nhập `GV001`)

| # | Thao tác | Kết quả đúng |
| --- | --- | --- |
| 1 | Soạn bài → thêm/xóa/sắp xếp trang → Lưu bản nháp → F5 | Thứ tự trang giữ nguyên |
| 2 | Upload PDF bài giảng | Báo "đã tải lên và bắt đầu lập chỉ mục" (nguồn cho Chat AI) |
| 3 | Tab Video: nhập `https://vimeo.com/1` rồi lưu | Báo phải là link YouTube; `https://youtu.be/...` thì được |
| 4 | Ngân hàng câu hỏi → chọn bài "Xác thực và phân quyền" | Chỉ hiện câu hỏi của bài đó |
| 5 | Thêm câu có 2 đáp án trùng nhau | Báo "không được trùng nhau" |
| 6 | Nhập trang lớn hơn số trang của bài | Bị từ chối |
| 7 | Import CSV có 1 dòng đúng + 1 dòng thiếu đáp án D | Báo lỗi, **không câu nào được thêm**; file đúng thì thêm và ở trạng thái "Chờ duyệt" |
| 8 | Xuất Excel | Chỉ xuất câu của bài đang chọn |
| 9 | Bấm "AI gợi ý câu hỏi" | Có khóa AI: thêm câu nháp chờ duyệt. Không có khóa: báo chưa cấu hình |
| 10 | Bài có câu chờ duyệt → Soạn bài → Công bố | Bị chặn cho tới khi duyệt hết |
| 11 | Đăng nhập SV `23110149` trong lúc còn câu chờ duyệt | SV **không** nhận được câu chờ duyệt (kiểm tra ở F12 → Network → `/api/bootstrap`) |
| 12 | Xóa câu đã có SV trả lời | Bị từ chối; chỉ được sửa |
| 13 | Đăng nhập `TN001` (TNHP lớp CSE301.01) | Sửa được nội dung lớp mình phụ trách; `TK001` không sửa được |

### UC-A02 Phiên tự học (đăng nhập `GV001`, menu "Phiên tự học")

| # | Thao tác | Kết quả đúng |
| --- | --- | --- |
| 1 | Tạo phiên, chọn bài "Xác thực và phân quyền" | Dòng hiện tên bài, số trang, số câu hỏi; giữ sau F5 |
| 2 | Kết thúc trước hoặc bằng bắt đầu | Bị từ chối |
| 3 | Tạo nhiều phiên (AF-2) | Đều được lưu |
| 4 | Công bố, rồi sửa tên / giờ bắt đầu / bài học | Bị khóa; server cũng từ chối nếu gọi API |
| 5 | Phiên đã công bố: dời giờ kết thúc ra sau (AF-1) | Được; dời sớm hơn thì bị chặn |
| 6 | Xóa phiên đã có SV học | Bị từ chối; hãy dùng "Ẩn phiên" |

### UC-A04 / UC-B08 Tài liệu tham khảo

| # | Thao tác | Kết quả đúng |
| --- | --- | --- |
| 1 | GV → "Thêm liên kết", loại Video, link Vimeo | Báo phải là YouTube |
| 2 | GV → "Tải tệp lên" một PDF/Word/PowerPoint | Xuất hiện ở cuối danh sách, kèm tên và dung lượng tệp |
| 3 | Tải tệp `.exe` | Bị từ chối |
| 4 | Đưa tài liệu lên/xuống, F5 | Thứ tự giữ nguyên |
| 5 | Sửa tên/mô tả; với tệp đã upload thì không sửa được đường dẫn | Đúng như mô tả |
| 6 | SV → Tài liệu tham khảo → "Tải xuống" | Tải đúng tệp gốc; liên kết thì mở tab mới |

## 4. Kiểm tra API trực tiếp bằng Swagger

Mở http://127.0.0.1:8080/swagger-ui.html, gọi `POST /api/auth/login` lấy `token`, bấm **Authorize** và dán token vào. Nên thử:

- `POST /api/questions/import` với một mảng có dòng sai: mong đợi lỗi 400 `Dòng 2: ...` và không có câu nào được lưu.
- `GET /api/questions` bằng token sinh viên: không có câu `approved: false`.
- `PUT /api/lessons/l1` bằng token của giảng viên không phụ trách CSE301.01: mong đợi 403.

## 5. Giới hạn hiện tại

- **Mỗi tài khoản chỉ có một vai trò.** Gán Trưởng nhóm HP cho một GV sẽ thay vai trò Giảng viên của người đó, chưa phải "vai trò bổ sung" như SRS mô tả.
- **BR-08 (video ≤ 6–10 phút)** chưa kiểm tra được: cần gọi YouTube Data API để lấy thời lượng.
- **BR-06 (TNHP chuẩn hóa trước khi triển khai)** mới được theo dõi ở luồng điều phối M0–M3, chưa chặn việc công bố bài học.
- **Slide là danh sách tên trang kèm PDF**, chưa chuyển PowerPoint thành ảnh.
- **Tài liệu tham khảo dùng chung toàn học phần**, chưa tách theo từng lớp.
- **Sinh viên vẫn nhận đáp án đúng của câu đã duyệt** trước khi trả lời (FE tự chấm). Việc chấm quiz trên server thuộc Phase 3 (UC-B03).
- **Có 9 test E2E cũ đang lỗi** (luyện tập, nhắc hạn, bài tập, điểm, Trưởng khoa). Chúng tìm các chữ trên giao diện đã đổi trong những file đang sửa dở chưa commit (`Practice.tsx`, `Reminders.tsx`, `Giangvien/BaiTap.tsx`, `Truongkhoa/data.ts`, `Grades.tsx`), không thuộc Phase 1–2. Cần cập nhật test khi hoàn thiện các phase đó.
