# Kịch bản test liên vai trò: toàn hệ thống (Phase 1 → 7)

Mỗi luồng là **một tính năng đi qua tất cả các vai trò liên quan**: một vai trò thao tác, sau đó kiểm tra ngay trên màn của các vai trò khác xem dữ liệu đã đến đúng người và đúng chỗ chưa.

Các luồng **nối tiếp nhau**: dữ liệu tạo ở luồng trước được dùng ở luồng sau, nên hãy làm theo thứ tự. Hệ thống bắt đầu **trống hoàn toàn** (chỉ có tài khoản).

---

## 0. Chuẩn bị

### 0.1 Dữ liệu sạch

Dữ liệu đã được reset: không còn học phần, lớp, bài học, câu hỏi, phiên, bài tập, điểm, phản hồi hay thông báo nào; **các tài khoản được giữ nguyên**. Lần sau muốn làm lại từ đầu, nhấp đúp **`reset-du-lieu.cmd`** ở thư mục gốc dự án. Script tự sao lưu dữ liệu cũ vào `lms-backend\backup-truoc-reset\` rồi xóa dữ liệu, chỉ giữ tài khoản.

### 0.2 Tài khoản dùng trong kịch bản (mật khẩu mặc định `12345678`)

| Ký hiệu | Mã | Vai trò | Dùng để |
| --- | --- | --- | --- |
| **AD** | `AD001` | Admin | Tạo tài khoản, học phần, lớp; nhắc hạn |
| **GV** | `GV001` | Giảng viên | GV được phân công lớp mới |
| **GV-khác** | `GV002` | Giảng viên | GV **không** được phân công, dùng để kiểm tra phân quyền |
| **TN** | `TN001` | Trưởng nhóm HP | TNHP được phân công lớp mới |
| **TK** | `TK001` | Trưởng khoa | Xem toàn khoa |
| **SV** | `23110149` | Sinh viên | SV chính, được ghi danh vào lớp mới |
| **SV2** | `SV2601` | Sinh viên | SV thứ hai trong lớp (so sánh đề ngẫu nhiên, lớp trực tiếp) |
| **SV-ngoài** | `SV2606` | Sinh viên | SV **không** thuộc lớp mới, dùng để kiểm tra phân quyền |

Nếu không nhớ mật khẩu của SV2 hoặc SV-ngoài: vào AD → Tài khoản → chọn tài khoản → **Reset mật khẩu**. Mật khẩu về `12345678` và hệ thống bắt đổi ở lần đăng nhập đầu.

### 0.3 Mở nhiều vai trò cùng lúc

Mỗi tab trình duyệt giữ một phiên đăng nhập riêng. Để dễ theo dõi, hãy dùng **3 cửa sổ**:

- **Cửa sổ A** (Chrome thường): AD, sau đó GV.
- **Cửa sổ B** (Chrome ẩn danh, Ctrl+Shift+N): SV.
- **Cửa sổ C** (trình duyệt khác, ví dụ Edge): TN, TK, GV-khác, SV2, SV-ngoài. Cần đổi tài khoản thì đăng xuất rồi đăng nhập lại.

Quy ước: **[AD]**, **[GV]**, **[SV]**… là "đăng nhập bằng vai trò đó". Mẹo: sau mỗi thao tác, ở các cửa sổ khác bấm **F5** để lấy dữ liệu mới. Khi server từ chối một thao tác, sẽ hiện thông báo lỗi và dữ liệu quay về như cũ; ở các bước "bị chặn", đó là kết quả đúng.

### 0.4 Kiểm tra trạng thái trống (trước khi bắt đầu)

- **[GV]** Tổng quan. Đúng: ghi "Chưa được phân công lớp"; **Lớp giảng dạy** ghi "Bạn chưa được Admin phân công phụ trách lớp nào"; không có học phần mẫu nào.
- **[SV]** Tổng quan. Đúng: "Chưa có phiên tự học đang mở", Khóa học đang học `00`, Điểm bài tập `—`.
- **[TN]** Tổng quan. Đúng: không có học phần nào trong ô Học phần.
- **[TK]** Tổng quan. Đúng: tổng số học phần, lớp, SV đều bằng 0.

---

## Luồng 1. Tài khoản và phân quyền (UC-G04, UC-G05)

**1.1 [AD] Import sinh viên mới**
- Tài khoản → **Import tài khoản** → Loại: Sinh viên → `1-tai-khoan/02_sinh-vien_CO-LOI.xlsx`. Đúng: 5/6 dòng báo lỗi, nút xác nhận bị khóa, không tài khoản nào được tạo.
- Chọn `1-tai-khoan/00_sinh-vien_MOI_3-nguoi.xlsx` → **Xác nhận nhập 3 tài khoản**. Đúng: tạo SV3001–SV3003, trạng thái **Cần đổi mật khẩu**.
- *Kiểm tra chéo:*
  - **[Cửa sổ C] đăng nhập `SV3001` / `12345678`.** Đúng: bị chuyển sang **Đổi mật khẩu lần đầu**; đặt `1234` bị từ chối; đặt `Matkhau@2026` thì vào được trang SV, và trang SV trống vì chưa thuộc lớp nào.

**1.2 [AD] Import giảng viên và gán vai trò**
- Loại: Giảng viên → `1-tai-khoan/04_giang-vien_THIEU-KHOA.xlsx`. Đúng: báo **Thiếu khoa**, không cho nhập.
- Chọn `1-tai-khoan/00_giang-vien_MOI_1-nguoi.xlsx` → xác nhận. Đúng: tạo GV301 kèm khoa.
- Mở **GV301** → Vai trò **Trưởng khoa** → **Lưu vai trò**. Mở **SV3001**. Đúng: không có ô đổi vai trò (chỉ GV mới được gán vai trò quản lý).
- *Kiểm tra chéo:*
  - **[Cửa sổ C] đăng nhập `GV301`**, đổi mật khẩu lần đầu. Đúng: vào **workspace Trưởng khoa** (không phải Giảng viên).

**1.3 [AD] Vô hiệu hóa và reset**
- Mở **SV3002** → **Vô hiệu hoá** → **Xác nhận**.
- *Kiểm tra chéo:*
  - **[Cửa sổ C] đăng nhập `SV3002`.** Đúng: báo sai thông tin, không vào được.
- [AD] **Kích hoạt lại** SV3002, rồi **Reset mật khẩu** SV3001.
- *Kiểm tra chéo:*
  - **[Cửa sổ C] `SV3002` / `12345678`.** Đúng: đăng nhập được, bị yêu cầu đổi mật khẩu lần đầu.
  - **`SV3001` / `Matkhau@2026`** (mật khẩu cũ). Đúng: không đăng nhập được. Với `12345678` thì được và bị bắt đổi mật khẩu.

---

## Luồng 2. Học phần, lớp và ghi danh (UC-G06)

**2.1 [AD] Tạo học phần và lớp**
- Học phần & lớp → **Tạo học phần**: Mã `CSE310`, Tên `Kiểm thử phần mềm`, Khoa `Khoa học và Kỹ thuật máy tính` → **Lưu học phần**.
- Trong CSE310 → **Tạo lớp**: Tên `CSE310.01`, Học kỳ I, Năm học `2026-2027`, Đợt `1`, **Giảng viên `GV001`**, **Trưởng nhóm HP `TN001`** → **Lưu lớp**.
- Tạo lại một lớp y hệt. Đúng: báo lớp đã tồn tại.
- *Kiểm tra chéo:*
  - **[GV] F5 → Lớp giảng dạy.** Đúng: xuất hiện **CSE310 · Kiểm thử phần mềm**. Tổng quan hiện khối "Lớp phụ trách · CSE310.01 · 0 sinh viên". Bấm vào học phần: trang chi tiết ghi "Chưa có bài học", khung **Lớp học phần** có CSE310.01.
  - **[GV-khác `GV002`] Lớp giảng dạy.** Đúng: **không** thấy CSE310.
  - **[TN] F5 → Tổng quan.** Đúng: ô **Học phần** có **CSE310**, danh sách lớp có CSE310.01 của GV001.
  - **[TK] Học phần.** Đúng: có CSE310 với 1 lớp; bấm vào thấy lớp CSE310.01, chưa có SV.
  - **[SV] Khóa học của tôi.** Đúng: vẫn **chưa** thấy CSE310 (chưa được ghi danh).

**2.2 [AD] Ghi danh sinh viên**
- Mở CSE310 → lớp CSE310.01 → **Mở lớp** → **Import sinh viên vào lớp** → `2-ghi-danh/08_ghi-danh_CO-LOI.xlsx`. Đúng: SV9999 và GV001 báo "Không có tài khoản SV đang hoạt động", có dòng trùng tệp, nút xác nhận bị khóa.
- Chọn `2-ghi-danh/07_ghi-danh_HOP-LE_6-sv.xlsx` → **Xác nhận thêm vào lớp**. Đúng: lớp có 6 SV (23110149, SV2601–SV2605).
- *Kiểm tra chéo:*
  - **[SV] F5 → Khóa học của tôi.** Đúng: thấy **CSE310** với **6 sinh viên** (sĩ số thật của lớp, dù SV không xem được danh sách bạn cùng lớp); Tổng quan ghi Khóa học đang học `01`.
  - **[TN] F5 → Tổng quan.** Đúng: cột **Lớp học** của bảng "Các lớp cùng học phần" ghi **CSE310.01** (tên lớp), không phải một dãy mã dài.
  - **[SV-ngoài `SV2606`] Khóa học của tôi.** Đúng: **không** thấy CSE310.
  - **[GV] Theo dõi học tập**, chọn lớp CSE310.01. Đúng: bảng có đúng 6 SV, tiến độ 0%.
  - **[TK] Học phần → CSE310 → CSE310.01.** Đúng: 6 SV.

---

## Luồng 3. Bài học, slide và câu hỏi (UC-G02, UC-A01)

**3.1 [GV] Tạo bài học**
- **Bài học & học liệu** → **Tạo bài học**: ô **Lớp học phần** chỉ có `CSE310.01` → tên `Bài 1. Xác thực và JWT` → **Lưu bài học** → F5. Đúng: bài ở trạng thái **Bản nháp**, dòng bài ghi CSE310.01.
- *Kiểm tra chéo:*
  - **[GV-khác] Bài học & học liệu.** Đúng: **không** thấy bài này.
  - **[SV] CSE310 → chi tiết.** Đúng: ghi "Giảng viên chưa công bố bài học" (bản nháp không hiện với SV).

**3.2 [GV] Soạn nội dung**
- **Soạn bài**: ô **Tuần học** chọn `Tuần 1` (tuần trong học kỳ dạy bài này, từ 1 đến 15). **Thêm trang** đến khi có 4 trang. Không cần bấm **Lưu bản nháp**: mọi thay đổi tự lưu sau khoảng 1 giây.
- Upload `4-bai-giang/13_GIA-MAO-khong-phai-pdf.pdf`. Đúng: báo không phải PDF hợp lệ. Upload `4-bai-giang/12_bai-giang_Xac-thuc-JWT_4-trang.pdf`. Đúng: hiện xem trước, báo "Đã lưu PDF vào bài học…", ô upload ghi "Đã lưu: 12_bai-giang_Xac-thuc-JWT_4-trang.pdf".
- Tab Video: `https://vimeo.com/123456`. Đúng: bị từ chối. `https://youtu.be/dQw4w9WgXcQ`. Đúng: được nhận.
- Tab **Câu hỏi** → **Soạn & duyệt câu hỏi** → ở Ngân hàng câu hỏi bấm **← Quay lại soạn bài "Bài 1. Xác thực và JWT"**. Đúng: về lại màn soạn bài; tuần học, số trang, link YouTube và PDF (cả phần xem trước) vẫn còn nguyên, dù không bấm lưu.
- *Kiểm tra chéo:*
  - **[GV] Bài học & học liệu.** Đúng: ô số đầu dòng của bài ghi **T1** (tuần 1).

**3.3 [GV] Ngân hàng câu hỏi**
- **Soạn & duyệt câu hỏi** (ô Bài học là "Bài 1. Xác thực và JWT") → **Import Excel/CSV** → `3-cau-hoi/10_cau-hoi_CO-LOI.xlsx`. Đúng: báo lỗi, không câu nào được thêm.
- Import `3-cau-hoi/09_cau-hoi_HOP-LE_4-cau.xlsx`. Đúng: 4 câu **Chờ giảng viên duyệt**.
- Quay lại Soạn bài → **Công bố**. Đúng: bị chặn vì còn câu chờ duyệt.
- Duyệt cả 4 câu → **Công bố**. Đúng: bài **Đã công bố**.
- *Kiểm tra chéo:*
  - **[SV] F5 → CSE310.** Đúng: bài "Tuần 1 · Bài 1. Xác thực và JWT" hiện với nhãn **Đã công bố**.
  - **[SV] F12 → Network → `bootstrap` → Response, tìm `JWT gồm mấy phần`.** Đúng: câu hỏi có mặt nhưng **không có** `"correct"`, tức là trình duyệt SV không biết trước đáp án.

---

## Luồng 4. Phiên tự học: từ cấu hình đến kết quả (UC-A02, UC-B01–B03)

**4.1 [GV] Tạo phiên**
- **Phiên tự học** → **Tạo phiên tự học**: tên `Tự học tuần 1`, bài **Bài 1. Xác thực và JWT**, Bắt đầu hôm nay, Kết thúc tuần sau → Lưu → **Công bố**.
- *Kiểm tra chéo:*
  - **[SV] F5 → Phiên tự học.** Đúng: thấy "Tự học tuần 1 · CSE310 · Bài 1. Xác thực và JWT · 4 trang · 4 câu hỏi", trạng thái **Đang mở**. Tổng quan có khối phiên đang mở và mục **Việc cần hoàn thành**.
  - **[SV-ngoài] Phiên tự học.** Đúng: **không** thấy phiên này.

**4.2 [SV] Học bài**
- **Bắt đầu học** → trang 1. Đúng: khung giữa hiện **chính file PDF GV đã upload** ở đúng trang 1; nút **Tải PDF** tải về đúng file đó. Nút **Trang tiếp theo** bị khóa cho tới khi trả lời câu hỏi (BR-09).
- Chọn đáp án **sai** → **Xác nhận đáp án**. Đúng: hiện giải thích, không đổi được đáp án.
- Học tới trang 2 rồi dừng.
- *Kiểm tra chéo:*
  - **[GV] Theo dõi học tập** (CSE310.01). Đúng: dòng 23110149 có tiến độ khoảng 50%; khung **Phân tích học tập** có trang 1 với 1 câu trả lời sai.
  - **[TK] CSE310 → CSE310.01.** Đúng: tiến độ của 23110149 khớp với màn GV.
- [SV] Học hết 4 trang → **Hoàn thành phiên**. Đúng: phiên ghi **Đã hoàn thành**.
- *Kiểm tra chéo:*
  - **[GV] Theo dõi học tập.** Đúng: 23110149 tiến độ 100%.

**4.3 [GV] Gia hạn**
- Mở cài đặt phiên. Đúng: hộp thoại **Gia hạn phiên tự học**, tên và giờ bắt đầu bị khóa. Dời giờ kết thúc sớm hơn thì bị chặn; dời muộn thêm 2 ngày thì lưu được.
- *Kiểm tra chéo:*
  - **[SV2] Phiên tự học.** Đúng: hạn mới hiện đúng.

---

## Luồng 5. Chat AI và báo lỗi câu trả lời (UC-B04)

**5.1 [SV] Hỏi về học liệu**
- **Trợ lý AI** → học phần **CSE310** → hỏi `JWT gồm mấy phần?`. Đúng: trả lời trích từ PDF đã upload ở 3.2 (header, payload, signature), có nút nguồn **Học liệu · Trang 2**.
- Hỏi `Thời tiết hôm nay thế nào?`. Đúng: báo chưa có học liệu phù hợp, gợi ý hỏi giảng viên.
- Ở câu trả lời đầu, bấm 🚩 **Báo lỗi phản hồi**.
- *Kiểm tra chéo:*
  - **[GV] Phản hồi & hỗ trợ.** Đúng: có phản hồi mới loại **Chat AI** chứa câu hỏi và câu trả lời của SV.
  - **[GV] Theo dõi học tập.** Đúng: cột **Tương tác** của 23110149 có "2 câu hỏi AI".
  - **[SV2] Trợ lý AI.** Đúng: **không** thấy lịch sử chat của 23110149.

---

## Luồng 6. Tài liệu tham khảo (UC-A04, UC-B08)

**6.1 [GV] Thêm tài liệu**
- **Tài liệu tham khảo** → **Tải tệp lên** `5-tai-lieu/14_de-cuong_CSE301.pdf` và `15_bai-tap-tham-khao.docx`; **Thêm liên kết** `https://developer.mozilla.org/vi/docs/Web/HTTP/Status`. Thử `18_KHONG-HOP-LE.exe`. Đúng: bị từ chối.
- Đưa file .docx lên đầu danh sách.
- *Kiểm tra chéo:*
  - **[SV] Tài liệu tham khảo.** Đúng: thấy 3 tài liệu **đúng thứ tự GV sắp**, không có nút sửa/xóa; **Tải xuống** file .docx mở được bằng Word; liên kết mở tab mới.

---

## Luồng 7. Hỏi trên lớp (UC-C01–C03)

**7.1 [GV] Mở phiên**
- **Lớp học trực tiếp** → Lớp `CSE310.01`, Câu hỏi "JWT gồm mấy phần…" → **Bắt đầu phiên**. Đúng: mã 6 chữ số, mã QR, đếm ngược 45 giây.

**7.2 Sinh viên tham gia**
- **[SV]** Lớp học trực tiếp → nhập mã sai. Đúng: báo "Mã phiên không đúng". Nhập đúng mã. Đúng: vào màn trả lời.
- **[SV-ngoài]** Nhập đúng mã. Đúng: báo "Phiên này dành cho lớp CSE310.01".
- **[SV2]** Nhập đúng mã. Đúng: vào được. Phía **[GV]**: "2 sinh viên đã tham gia".
- **[SV]** chọn đáp án → **Xác nhận**. Đúng: "Đã gửi"; vẫn chưa thấy đáp án đúng vì SV2 chưa trả lời.
- **[SV2]** trả lời. Đúng: cả hai SV thấy đáp án đúng được tô xanh kèm giải thích; **[GV]** thấy tỷ lệ đúng, biểu đồ thanh cho từng đáp án và "2 sinh viên trả lời".
- **[GV]** chọn câu khác → **Đổi câu hỏi**. Đúng: màn của **cả hai SV tự đổi** sang câu mới trong khoảng 2 giây, không phải nhập lại mã.
- **[GV]** **Kết thúc phiên** → **Bắt đầu phiên** lại. Đúng: mã mới khác mã cũ; SV nhập mã cũ thì bị từ chối.

**7.3 [GV] Xem lại kết quả**
- Kéo xuống khung **Kết quả các phiên hỏi trên lớp** (ngay trên màn Hỏi trên lớp). Đúng: có phiên "CSE310.01 · Phiên lúc …" gồm các câu đã chiếu. Mỗi câu ghi: số đúng/số tham gia và %, đáp án đúng, "x/y sinh viên đã trả lời", biểu đồ từng đáp án.
- Bấm **Xem từng sinh viên**. Đúng: bảng tên, mã, đáp án đã chọn và **Đúng / Sai / Không trả lời** của 23110149 và SV2601. Câu đã đổi sang câu khác và phiên đã kết thúc **vẫn còn** kết quả.
- F5 lại trang. Đúng: kết quả vẫn còn (được lưu trên server).

---

## Luồng 8. Bài tập: tạo, làm, chấm (UC-A03, UC-D01, UC-D02, BR-02)

**8.1 [GV] Tạo đề**
- **Bài tập & kiểm tra** → **Tạo bài tập**: tên `Kiểm tra giữa kỳ`, 10 phút, 2 lượt; tick **Không cho dán nội dung** và **Đánh dấu ngẫu nhiên hóa**.
- Cấu trúc đề:
  - 3 câu trắc nghiệm **Lấy từ ngân hàng câu hỏi**.
  - 1 câu điền trống "Method tạo mới?", đáp án chấp nhận `POST|post`.
  - 1 câu tự luận "Thiết kế API mượn sách", tiêu chí `Có endpoint = loans|borrow; Dùng POST = post; Trả 201 = 201|created`.
- **Lưu bài tập nháp**.
- *Kiểm tra chéo:*
  - **[SV] Bài tập.** Đúng: **chưa** thấy bài.
- [GV] **Công bố**.
- *Kiểm tra chéo:*
  - **[SV] F5 → Bài tập.** Đúng: thấy "Kiểm tra giữa kỳ" ghi **Tính điểm**; Tổng quan có mục này trong **Việc cần hoàn thành**.

**8.2 [SV] và [SV2] làm bài**
- **[SV]** **Bắt đầu làm bài**. Đúng: đồng hồ 10 phút; dán chữ vào ô tự luận bị chặn. Ghi lại thứ tự câu.
- **[SV2]** mở cùng bài. Đúng: **thứ tự câu khác** với SV.
- **[SV]** làm 1 câu trắc nghiệm **sai**, điền `POST`, tự luận `Tạo POST /api/loans, trả về 201 Created.` → **Nộp bài**. Đúng: kết quả tạm tính, tự luận ghi chờ chấm. Ở câu sai bấm **AI giải thích lỗi sai**. Đúng: có giải thích kèm nguồn trang.
- *Kiểm tra chéo:*
  - **[GV] Theo dõi học tập.** Đúng: 23110149 có điểm bài tập, **% đúng** và **thời gian nộp**.
  - **[GV] chuông thông báo / Tổng quan.** Đúng: mục "Bài nộp cần chấm" báo có bài chờ duyệt.

**8.3 [GV] Chấm và công bố**
- **Bài tập & kiểm tra** → **Chấm bài** → bài của 23110149 → **Gợi ý chấm theo tiêu chí**. Đúng: tự luận đề xuất 3/3. Nhập nhận xét → **Duyệt & công bố điểm**.
- *Kiểm tra chéo:*
  - **[SV] F5 → Kết quả bài tập.** Đúng: "Điểm đã được giảng viên duyệt và công bố", thấy nhận xét; thông báo "Điểm bài tập đã được giảng viên công bố" xuất hiện ở chuông.
  - **[SV2] Kết quả.** Đúng: SV2 không thấy điểm hay bài làm của SV.

---

## Luồng 9. Phúc khảo (UC-D03, UC-D04)

- **[SV]** Ở một câu → **Yêu cầu phúc khảo**, lý do đầy đủ → **Gửi yêu cầu**. Thử bắt đầu lượt 2. Đúng: bị chặn vì đang chờ phúc khảo.
- *Kiểm tra chéo:*
  - **[GV] chuông.** Đúng: "Có yêu cầu phúc khảo mới". **Yêu cầu phúc khảo** hiện SV, bài, câu hỏi, bài làm, điểm và lý do. Vì đề ngẫu nhiên hóa, kiểm tra câu GV thấy **đúng là câu SV đã chọn**.
- **[GV]** **Chấm lại** với điểm mới → lưu.
- *Kiểm tra chéo:*
  - **[SV] F5 → Kết quả.** Đúng: câu ghi **Đã chấm lại**, điểm tổng tăng; giờ bắt đầu lượt 2 được.
  - **[GV] Bảng điểm**, lớp CSE310.01. Đúng: Điểm TB bài tập của 23110149 đã cập nhật.

---

## Luồng 10. Điểm số (UC-D05, UC-G01)

- **[SV] Kết quả học tập** → CSE310.01. Đúng: **Điểm tự học** = 10 (1/1 phiên đúng hạn từ luồng 4); **Điểm TB bài tập** bằng điểm sau phúc khảo; chi tiết có phiên "đúng hạn" và bài tập kèm điểm.
- **[GV] Bảng điểm** → CSE310.01. Đúng: 6 dòng SV với STT, Mã SV, **Họ đệm**, **Tên**, Điểm tự học, Điểm TB bài tập; số liệu của 23110149 khớp màn SV. **Xuất Excel** tải được file .xlsx có cùng các cột.
- **[TK] CSE310 → CSE310.01.** Đúng: tiến độ và điểm của 23110149 khớp; trang **Cảnh báo** liệt kê các SV chưa học (tiến độ 0%).

---

## Luồng 11. Nhắc hạn tự động (UC-G03)

- **[AD] Nhắc hạn học tập** → đặt **Thời điểm kiểm tra** khoảng 20 giờ trước hạn của "Kiểm tra giữa kỳ" → **Quét hạn trong 24 giờ**. Đúng: danh sách có các SV **chưa nộp** bài (SV2601–SV2605), **không có** 23110149 (đã nộp). Xem trước email có tên SV, lớp, bài, hạn và tiến độ. Quét lại: không tạo trùng.
- *Kiểm tra chéo:*
  - **[SV2] chuông thông báo.** Đúng: có thông báo nhắc "… sắp đến hạn lúc …".
  - Chưa cấu hình SMTP thì kênh email ghi **skipped**; đó là hành vi đúng.

---

## Luồng 12. Phản hồi kèm ảnh (UC-E01, UC-E02)

- **[SV] Phản hồi & hỗ trợ** → **Gửi phản hồi**: Lớp CSE310, **Bài học** (chỉ có bài của CSE310), loại Bài giảng, mô tả. Đính kèm `6-phan-hoi/22_KHONG-PHAI-ANH.txt`. Đúng: bị từ chối. `21_anh-QUA-5MB.png`. Đúng: báo vượt 5 MB. `19_anh-minh-chung-1.png` + `20_anh-minh-chung-2.png` → Gửi.
- *Kiểm tra chéo:*
  - **[GV] ở trình duyệt khác với SV** → Phản hồi & hỗ trợ → mở phản hồi. Đúng: **xem được 2 ảnh**, chứng tỏ ảnh lưu trên server. Trả lời → **Trả lời & đánh dấu đã xử lý**.
  - **[SV] F5.** Đúng: thấy câu trả lời, trạng thái **Đã xử lý**.
  - **[GV] Theo dõi học tập.** Đúng: cột Tương tác của 23110149 tăng số phản hồi.
  - **[SV2] Phản hồi & hỗ trợ.** Đúng: không thấy phản hồi của SV.

---

## Luồng 13. Dashboard và gợi ý buổi học (UC-F01)

- **[GV] Theo dõi học tập** → CSE310.01. Đúng: đủ 6 SV với tiến độ, điểm, % đúng, thời gian nộp, tương tác; lọc **Cần hỗ trợ** chỉ còn SV tiến độ dưới 50% hoặc điểm dưới 5; **Gợi ý buổi học** → **Tạo gợi ý** có chủ đề trang 1 (câu sai ở luồng 4).
- **[GV] Tổng quan.** Đúng: số lớp phụ trách 1, số SV 6, mục "Sinh viên cần hỗ trợ" khớp màn Theo dõi.
- **[TK] Tổng quan.** Đúng: 1 học phần, 1 lớp, 6 SV, mức hoàn thành tính theo dữ liệu thật; drill-down CSE310 → CSE310.01 khớp màn GV.

---

## Luồng 14. Chuẩn hóa học liệu (UC-A05, BR-06, BR-07)

**14.1 [TN] Tạo và rà soát học liệu của lớp**
- **Học liệu** → **Tạo học liệu**: lớp CSE310.01, loại **Slides**, tiêu đề và nội dung bất kỳ → Lưu. Tạo thêm một **Quiz** và một **Bài tập**.
- **Chuẩn hoá** → CSE310 → CSE310.01. Đúng: 3 học liệu ở mức **M0 · Chưa rà soát**; nút **Hoàn thành chuẩn hoá** bị khóa.
- Mở học liệu Slides → gửi yêu cầu điều chỉnh có nội dung cụ thể. Đúng: mức **M2 · Cần điều chỉnh**.
- *Kiểm tra chéo:*
  - **[GV] Bài học & học liệu.** Đúng: khung **Yêu cầu từ Trưởng nhóm HP** hiện yêu cầu của lớp CSE310.01 → **Chỉnh sửa và phản hồi** → lưu.
  - **[GV-khác] Bài học & học liệu.** Đúng: **không** thấy yêu cầu này.
  - **[TN] F5.** Đúng: Slides về **M1 · Đang xử lý**, thấy phản hồi của GV.

**14.2 [TN] Đạt chuẩn và hoàn thành**
- Duyệt **M3 · Đạt chuẩn** cho cả Slides, Quiz, Bài tập → **Hoàn thành chuẩn hoá**. Đúng: lớp ghi hoàn thành. Sửa lại một học liệu. Đúng: dấu hoàn thành mất, phải duyệt lại.
- **So sánh lớp**. Có thể so sánh khi học phần có từ 2 lớp trở lên (tạo thêm CSE310.02 ở luồng 2 nếu muốn thử).

---

## Khi một bước không đạt

Gửi cho Claude: **số luồng và bước** (ví dụ "Luồng 7, bước 7.2, dòng SV2"), tài khoản, đã bấm gì, màn hình hiện gì (ảnh chụp càng tốt).

## Giới hạn đã biết (không phải lỗi)

- **Mỗi tài khoản chỉ có một vai trò**: GV301 được gán Trưởng khoa thì không còn là Giảng viên.
- **Bài tập, tài liệu tham khảo và thông báo chung chưa gắn theo lớp**: mọi SV thấy mọi bài tập đã công bố, mọi tài liệu và mọi thông báo gửi SV.
- **Học liệu chuẩn hóa của TNHP là kho riêng**, chưa liên kết với bài học hay bài tập GV soạn.
- **Mỗi lúc chỉ chạy được một phiên hỏi trên lớp** cho toàn hệ thống.
- **Trang học của bài mới chỉ hiện tên trang và phần giải thích**, chưa hiển thị ảnh slide.
- **Không có khóa AI thì các tính năng AI dùng phương án dự phòng**: chat trích đoạn học liệu, chấm theo tiêu chí, không sinh câu hỏi/bài giảng AI.
