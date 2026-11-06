# Kịch bản test thủ công (rút gọn): Phase 1 & 2

Web: http://127.0.0.1:5173 · Mật khẩu mặc định: `12345678` · Các file nhắc đến nằm trong thư mục `test-data`. Bản chi tiết từng bước: [KICH-BAN-TEST.md](KICH-BAN-TEST.md).

## Vai 1: Admin (`AD001`)

### 1. Đăng nhập (UC-G04)

- Nhập `AD001` / `123` → **Đăng nhập**. Đúng: hiện "Mã tài khoản hoặc mật khẩu không đúng…", vẫn ở trang đăng nhập.
- Nhập mã không tồn tại `KHONGCO` / `12345678`. Đúng: cùng thông báo trên.
- Bấm **Quên mật khẩu?**. Đúng: hướng dẫn liên hệ Admin.
- Đăng nhập `AD001` / `12345678`. Đúng: vào trang **Quản lý tài khoản**, menu chỉ có Tài khoản, Học phần & lớp, Nhắc hạn học tập.

### 2. Import tài khoản bằng Excel: các file lỗi (UC-G05)

Vào **Tài khoản** → **Import tài khoản** → Loại tài khoản: **Sinh viên**.

- Chọn `1-tai-khoan/06_KHONG-PHAI-EXCEL.csv`. Đúng: báo phải chọn file `.xlsx`.
- Chọn `1-tai-khoan/05_SAI-TEN-COT.xlsx`. Đúng: báo "Thiếu cột bắt buộc: Mã SV, Họ tên, Email".
- Chọn `1-tai-khoan/02_sinh-vien_CO-LOI.xlsx`. Đúng: chỉ `SV2701` hợp lệ. 5 dòng còn lại báo đúng lỗi: email sai, thiếu họ tên, trùng mã 23110149, trùng email trong tệp, mã có dấu cách. Nút xác nhận bị khóa.

### 3. Import tài khoản bằng Excel: các file đúng (UC-G05)

- Chọn `1-tai-khoan/01_sinh-vien_HOP-LE_10-nguoi.xlsx` → **Xác nhận nhập 10 tài khoản** → F5. Đúng: có SV2601–SV2610, trạng thái **Cần đổi mật khẩu**.
- Import lại file `01`. Đúng: cả 10 dòng báo "Mã đã tồn tại".
- Đổi sang Loại **Giảng viên** → chọn `04_giang-vien_THIEU-KHOA.xlsx`. Đúng: GV202 báo **Thiếu khoa**, không cho nhập.
- Chọn `03_giang-vien_HOP-LE_3-nguoi.xlsx` → xác nhận. Đúng: tạo GV101–GV103 kèm khoa.

### 4. Gán vai trò, vô hiệu hóa, reset mật khẩu (UC-G05)

- Mở `SV2601`. Đúng: không có ô đổi vai trò.
- Mở `GV103` → Vai trò **Trưởng khoa** → **Lưu vai trò** → F5. Đúng: vai trò hiện Trưởng khoa.
- `SV2610` → **Vô hiệu hoá** → **Xác nhận**. Sang cửa sổ ẩn danh, đăng nhập `SV2610`. Đúng: không vào được.
- Quay lại Admin, **Kích hoạt lại** `SV2610`. Đúng: đăng nhập được trở lại.
- `SV2609` → **Reset mật khẩu** → **Xác nhận**. Đúng: trạng thái Cần đổi mật khẩu.

### 5. Học phần và lớp (UC-G06)

- Tạo học phần mã `CSE301`. Đúng: bị từ chối vì trùng mã.
- Tạo học phần `CSE999` → mở ra → **Tạo lớp** `CSE999.01`, Học kỳ I, Năm học `2026-2027`, Đợt `1`, Giảng viên `GV101`, Trưởng nhóm HP `TN001`. Đúng: lớp được tạo.
- Tạo lại một lớp y hệt. Đúng: báo lớp đã tồn tại. Nhập Năm học chỉ ghi `2026`. Đúng: báo sai định dạng.

### 6. Ghi danh sinh viên vào lớp (UC-G06)

Mở học phần **CSE301** → lớp **CSE301.02** → **Mở lớp** → **Import sinh viên vào lớp**.

- Chọn `2-ghi-danh/08_ghi-danh_CO-LOI.xlsx`. Đúng: SV9999 và GV001 báo "Không có tài khoản SV đang hoạt động", dòng SV2606 thứ hai báo trùng tệp, nút xác nhận bị khóa.
- Chọn `07_ghi-danh_HOP-LE_5-sv.xlsx` → **Xác nhận thêm vào lớp** → F5. Đúng: lớp có SV2601–SV2605.

## Vai 2: Sinh viên mới (`SV2601`, cửa sổ ẩn danh)

### 7. Đăng nhập lần đầu (UC-G04 AF-2)

- Đăng nhập `SV2601` / `12345678`. Đúng: bị chuyển sang trang **Đổi mật khẩu lần đầu**. Gõ thẳng địa chỉ `/sinh-vien/tong-quan` vẫn bị đưa về trang này.
- Đặt mật khẩu `1234`. Đúng: bị từ chối vì chưa đủ 8 ký tự. Đặt `12345678`. Đúng: bị từ chối vì trùng mật khẩu cũ.
- Đặt `Matkhau@2026`, đăng xuất rồi đăng nhập lại bằng mật khẩu này. Đúng: vào thẳng trang chủ sinh viên.

## Vai 3: Giảng viên (`GV001`, cửa sổ thường)

### 8. Bài học (UC-G02, menu "Bài học & học liệu")

- Bài "Kiến trúc ứng dụng web hiện đại". Đúng: nút xóa bị mờ, vì bài đã có dữ liệu sinh viên.
- **Tạo bài học** `4.1 Kiểm thử API` → F5. Đúng: bài vẫn còn, trạng thái Bản nháp.
- Đổi tên, đưa bài lên → F5. Đúng: thay đổi được giữ. Xóa bài → F5. Đúng: bài biến mất.

### 9. Soạn nội dung (UC-A01: bấm "Soạn bài" ở bài "Xác thực và phân quyền")

- Thêm 3 trang, đổi thứ tự → **Lưu bản nháp** → F5. Đúng: thứ tự trang giữ nguyên.
- Upload `4-bai-giang/13_GIA-MAO-khong-phai-pdf.pdf`. Đúng: báo "Tệp không phải PDF hợp lệ".
- Upload `12_bai-giang_Xac-thuc-JWT_4-trang.pdf`. Đúng: hiện bản xem trước, báo đã tải lên và bắt đầu lập chỉ mục.
- Tab Video: dán `https://vimeo.com/123456` → **Thêm video**. Đúng: báo phải là link YouTube. Dán `https://youtu.be/dQw4w9WgXcQ` thì được.

### 10. Ngân hàng câu hỏi (UC-A01)

- Đổi qua lại ô "Bài học". Đúng: mỗi bài chỉ hiện câu hỏi của riêng nó.
- Import `3-cau-hoi/10_cau-hoi_CO-LOI.xlsx`. Đúng: báo lỗi, không câu nào được thêm.
- Import `09_cau-hoi_HOP-LE_4-cau.xlsx`. Đúng: 4 câu ở trạng thái **Chờ giảng viên duyệt**.
- Thêm câu có 2 đáp án cùng là `401`. Đúng: báo "không được trùng nhau". Sửa cho đúng rồi lưu. Đúng: câu được lưu, nhãn Đã duyệt.
- **Xuất Excel**. Đúng: chỉ xuất câu của bài đang chọn.
- Soạn bài → **Công bố**. Đúng: bị chặn vì còn câu chờ duyệt. Duyệt hết rồi công bố lại. Đúng: bài chuyển sang Đã công bố.

### 11. Phiên tự học (UC-A02)

- Tạo phiên `Tự học JWT` cho bài "Xác thực và phân quyền", đặt giờ kết thúc trước giờ bắt đầu. Đúng: báo lỗi.
- Sửa giờ cho đúng rồi lưu. Đúng: dòng của phiên hiện tên bài, số trang và số câu hỏi.
- Công bố phiên rồi mở lại. Đúng: tên, bài học và giờ bắt đầu bị khóa. Dời giờ kết thúc sớm hơn thì bị chặn, dời muộn hơn thì được.

### 12. Tài liệu tham khảo (UC-A04)

- Thêm liên kết loại Video với link Vimeo. Đúng: bị từ chối.
- **Tải tệp lên** `5-tai-lieu/18_KHONG-HOP-LE.exe` (đổi bộ lọc của hộp chọn file sang **All files** để thấy file này). Đúng: bị từ chối.
- Tải lên các file `14` (PDF), `15` (Word), `16` (TXT), `17` (Excel). Đúng: tài liệu nằm cuối danh sách, kèm tên và dung lượng tệp.
- Đưa tài liệu lên/xuống, sửa tên → F5. Đúng: thay đổi được giữ.

## Vai 4: Phân quyền giữa các vai trò

### 13. Mỗi vai trò chỉ làm được việc của mình

- `GV002` sửa tên bài "Thiết kế RESTful API" rồi lưu. Đúng: báo "Bạn không phụ trách lớp CSE301.01." và tên bài quay về như cũ.
- `TN001` vào được nội dung các lớp CSE301 mình phụ trách. `TK001` chỉ xem, không sửa được bài học.
- `GV103` đăng nhập và đổi mật khẩu lần đầu. Đúng: vào workspace **Trưởng khoa**.
- `GV101` đăng nhập, đổi mật khẩu lần đầu → **Lớp giảng dạy**. Đúng: thấy học phần **CSE999** vừa tạo ở mục 5, không thấy CSE301 (không được phân công).
- `GV101` → **Bài học & học liệu** → **Tạo bài học**: ô **Lớp học phần** chỉ có `CSE999.01` → đặt tên bài → Lưu → F5. Đúng: bài được lưu và hiện tên lớp CSE999.01.
- `GV001` → **Lớp giảng dạy**. Đúng: không thấy CSE999.
- `TN001` → Tổng quan → ô **Học phần**. Đúng: có CSE999 để chọn, mở ra thấy lớp CSE999.01 của GV101.
- Sinh viên gõ địa chỉ `/giang-vien/tong-quan`. Đúng: bị đưa về trang của sinh viên.

## Vai 5: Sinh viên (`23110149`, cửa sổ ẩn danh)

### 14. Xem và tải tài liệu tham khảo (UC-B08)

- Vào "Tài liệu tham khảo" → **Tải xuống** file Word giảng viên vừa đưa lên. Đúng: tải về đúng file gốc, và sinh viên không có nút sửa, xóa hay di chuyển.

### 15. Câu hỏi chưa duyệt không lộ ra cho sinh viên

- (Cửa sổ GV001) Import `3-cau-hoi/11_cau-hoi_HOP-LE.csv` vào bài "Thiết kế RESTful API", không duyệt.
- (Cửa sổ SV) F12 → Network → F5 → mở `bootstrap` → tìm `Header Authorization`. Đúng: không tìm thấy.

### 16. Chat AI dùng PDF vừa tải lên

- Vào **Trợ lý AI**, hỏi `JWT gồm mấy phần?`. Đúng: trả lời trích từ PDF đã upload (header, payload, signature).
- Hỏi `Thời tiết hôm nay thế nào?`. Đúng: báo không có học liệu phù hợp, gợi ý hỏi giảng viên.

### 17. Gửi phản hồi kèm ảnh (UC-E01, UC-E02)

- Đính kèm `6-phan-hoi/22_KHONG-PHAI-ANH.txt`. Đúng: báo chỉ nhận ảnh. Đính kèm `21_anh-QUA-5MB.png`. Đúng: báo vượt 5 MB.
- Đính kèm 2 ảnh `19`, `20` rồi gửi. Đúng: phản hồi ở trạng thái Chờ xử lý.
- (Cửa sổ GV001) Trả lời và đánh dấu đã xử lý. Bên SV bấm F5. Đúng: thấy câu trả lời, trạng thái Đã xử lý.
