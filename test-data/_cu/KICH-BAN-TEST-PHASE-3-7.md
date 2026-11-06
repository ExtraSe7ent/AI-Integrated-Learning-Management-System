# Kịch bản test thủ công: Phase 3 → Phase 7

Web: http://127.0.0.1:5173 · Mật khẩu mặc định: `12345678` · File test nằm trong thư mục `test-data`.

**Chuẩn bị**
- Nên chạy trên dữ liệu mẫu sạch: tắt web, xóa `lms-backend\data` và `lms-backend\private_media`, rồi chạy `start-test.cmd`.
- Đăng nhập `AD001`, import `1-tai-khoan/01_sinh-vien_HOP-LE_10-nguoi.xlsx` (tạo SV2601–SV2610). Sau đó đăng nhập `SV2601` một lần để đổi mật khẩu, ví dụ thành `Matkhau@2026`. Một số bước cần SV thứ hai (SV2601, **không** thuộc lớp CSE301.01).
- Dùng **cửa sổ thường** cho Giảng viên/Admin, **cửa sổ ẩn danh** (Ctrl+Shift+N) cho Sinh viên.
- Mẹo: sau mỗi thao tác chờ khoảng 1 giây rồi bấm **F5**; dữ liệu còn nghĩa là server đã lưu. Ở các bước "bị chặn", hiện thông báo lỗi chính là kết quả đúng.

---

## PHASE 3: Tự học trước lớp (Sinh viên `23110149`)

### 1. Danh sách phiên tự học (UC-B01)

- Vào **Phiên tự học**. Đúng: mỗi phiên ghi tên bài học, số trang, số câu hỏi của **chính bài đó**, hạn nộp và trạng thái (Đang mở / Chưa mở / Đã hết hạn / Đã hoàn thành).
- Phiên "RESTful API: từ nguyên lý đến thực hành" → **Bắt đầu học**. Đúng: mở trang học, thanh tiến độ "0/4 trang hoàn thành".

### 2. Xem slide và quiz bắt buộc (UC-B02, UC-B03, BR-09)

- Ở trang 1, chưa chọn đáp án. Đúng: nút **Trang tiếp theo** bị khóa.
- (Kiểm tra bảo mật) Bấm F12 → tab **Network** → F5 → mở dòng `bootstrap` → tab Response → Ctrl+F tìm nội dung câu hỏi trang 1. Đúng: câu hỏi **không có** trường `"correct"` và `"explanation"`, tức là trình duyệt không biết trước đáp án.
- Chọn một đáp án **sai** → **Xác nhận đáp án**. Đúng: hiện "Bạn hãy ghi nhớ đáp án này" kèm giải thích; các lựa chọn bị khóa, không đổi được đáp án (AF-1 ghi nhận câu sai).
- Bấm **Trang tiếp theo**. Đúng: sang trang 2, tiến độ 1/4.
- Bấm thẳng vào trang 4 ở thanh slide bên trái. Đúng: không vào được, phải học theo thứ tự.
- Trả lời đúng các câu còn lại, đi hết đến trang 4 → **Hoàn thành phiên**. Đúng: báo "Đã hoàn thành phiên tự học"; F5 vẫn giữ trạng thái **Hoàn thành**.
- Quay về **Phiên tự học**. Đúng: phiên ghi **Đã hoàn thành**, nút đổi thành **Xem lại** (AF-2).

### 3. Phiên hết hạn (UC-B01 AF-1, BR-01)

- (GV001) **Phiên tự học** → **Tạo phiên tự học**: tên `Phiên đã hết hạn`, bài "Thiết kế RESTful API", Bắt đầu và Kết thúc đều ở **tuần trước**, **không** tick "Cho phép học sau hạn" → Lưu → **Công bố**.
- (SV) **Phiên tự học**. Đúng: phiên ghi "Đã hết hạn · Chỉ xem lại, không ghi nhận tiến độ".
- Mở phiên. Đúng: xem được các trang, nhưng nút **Xác nhận đáp án** bị khóa và tiến độ không tăng (server cũng từ chối ghi nhận nếu gửi thẳng request).
- (GV001) Sửa phiên thành **cho phép học sau hạn**. Đúng: SV học được, nhưng phiên hoàn thành **trễ** và không cộng điểm tự học (xem mục 12).

### 4. Chat với AI (UC-B04)

- Ở trang học, mở tab **Chat AI**. Đúng: có dòng "AI có thể mắc lỗi. Hãy đối chiếu nguồn và hỏi giảng viên khi cần."
- Đang ở trang 3, hỏi `Mã trạng thái 404 nghĩa là gì?`. Đúng: trả lời về mã trạng thái, có nút **Bài giảng · Trang 3**; bấm nút đó thì nhảy tới trang 3.
- Hỏi tiếp `Mã trạng thái 201 dùng khi nào?`. Đúng: trả lời tiếp (multi-turn); lịch sử chat vẫn giữ sau F5. Có khóa AI thì có thể hỏi nối tiếp tự nhiên hơn, ví dụ `Còn 201 thì sao?`.
- Hỏi `Thời tiết hôm nay thế nào?`. Đúng: báo không có học liệu phù hợp, gợi ý hỏi giảng viên (EX-1).
- Hỏi `Giải hộ em bài kiểm tra đang làm`. Đúng: từ chối giải hộ, chỉ gợi ý tự học.
- Bấm 🚩 **Báo lỗi phản hồi** ở một câu trả lời. Đúng: (GV001) **Phản hồi & hỗ trợ** có phản hồi mới loại "Chat AI" (AF-1).

---

## PHASE 4: Tương tác trên lớp (GV `GV001` + SV `23110149`)

### 5. Chiếu câu hỏi và trả lời (UC-C01, UC-C02, UC-C03)

- (GV) **Lớp học trực tiếp** → ô **Lớp** chọn `CSE301.01`, ô **Câu hỏi** chọn một câu → **Bắt đầu phiên**. Đúng: hiện **mã phiên 6 chữ số**, **mã QR** và đồng hồ đếm ngược 45 giây.
- (SV) **Lớp học trực tiếp** → nhập một mã sai → **Tham gia phiên**. Đúng: báo "Mã phiên không đúng hoặc đã hết hạn".
- Nhập đúng mã. Đúng: vào màn trả lời có câu hỏi, 4 nút A/B/C/D và đồng hồ. Phía GV ghi "1 sinh viên đã tham gia".
- (SV) Chọn một đáp án → **Xác nhận**. Đúng: hiện **Đã gửi**. Vì cả lớp (1 SV) đã trả lời nên kết quả tự công bố: đáp án đúng được tô xanh kèm giải thích.
- (GV) Đúng: khung **Kết quả phiên** hiện tỷ lệ đúng (%), biểu đồ thanh cho từng đáp án và số SV đã trả lời.
- (GV) Chọn câu khác ở ô **Câu tiếp theo** → **Đổi câu hỏi**. Đúng: màn SV **tự đổi sang câu mới** trong khoảng 2 giây, **không cần nhập lại mã**.
- (SV) Lần này không trả lời, chờ hết 45 giây. Đúng: hiện "Hết giờ · Không trả lời" (AF-3).
- (SV) Đang trong phiên, bấm F5. Đúng: vẫn ở trong phiên, không phải nhập lại mã (EX-1).

### 6. Bảo mật phiên

- (Cửa sổ ẩn danh khác) Đăng nhập `SV2601` (không thuộc lớp CSE301.01), nhập đúng mã. Đúng: báo "Phiên này dành cho lớp CSE301.01".
- (SV `23110149`) F12 → Network → mở request `live` → Response. Đúng: **không có** trường `code`, không có đáp án của SV khác; trước khi công bố cũng không có `correct`.
- (GV) **Kết thúc phiên**, rồi **Bắt đầu phiên** lại. Đúng: **mã phiên mới khác mã cũ**; nhập mã cũ thì bị từ chối.

---

## PHASE 5: Bài tập và chấm điểm

### 7. Tạo bài tập (UC-A03, GV `GV001`)

- **Bài tập & kiểm tra** → **Tạo bài tập**: Tên `Kiểm tra REST giữa kỳ`, Thời gian làm `10` phút, Số lượt làm tối đa `2`, Thời gian mở là hôm nay, Thời gian đóng là tuần sau. Tick **Không cho dán nội dung** và **Đánh dấu ngẫu nhiên hóa**.
- Phần **Cấu trúc đề**, thêm ít nhất 5 câu:
  - 3 câu trắc nghiệm: dùng **Lấy từ ngân hàng câu hỏi**, hoặc **AI gợi ý câu hỏi** nếu có khóa AI.
  - 1 câu điền trống "Method tạo mới tài nguyên?", đáp án chấp nhận `POST|post`.
  - 1 câu tự luận "Thiết kế API mượn sách", tiêu chí `Có endpoint = loans|borrow; Dùng POST = post; Trả 201 = 201|created`.
- **Lưu bài tập nháp** → F5. Đúng: bài ở trạng thái **Bản nháp**; SV chưa nhìn thấy.
- Bấm **Công bố**. Đúng: nhãn **Đã công bố**.

### 8. Làm bài (UC-D01, SV `23110149`)

- **Bài tập** → bài vừa tạo → **Bắt đầu làm bài**. Đúng: giao diện thi có đồng hồ đếm ngược 10 phút.
- Copy một đoạn chữ bất kỳ rồi dán vào ô tự luận. Đúng: **bị chặn**, không dán được.
- Ghi lại thứ tự các câu. (Cửa sổ ẩn danh khác) Đăng nhập `SV2601` và mở cùng bài. Đúng: **thứ tự câu khác** với 23110149 (ngẫu nhiên hóa theo từng SV); F5 lại vẫn giữ đúng thứ tự cũ của mỗi người.
- (23110149) Trả lời: 1 câu trắc nghiệm **sai**, điền trống `POST`, tự luận `Tạo POST /api/loans, trả về 201 Created.` → **Nộp bài**. Đúng: sang trang **Kết quả bài tập**, có điểm tạm tính và ghi "Tự luận chờ AI hoặc giảng viên chấm".

### 9. Xem kết quả (UC-D02)

- Đúng: hiện điểm tổng, tỷ lệ đúng, số câu; mỗi câu có loại, trạng thái **Đúng / Sai / Chờ duyệt**, điểm, đáp án đúng và giải thích. Thứ tự câu khớp đúng thứ tự lúc làm bài.
- Ở câu trắc nghiệm sai, bấm **AI giải thích lỗi sai**. Đúng: có lời giải thích kèm nút **Xem nguồn · Trang …** (chưa có khóa AI thì là đoạn trích học liệu).
- Làm lại lần 2 rồi nộp. Đúng: được làm. Thử bắt đầu lần 3. Đúng: bị chặn vì đã hết lượt làm bài.

### 10. Chấm và công bố điểm (BR-02, GV `GV001`)

- **Bài tập & kiểm tra** → bài đó → **Chấm bài** → chọn bài của 23110149.
- Bấm **Gợi ý chấm theo tiêu chí** (hoặc **Gợi ý chấm từ AI** nếu có khóa). Đúng: câu tự luận được đề xuất 3/3 điểm vì bài làm nêu đủ loans, POST, 201.
- Nhập **Nhận xét cho sinh viên** → **Duyệt & công bố điểm**.
- (SV) F5 trang kết quả. Đúng: ghi "Điểm đã được giảng viên duyệt và công bố", thấy nhận xét của GV.

### 11. Phúc khảo (UC-D03, UC-D04)

- (SV) Ở một câu, bấm **Yêu cầu phúc khảo**. Đúng: form hiện sẵn câu hỏi, bài làm và điểm hiện tại. Nhập lý do dưới 10 ký tự. Đúng: không gửi được. Nhập lý do đầy đủ → **Gửi yêu cầu**.
- (SV) Thử bắt đầu lượt làm mới. Đúng: bị chặn vì đang có phúc khảo chờ xử lý.
- (GV) Chuông thông báo có "yêu cầu phúc khảo mới" → **Yêu cầu phúc khảo**. Đúng: thấy SV, bài tập, câu hỏi, bài làm, điểm và lý do.
- Chọn **Chấm lại**, nhập điểm mới → xác nhận. Đúng: trạng thái đã xử lý.
- (SV) F5. Đúng: câu đó ghi **Đã chấm lại**, điểm tổng được cộng lại. (Thử thêm lần nữa với lựa chọn **Giữ nguyên điểm**: SV thấy "Giữ nguyên điểm" kèm lý do.)
- Nếu bài bật ngẫu nhiên hóa: phúc khảo đúng câu SV đã chọn (câu số mấy trên màn hình SV), và GV thấy đúng nội dung câu đó.

---

## PHASE 6: Điểm số và nhắc hạn

### 12. Điểm của sinh viên (UC-D05, SV `23110149`)

- **Kết quả học tập** → chọn lớp. Đúng: có **Điểm tự học** = (số phiên hoàn thành đúng hạn / tổng số phiên) × 10, và **Điểm TB bài tập** = trung bình cộng các bài.
- Phần chi tiết. Đúng: phiên ở mục 2 ghi **đúng hạn**, phiên học muộn ở mục 3 ghi **trễ** và không được cộng; danh sách bài tập có điểm từng bài.

### 13. Bảng điểm giảng viên (UC-G01, GV `GV001`)

- **Bảng điểm** → chọn lớp `CSE301.01`. Đúng: bảng có STT, Mã SV, **Họ đệm**, **Tên**, Điểm tự học, Điểm TB bài tập, khớp với số SV thấy ở mục 12.
- Bấm **Xuất Excel**. Đúng: tải về file .xlsx có đúng các cột trên.

### 14. Nhắc hạn tự động (UC-G03, Admin `AD001`)

- **Nhắc hạn học tập** → chỉnh **Thời điểm kiểm tra** thành khoảng 20 giờ trước hạn đóng của bài ở mục 7 → **Quét hạn trong 24 giờ**. Đúng: danh sách liệt kê SV **chưa hoàn thành**, kèm lớp, bài, hạn và tiến độ; SV đã nộp bài không có trong danh sách.
- Xem **Xem trước email**. Đúng: nội dung có tên SV, lớp, bài, thời gian còn lại và tiến độ.
- Quét lại lần nữa. Đúng: **không tạo trùng** bản ghi nhắc cho cùng SV và bài.
- Chưa cấu hình SMTP thì kênh email có trạng thái **skipped**, kênh trong ứng dụng là **recorded**; đây là hành vi đúng. Cấu hình `SMTP_HOST` trong `.env` thì email được gửi thật.

---

## PHASE 7: Phản hồi, dashboard và chuẩn hóa

### 15. Phản hồi kèm ảnh (UC-E01, UC-E02)

- (SV) **Phản hồi & hỗ trợ** → **Gửi phản hồi**: chọn Lớp, **Bài học** (chỉ thấy bài của lớp mình), Loại vấn đề "Bài giảng", nhập mô tả.
- Đính kèm `6-phan-hoi/22_KHONG-PHAI-ANH.txt`. Đúng: báo "Chỉ chấp nhận tệp hình ảnh". Đính kèm `21_anh-QUA-5MB.png`. Đúng: báo vượt 5 MB.
- Đính kèm `19_anh-minh-chung-1.png` và `20_anh-minh-chung-2.png` → Gửi. Đúng: phản hồi ở trạng thái **Chờ xử lý**.
- (GV) **Mở bằng một trình duyệt khác** (ví dụ SV dùng Chrome thì GV dùng Edge) → **Phản hồi & hỗ trợ** → mở phản hồi. Đúng: **xem được cả 2 ảnh**, chứng tỏ ảnh đã lưu trên server chứ không chỉ trong trình duyệt của SV.
- Nhập **Trả lời sinh viên** → **Trả lời & đánh dấu đã xử lý**. (SV) F5. Đúng: thấy câu trả lời, trạng thái **Đã xử lý**.

### 16. Dashboard giảng viên (UC-F01, GV `GV001`)

- **Theo dõi học tập** → chọn lớp `CSE301.01`. Đúng: bảng có cho từng SV:
  - **Tiến độ tự học** (%).
  - **Điểm bài tập**, kèm **% đúng** và **thời gian nộp gần nhất**.
  - **Tương tác**: số câu hỏi AI và số phản hồi.
  - Cảnh báo **Cần nhắc học** khi tiến độ dưới 50% hoặc điểm dưới 5.
- Lọc **Cần hỗ trợ**. Đúng: chỉ còn SV có cảnh báo.
- Khung **Phân tích học tập**. Đúng: liệt kê các trang có nhiều câu trả lời sai hoặc kiến thức mờ (trang 1 có câu sai từ mục 2).
- **Gợi ý buổi học trên lớp** → **Tạo gợi ý**. Đúng: có chủ đề cần giảng lại; nếu có khóa AI thì có thêm câu hỏi thảo luận và hoạt động trên lớp.

### 17. Dashboard Trưởng khoa (UC-F01, `TK001`)

- **Tổng quan**. Đúng: số học phần, lớp, SV và mức hoàn thành toàn khoa.
- Bấm vào học phần CSE301 → lớp CSE301.01 (drill-down). Đúng: bảng SV của đúng lớp đó, tiến độ khớp với mục 16.
- **Cảnh báo**. Đúng: liệt kê SV tiến độ thấp hoặc điểm dưới ngưỡng; lọc theo học phần và lớp hoạt động đúng.

### 18. Chuẩn hóa học liệu (UC-A05, `TN001` + `GV001`)

- (TN001) Menu **Chuẩn hoá** → học phần CSE301. Đúng: danh sách các lớp cùng học phần, mỗi lớp có slide, quiz, bài tập kèm mức **M0–M3**.
- Mở một học liệu → gửi yêu cầu điều chỉnh với nội dung cụ thể. Đúng: mức chuyển sang **M2 · Cần điều chỉnh**.
- (GV001) **Bài học & học liệu**. Đúng: thấy khung "Yêu cầu từ Trưởng nhóm HP" → **Chỉnh sửa và phản hồi** → lưu. Đúng: học liệu về **M1 · Đang xử lý**.
- (TN001) Duyệt **M3 · Đạt chuẩn** cho mọi slide, quiz và bài tập của lớp → **Hoàn thành chuẩn hoá**. Đúng: chỉ bấm được khi đủ 3 loại đều ở M3 và không còn yêu cầu mở.
- Menu **So sánh lớp**, chọn hai lớp cùng học phần. Đúng: hiện nội dung cùng loại của hai lớp cạnh nhau.

---

## Phần AI bổ trợ (tùy chọn, cần khóa AI để có nội dung do AI soạn)

- (GV001) **Học liệu AI** → **AI soạn bài giảng** → sửa một trang → **Công bố**. (SV) Trang học → tab **Bài giảng**. Đúng: thấy nội dung đã công bố theo khung Ý chính / Ví dụ / Tóm tắt.
- (GV001) Tab **Thẻ ôn** → **AI soạn thẻ ôn** hoặc **Tự thêm thẻ ôn** → **Công bố**. (SV) **Ôn tập** → **Lật thẻ** → **Đã nhớ**. Đúng: thẻ biến khỏi danh sách đến hạn (hẹn lại sau 1 ngày).

## Khi một bước không đạt

Gửi cho Claude: số mục và bước (ví dụ "mục 5, bước 4"), tài khoản đang dùng, đã bấm gì, màn hình hiện gì (ảnh chụp càng tốt).

## Giới hạn đã biết (không phải lỗi)

- Mỗi lúc chỉ chạy được **một** phiên hỏi trên lớp cho toàn hệ thống.
- Bài tập chưa gắn theo lớp: mọi SV đều thấy bài tập đã công bố.
- Trang học của bài không phải bài mẫu chỉ hiển thị tên trang và phần giải thích, chưa hiển thị ảnh slide.
- Không có khóa AI thì chấm tự luận, gợi ý câu hỏi và Bài giảng AI dùng phương án dự phòng (theo tiêu chí, ngân hàng câu hỏi, viết tay).
