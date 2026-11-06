# Bộ dữ liệu test thủ công

Kịch bản chính: **[KICH-BAN-TEST-LIEN-VAI-TRO.md](KICH-BAN-TEST-LIEN-VAI-TRO.md)**. Mỗi bước có phần "Kiểm tra chéo" ở màn của các vai trò liên quan. Các kịch bản cũ nằm trong thư mục `_cu/`.

Mở web tại **http://127.0.0.1:5173**. Nếu web chưa chạy, nhấp đúp `start-test.cmd` ở thư mục gốc dự án.

Muốn test lại từ đầu với dữ liệu trống: đóng cửa sổ "LMS backend", nhấp đúp `reset-du-lieu.cmd` rồi gõ `Y`. Lệnh này xóa toàn bộ học phần, lớp, bài học, phiên, bài tập, điểm, phản hồi và file upload, nhưng **giữ lại mọi tài khoản**. Bản sao lưu trước khi xóa được đặt trong `lms-backend/backup-truoc-reset/`.

## Tài khoản có sẵn (mật khẩu `12345678`)

Hệ thống hiện chỉ có tài khoản, chưa có học phần hay lớp nào. Ai phụ trách lớp nào là do bạn phân công trong lúc test (xem Luồng 2 của kịch bản).

| Vai trò | Mã đăng nhập |
| --- | --- |
| Admin | `AD001` |
| Giảng viên | `GV001`, `GV002`, `GV102`, `GV103` |
| Trưởng nhóm HP | `TN001`, `GV101` |
| Trưởng khoa | `TK001` |
| Sinh viên | `23110149`, `SV2601`–`SV2610` |

Một số tài khoản `SV26xx` và `GV10x` có thể đã bị đổi mật khẩu trong lần test trước. Nếu không đăng nhập được, Admin vào Tài khoản và bấm reset mật khẩu (mật khẩu về `12345678`).

## Các file và cách dùng

### 1-tai-khoan (Admin → Tài khoản → Import)

Chọn đúng "Loại tài khoản" trước khi chọn file.

| File | Loại | Kết quả đúng |
| --- | --- | --- |
| `00_sinh-vien_MOI_3-nguoi.xlsx` | Sinh viên | 3 SV mới `SV3001`–`SV3003` → nhập thành công |
| `00_giang-vien_MOI_1-nguoi.xlsx` | Giảng viên | 1 GV mới `GV301` → nhập thành công |
| `01_sinh-vien_HOP-LE_10-nguoi.xlsx` | Sinh viên | `SV2601`–`SV2610` **đã có sẵn** → báo trùng mã, không nhập |
| `02_sinh-vien_CO-LOI.xlsx` | Sinh viên | 5/6 dòng báo lỗi (email sai, thiếu tên, trùng mã `23110149`, trùng email trong tệp, mã có dấu cách) → **không cho nhập dòng nào** |
| `03_giang-vien_HOP-LE_3-nguoi.xlsx` | Giảng viên | `GV101`–`GV103` **đã có sẵn** → báo trùng mã |
| `04_giang-vien_THIEU-KHOA.xlsx` | Giảng viên | Dòng `GV202` báo "Thiếu khoa" → bị chặn |
| `05_SAI-TEN-COT.xlsx` | bất kỳ | Báo "Thiếu cột bắt buộc" |
| `06_KHONG-PHAI-EXCEL.csv` | bất kỳ | Báo phải chọn file `.xlsx` |

File `00_*` chỉ nhập thành công **một lần**. Lần sau nhập lại sẽ báo trùng mã; như vậy cũng là đúng.

### 2-ghi-danh (Admin → Học phần → mở học phần vừa tạo → ở dòng lớp bấm Import)

| File | Kết quả đúng |
| --- | --- |
| `07_ghi-danh_HOP-LE_6-sv.xlsx` | 6 sinh viên `23110149`, `SV2601`–`SV2605` vào lớp |
| `08_ghi-danh_CO-LOI.xlsx` | `SV9999` và `GV001`: "Không có tài khoản SV đang hoạt động"; dòng `SV2606` thứ hai: "trùng tệp" → không cho ghi danh |

### 3-cau-hoi (Giảng viên `GV001` → Ngân hàng câu hỏi → chọn bài vừa tạo → Import Excel/CSV)

| File | Kết quả đúng |
| --- | --- |
| `09_cau-hoi_HOP-LE_4-cau.xlsx` | 4 câu về JWT/401/403/BCrypt, trạng thái "Chờ giảng viên duyệt" |
| `10_cau-hoi_CO-LOI.xlsx` | Báo lỗi → **không câu nào được thêm**, kể cả dòng đầu đúng |
| `11_cau-hoi_HOP-LE.csv` | 2 câu, kiểm tra import dạng CSV |

Sau khi import, vào Soạn bài → "Công bố": hệ thống phải chặn cho tới khi bạn duyệt hết câu.

### 4-bai-giang (Giảng viên → Bài học & học liệu → Soạn bài → tab Bài giảng → Upload)

| File | Kết quả đúng |
| --- | --- |
| `12_bai-giang_Xac-thuc-JWT_4-trang.pdf` | Tải lên và lập chỉ mục; sau đó Sinh viên hỏi Trợ lý AI "JWT gồm mấy phần?" sẽ được trả lời từ tài liệu này |
| `13_GIA-MAO-khong-phai-pdf.pdf` | Bị từ chối: "Tệp không phải PDF hợp lệ" |

Link video để dán ở tab Video:

- Hợp lệ: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` hoặc `https://youtu.be/dQw4w9WgXcQ`
- Bị từ chối: `https://vimeo.com/123456`

### 5-tai-lieu (Giảng viên → Tài liệu tham khảo → Tải tệp lên / Thêm liên kết)

| File | Kết quả đúng |
| --- | --- |
| `14_de-cuong_CSE301.pdf`, `15_bai-tap-tham-khao.docx`, `16_ghi-chu-on-tap.txt`, `17_bang-ma-HTTP.xlsx` | Tải lên được, hiện tên và dung lượng tệp; Sinh viên bấm "Tải xuống" nhận đúng tệp gốc |
| `18_KHONG-HOP-LE.exe` | Bị từ chối |

Liên kết để thử: `https://developer.mozilla.org/vi/docs/Web/HTTP/Status` (loại Liên kết, hợp lệ); `https://vimeo.com/123456` (loại Video, bị từ chối).

### 6-phan-hoi (Sinh viên → Phản hồi & hỗ trợ → Gửi phản hồi → Đính kèm ảnh)

| File | Kết quả đúng |
| --- | --- |
| `19_anh-minh-chung-1.png`, `20_anh-minh-chung-2.png` | Đính kèm được; Giảng viên xem được ảnh trong mục Phản hồi |
| `21_anh-QUA-5MB.png` | Báo "Tổng dung lượng ảnh không được vượt quá 5 MB" |
| `22_KHONG-PHAI-ANH.txt` | Báo "Chỉ chấp nhận tệp hình ảnh" |

## Muốn test lại từ đầu

Đóng hai cửa sổ backend/frontend, xóa thư mục `lms-backend\data` và `lms-backend\private_media`, rồi chạy lại `start-test.cmd`. Hệ thống sẽ nạp lại dữ liệu mẫu, gồm 6 tài khoản ở trên.

Muốn tạo lại bộ file này (ví dụ sau khi lỡ sửa): chạy `node test-data/_tao-du-lieu.mjs .` ở thư mục gốc dự án. Lệnh này tạo lại 6 thư mục file test; README này và script được giữ nguyên.
