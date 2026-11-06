# Kịch bản test thủ công: Phase 1 & 2

Mở web: http://127.0.0.1:5173 (chưa chạy thì nhấp đúp `start-test.cmd` ở thư mục gốc dự án). Mật khẩu mặc định của mọi tài khoản: `12345678`. Các file nhắc đến bên dưới nằm trong thư mục `test-data`.

Làm theo đúng thứ tự, vì dữ liệu tạo ở bước trước được dùng ở bước sau. Mẹo: sau mỗi thao tác, chờ khoảng 1 giây rồi bấm **F5**; dữ liệu còn nghĩa là server đã lưu. Ở các bước "bị chặn", việc hiện thông báo lỗi và dữ liệu quay về như cũ chính là kết quả đúng.

---

## Vai 1: Admin (`AD001`)

**1. Đăng nhập (UC-G04)**

- Nhập mã `AD001`, mật khẩu `123` → **Đăng nhập**. Đúng: hiện "Mã tài khoản hoặc mật khẩu không đúng…", vẫn ở trang đăng nhập.
- Nhập mã không tồn tại `KHONGCO` / `12345678`. Đúng: cùng thông báo trên, không tiết lộ mã có tồn tại hay không.
- Bấm **Quên mật khẩu?**. Đúng: hướng dẫn liên hệ Admin, không có ô nhập email/OTP.
- Đăng nhập `AD001` / `12345678`. Đúng: vào trang **Quản lý tài khoản**; menu trái chỉ có Tài khoản, Học phần & lớp, Nhắc hạn học tập.

**2. Import tài khoản bằng Excel: các file lỗi (UC-G05)**

Vào **Tài khoản** → **Import tài khoản** → Loại tài khoản: **Sinh viên**.

- Chọn `1-tai-khoan/06_KHONG-PHAI-EXCEL.csv`. Đúng: báo phải chọn file Excel `.xlsx`.
- Chọn `1-tai-khoan/05_SAI-TEN-COT.xlsx`. Đúng: báo "Thiếu cột bắt buộc: Mã SV, Họ tên, Email".
- Chọn `1-tai-khoan/02_sinh-vien_CO-LOI.xlsx`. Đúng: bảng xem trước có 6 dòng, chỉ `SV2701` là **Hợp lệ**. 5 dòng còn lại báo đúng lỗi: email sai (SV2702), thiếu họ tên (SV2703), mã đã tồn tại (23110149), email trùng trong tệp (SV2705), mã có dấu cách (SV 2706). Nút **Xác nhận nhập…** bị khóa, kèm dòng "Chưa có tài khoản nào được tạo".
- Bấm **Tải file mẫu XLSX**. Đúng: tải về file mẫu có đúng 3 cột Mã SV, Họ tên, Email.

**3. Import tài khoản bằng Excel: các file đúng (UC-G05)**

- Loại **Sinh viên** → chọn `1-tai-khoan/01_sinh-vien_HOP-LE_10-nguoi.xlsx`. Đúng: 10 dòng SV2601 → SV2610 đều **Hợp lệ**.
- Bấm **Xác nhận nhập 10 tài khoản**. Đúng: báo "Đã tạo 10 tài khoản. Mật khẩu mặc định: 12345678…".
- Bấm **Xem danh sách tài khoản** → F5. Đúng: có SV2601–SV2610, trạng thái **Cần đổi mật khẩu**.
- Import lại đúng file `01` một lần nữa. Đúng: cả 10 dòng báo "Mã đã tồn tại", không cho nhập.
- Đổi Loại tài khoản sang **Giảng viên** → chọn `1-tai-khoan/04_giang-vien_THIEU-KHOA.xlsx`. Đúng: GV201 hợp lệ, GV202 báo **Thiếu khoa**, không cho nhập.
- Chọn `1-tai-khoan/03_giang-vien_HOP-LE_3-nguoi.xlsx` → xác nhận. Đúng: tạo GV101, GV102, GV103, cột Email / Khoa hiện đúng khoa.

**4. Gán vai trò, vô hiệu hóa, reset mật khẩu (UC-G05)**

- Ở dòng `SV2601` bấm **Quản lý**. Đúng: chỉ ghi "Vai trò: Sinh viên…", không có ô đổi vai trò.
- Mở `GV103` → Vai trò = **Trưởng khoa** → **Lưu vai trò** → F5. Đúng: vai trò hiện Trưởng khoa.
- Mở `SV2610` → **Vô hiệu hoá** → **Xác nhận**.
- Mở cửa sổ ẩn danh (Ctrl+Shift+N), đăng nhập `SV2610` / `12345678`. Đúng: báo sai thông tin, không vào được.
- Quay lại Admin: `SV2610` → **Kích hoạt lại** → **Xác nhận**. Đúng: tài khoản hoạt động lại và đăng nhập được.
- Mở `SV2609` → **Reset mật khẩu** → **Xác nhận**. Đúng: trạng thái **Cần đổi mật khẩu**.

**5. Học phần và lớp (UC-G06)**

Vào **Học phần & lớp**.

- **Tạo học phần** với mã `CSE301` → **Lưu học phần**. Đúng: bị từ chối vì trùng mã.
- **Tạo học phần**: Mã `CSE999`, Tên `Kiểm thử phần mềm`, Khoa `Khoa học và Kỹ thuật máy tính` → Lưu → F5. Đúng: CSE999 có trong danh sách.
- Mở CSE999 → **Tạo lớp**: Tên `CSE999.01`, Học kỳ I, Năm học `2026-2027`, Đợt `1`, Giảng viên `GV101`, Trưởng nhóm HP `TN001` → **Lưu lớp**. Đúng: lớp được tạo.
- Tạo lại một lớp y hệt (cùng tên, kỳ, năm, đợt). Đúng: báo lớp đã tồn tại.
- Tạo lớp với Năm học chỉ ghi `2026`. Đúng: báo năm học phải có dạng 2026–2027.

**6. Ghi danh sinh viên vào lớp (UC-G06)**

Mở học phần **CSE301** → ở lớp **CSE301.02** bấm **Mở lớp** → **Import sinh viên vào lớp**.

- Chọn `2-ghi-danh/08_ghi-danh_CO-LOI.xlsx`. Đúng: SV2606 hợp lệ; SV9999 và GV001 báo "Không có tài khoản SV đang hoạt động"; dòng SV2606 thứ hai báo "trùng tệp"; nút xác nhận bị khóa.
- Chọn `2-ghi-danh/07_ghi-danh_HOP-LE_5-sv.xlsx` → **Xác nhận thêm vào lớp** → F5. Đúng: lớp CSE301.02 có SV2601–SV2605.
- Import lại file `07`. Đúng: cả 5 dòng báo "đã có trong lớp".

Đăng xuất Admin.

---

## Vai 2: Sinh viên mới (`SV2601`, cửa sổ ẩn danh)

**7. Đăng nhập lần đầu (UC-G04 AF-2)**

- Đăng nhập `SV2601` / `12345678`. Đúng: bị chuyển sang trang **Đổi mật khẩu lần đầu**, chưa vào được hệ thống.
- Gõ thẳng địa chỉ `http://127.0.0.1:5173/sinh-vien/tong-quan`. Đúng: vẫn bị đưa về trang đổi mật khẩu.
- Đặt mật khẩu mới `1234`. Đúng: bị từ chối vì cần ít nhất 8 ký tự.
- Đặt mật khẩu mới `12345678` (trùng mật khẩu cũ). Đúng: bị từ chối, phải khác mật khẩu hiện tại.
- Đặt `Matkhau@2026` và nhập lại giống hệt. Đúng: vào trang **Tổng quan** của sinh viên.
- Đăng xuất, đăng nhập lại `SV2601` / `Matkhau@2026`. Đúng: vào thẳng trang chủ, không bị hỏi đổi mật khẩu nữa.

---

## Vai 3: Giảng viên (`GV001`, cửa sổ thường)

**8. Bài học (UC-G02, menu "Bài học & học liệu")**

- Xem bài **Kiến trúc ứng dụng web hiện đại**. Đúng: ghi "Đã có hoạt động của sinh viên", nút thùng rác bị mờ (không xóa được).
- **Tạo bài học** → tên `4.1 Kiểm thử API` → **Lưu bài học** → F5. Đúng: bài vẫn còn ở cuối danh sách, trạng thái **Bản nháp**, ghi "Chưa có dữ liệu sinh viên".
- Bấm bút chì, đổi tên thành `4.1 Kiểm thử REST API`, rồi đưa bài lên một bậc → F5. Đúng: tên và thứ tự mới được giữ.
- Bấm thùng rác ở bài vừa tạo → F5. Đúng: bài biến mất.

**9. Soạn nội dung bài (UC-A01: bấm "Soạn bài" ở bài "Xác thực và phân quyền")**

- Bấm **Thêm trang** 3 lần, đổi thứ tự một trang → **Lưu bản nháp** → F5. Đúng: số trang và thứ tự được giữ.
- Upload `4-bai-giang/13_GIA-MAO-khong-phai-pdf.pdf`. Đúng: báo "Tệp không phải PDF hợp lệ".
- Upload `4-bai-giang/12_bai-giang_Xac-thuc-JWT_4-trang.pdf`. Đúng: khung xem trước hiện PDF, báo "Đã tải PDF lên máy chủ và bắt đầu lập chỉ mục…".
- Tab **Video**: dán `https://vimeo.com/123456` → **Thêm video**. Đúng: báo phải là liên kết YouTube hợp lệ.
- Dán `https://youtu.be/dQw4w9WgXcQ` → **Thêm video** → **Lưu bản nháp** → F5. Đúng: không báo lỗi, link được giữ.
- Mở tab **Câu hỏi**. Đúng: ghi "Bài này chưa có câu hỏi kiểm tra".

**10. Ngân hàng câu hỏi (UC-A01)**

Ở tab Câu hỏi bấm **Soạn & duyệt câu hỏi**; ô **Bài học** phải đang là "Xác thực và phân quyền".

- Đổi ô Bài học sang "Thiết kế RESTful API" rồi đổi về lại. Đúng: mỗi bài chỉ hiện câu hỏi của riêng nó.
- **Import Excel/CSV** → `3-cau-hoi/10_cau-hoi_CO-LOI.xlsx`. Đúng: báo "Không đọc được tệp…", không câu nào được thêm, kể cả dòng đầu viết đúng.
- **Import Excel/CSV** → `3-cau-hoi/09_cau-hoi_HOP-LE_4-cau.xlsx` → F5. Đúng: có 4 câu (JWT, 401, 403, BCrypt), mỗi câu nhãn **Chờ giảng viên duyệt**, đáp án đúng có dấu tick.
- **Thêm câu hỏi**, ghi đáp án A và B đều là `401` → **Lưu câu hỏi**. Đúng: báo "Bốn đáp án A–D không được trùng nhau".
- Sửa cho 4 đáp án khác nhau, Trang = `1` → Lưu → F5. Đúng: câu mới được lưu với nhãn **Đã duyệt**.
- Bấm **Xuất Excel**. Đúng: file tải về chỉ chứa câu của bài "Xác thực và phân quyền".
- Quay lại **Soạn bài** → **Công bố**. Đúng: bị chặn với thông báo "Cần duyệt tất cả câu hỏi của bài này trước khi công bố".
- Về Ngân hàng câu hỏi, bấm **Đã rà soát · Duyệt câu hỏi** cho từng câu chờ duyệt → Soạn bài → **Công bố** → F5. Đúng: bài chuyển sang **Đã công bố**.
- Bấm **AI gợi ý câu hỏi**. Đúng: chưa có khóa AI thì báo chưa cấu hình; có khóa thì thêm câu nháp chờ duyệt.

**11. Phiên tự học (UC-A02)**

Vào menu **Phiên tự học**.

- **Tạo phiên tự học**: tên `Tự học JWT`, Bài học "Xác thực và phân quyền", đặt giờ kết thúc sớm hơn giờ bắt đầu → Lưu. Đúng: báo "Thời gian kết thúc phải sau thời gian bắt đầu".
- Sửa lại giờ cho đúng → **Lưu phiên tự học** → F5. Đúng: dòng của phiên ghi "Xác thực và phân quyền · … trang · … câu hỏi".
- Tạo thêm một phiên nữa cho cùng bài. Đúng: cả hai phiên đều được lưu.
- **Công bố** phiên `Tự học JWT`, rồi mở lại phần cài đặt. Đúng: hộp thoại đổi tên thành **Gia hạn phiên tự học**; ô tên, bài học và giờ bắt đầu bị khóa.
- Dời giờ kết thúc sớm hơn → Lưu. Đúng: báo "chỉ được gia hạn, không rút ngắn".
- Dời giờ kết thúc muộn hơn 2 ngày → Lưu → F5. Đúng: ngày kết thúc mới được giữ.

**12. Tài liệu tham khảo (UC-A04)**

Vào **Tài liệu tham khảo** (menu trái, phần TIỆN ÍCH).

- **Thêm liên kết**: Loại "Video YouTube", link `https://vimeo.com/123456`. Đúng: báo "Video phải là liên kết YouTube".
- **Thêm liên kết**: tên `Mã trạng thái HTTP (MDN)`, Loại "Liên kết", link `https://developer.mozilla.org/vi/docs/Web/HTTP/Status` → F5. Đúng: tài liệu có trong danh sách với loại **Liên kết**.
- **Tải tệp lên** `5-tai-lieu/18_KHONG-HOP-LE.exe`. Hộp chọn file chỉ hiện các loại hợp lệ, nên đổi bộ lọc góc dưới sang **All files** để thấy file này. Đúng: bị từ chối, kèm danh sách loại tệp được nhận.
- **Tải tệp lên** lần lượt `14_de-cuong_CSE301.pdf`, `15_bai-tap-tham-khao.docx`, `16_ghi-chu-on-tap.txt`, `17_bang-ma-HTTP.xlsx`. Đúng: mỗi lần báo "Đã tải tài liệu lên"; tệp nằm ở cuối danh sách, có tên tệp và dung lượng KB.
- Bấm mũi tên lên ở `14_de-cuong_CSE301.pdf` hai lần → F5. Đúng: thứ tự mới được giữ.
- Bấm bút chì ở tệp `.docx`, đổi tên thành `Bài tập tham khảo: API đăng nhập` → Lưu → F5. Đúng: tên mới được giữ; hộp thoại sửa không có ô đổi liên kết, chỉ hiện tên tệp.
- Bấm **Tải xuống** tệp `.txt`. Đúng: tải về đúng tệp, mở ra thấy "Ghi chú ôn tập CSE301".
- Xóa liên kết MDN → xác nhận → F5. Đúng: liên kết biến mất.

Đăng xuất GV001.

---

## Vai 4: Phân quyền giữa các vai trò

**13. Mỗi vai trò chỉ làm được việc của mình**

- Đăng nhập `GV002` → Bài học & học liệu → **Soạn bài** "Thiết kế RESTful API" → đổi tên → **Lưu bản nháp**. Đúng: hiện "Bạn không phụ trách lớp CSE301.01." và tên bài quay về như cũ.
- Đăng nhập `TN001`. Đúng: vào workspace Trưởng nhóm HP, thấy các lớp CSE301 mình phụ trách.
- Đăng nhập `TK001`. Đúng: vào workspace Trưởng khoa, chỉ xem, không có chức năng sửa bài học.
- Đăng nhập `GV103` / `12345678` (người được gán Trưởng khoa ở mục 4), đổi mật khẩu lần đầu. Đúng: vào workspace **Trưởng khoa**, không phải Giảng viên.
- Đang đăng nhập Sinh viên, gõ địa chỉ `http://127.0.0.1:5173/giang-vien/tong-quan`. Đúng: bị đưa về trang của sinh viên.

**13b. Học phần mới tạo hiện đúng cho người được phân công**

- Đăng nhập `GV101` / `12345678`, đổi mật khẩu lần đầu → **Lớp giảng dạy**. Đúng: thấy học phần **CSE999** tạo ở mục 5; không thấy CSE301 vì không được phân công.
- Bấm vào CSE999. Đúng: trang chi tiết ghi "Chưa có bài học", khung **Lớp học phần** có CSE999.01.
- **Bài học & học liệu** → **Tạo bài học**: ô **Lớp học phần** chỉ có `CSE999.01` → tên `Bài mở đầu CSE999` → Lưu → F5. Đúng: bài được lưu, dòng bài ghi CSE999.01; danh sách không có bài của lớp CSE301.
- Đăng nhập `GV001` → **Lớp giảng dạy**. Đúng: không thấy CSE999.
- Đăng nhập `TN001` → **Tổng quan** → ô **Học phần**. Đúng: có CSE999; chọn nó thấy lớp CSE999.01 của GV101.

---

## Vai 5: Sinh viên (`23110149`, cửa sổ ẩn danh)

**14. Xem và tải tài liệu tham khảo (UC-B08)**

- Vào **Tài liệu tham khảo**. Đúng: thấy các tệp giảng viên tải ở mục 12, đúng thứ tự đã sắp xếp; không có nút thêm, sửa, xóa hay di chuyển.
- **Tải xuống** "Bài tập tham khảo: API đăng nhập". Đúng: tải về `15_bai-tap-tham-khao.docx`, mở bằng Word được.
- Gõ `HTTP` vào ô tìm kiếm. Đúng: chỉ còn các tài liệu có chữ HTTP.

**15. Câu hỏi chưa duyệt không lộ ra cho sinh viên**

- (Cửa sổ GV001) Vào Ngân hàng câu hỏi, chọn bài "Thiết kế RESTful API" → **Import Excel/CSV** → `3-cau-hoi/11_cau-hoi_HOP-LE.csv`, **không duyệt**. Đúng: thêm 2 câu từ file CSV, trạng thái Chờ giảng viên duyệt.
- (Cửa sổ GV001) Vào **Phiên tự học** → **Công bố** một phiên đang nháp của bài "Thiết kế RESTful API". Đúng: báo "Cần duyệt câu hỏi của bài học trước khi công bố phiên".
- (Cửa sổ SV) Bấm F12 → tab **Network** → F5 → bấm dòng `bootstrap` → tab Response → Ctrl+F tìm `Header Authorization`. Đúng: không tìm thấy, tức là sinh viên không nhận được câu chưa duyệt.

**16. Chat AI dùng PDF vừa tải lên**

- Vào **Trợ lý AI**, hỏi `JWT gồm mấy phần?`. Đúng: câu trả lời trích từ tài liệu "12_bai-giang_Xac-thuc-JWT…" (header, payload, signature).
- Hỏi `Thời tiết hôm nay thế nào?`. Đúng: báo không có học liệu phù hợp, gợi ý hỏi giảng viên.

Chưa có khóa AI thì câu trả lời là đoạn trích nguyên văn từ tài liệu; có khóa thì là câu trả lời diễn giải có dẫn nguồn.

**17. Gửi phản hồi kèm ảnh (UC-E01, UC-E02)**

Vào **Phản hồi & hỗ trợ** → **Gửi phản hồi**, chọn Lớp, Loại vấn đề, Bài học và nhập mô tả.

- Đính kèm `6-phan-hoi/22_KHONG-PHAI-ANH.txt`. Đúng: báo "Chỉ chấp nhận tệp hình ảnh".
- Đính kèm `6-phan-hoi/21_anh-QUA-5MB.png`. Đúng: báo "Tổng dung lượng ảnh không được vượt quá 5 MB".
- Đính kèm `19_anh-minh-chung-1.png` và `20_anh-minh-chung-2.png` → Gửi. Đúng: phản hồi hiện trong lịch sử, trạng thái **Chờ xử lý**.
- (Cửa sổ GV001) Vào **Phản hồi & hỗ trợ** → mở phản hồi vừa gửi → xem 2 ảnh → nhập **Trả lời sinh viên** → **Trả lời & đánh dấu đã xử lý**. Đúng: trạng thái chuyển sang **Đã xử lý**.
- (Cửa sổ SV) Bấm F5. Đúng: thấy câu trả lời của giảng viên, trạng thái Đã xử lý.

---

## Khi một bước không đạt

Gửi cho Claude:

1. Số mục và bước, ví dụ "mục 10, bước 3".
2. Tài khoản đang dùng.
3. Đã bấm gì và màn hình hiện gì (ảnh chụp càng tốt).

Muốn làm lại từ đầu: đóng web, xóa `lms-backend\data` và `lms-backend\private_media`, rồi chạy `start-test.cmd`.

## Giới hạn đã biết (không phải lỗi)

- Mỗi tài khoản chỉ có một vai trò: gán Trưởng khoa cho GV103 nghĩa là GV103 không còn là Giảng viên.
- Bài học mới tạo chưa có màn học riêng cho sinh viên; trang học của sinh viên hiện vẫn cố định bài "Thiết kế RESTful API".
- Thời lượng video YouTube (BR-08: không quá 6–10 phút) chưa được kiểm tra.
