# VJU Learning — Frontend

Giao diện LMS lớp học đảo ngược dành cho **Sinh viên**, **Giảng viên**, **Trưởng khoa** và **Trưởng nhóm HP (CourseLeader)**, xây bằng React, TypeScript, Vite và CSS. Đây là bản frontend có dữ liệu minh họa, lưu trên trình duyệt; backend Java chưa được triển khai.

## Chạy ứng dụng

Dùng Node.js tương thích Vite trong `package-lock.json` (môi trường kiểm thử: Node 24).

```sh
npm install
npm run dev
```

Mở [http://127.0.0.1:5173](http://127.0.0.1:5173): màn mặc định là **đăng nhập chung**, chỉ nhập mã tài khoản và mật khẩu. Không chọn role ở đăng nhập hoặc trong menu tài khoản. Cả bốn vai trò dùng sidebar trắng, mục hiện tại đỏ nhạt và nhận diện VJU gốc. Không có đăng ký tự do.

Tài khoản kiểm thử FE: **23110149** (sinh viên), **GV001** (giảng viên), **TK001** (Trưởng khoa), **TN001** (Trưởng nhóm HP), cùng mật khẩu **12345678**. Đây là fixture cục bộ trong `src/data/accounts.ts`; chưa phải xác thực máy chủ. Role lấy từ dữ liệu tài khoản, không từ ô chọn, query string hoặc tiền tố mã. Mã chưa biết/mật khẩu sai bị từ chối; URL khác role chuyển về không gian của tài khoản. Chỉ lưu ID tài khoản kiểm thử trong `sessionStorage`, không lưu mật khẩu/token. Khi nối Java API cần thay bằng xác thực, session và phân quyền ở máy chủ; guard FE không phải ranh giới bảo mật.

Chuông mở bảng thông báo tại chỗ; tên mục trên thanh đầu mở điều hướng nhanh. Các menu hỗ trợ Escape/click ngoài và đóng sau khi chọn. Các nhãn kỹ thuật “Demo”, “Bản trải nghiệm”, “Frontend demo” đã bỏ khỏi giao diện theo yêu cầu; việc này không thêm backend hay xác thực. Chi tiết tích hợp và dữ liệu cục bộ được giữ trong tài liệu kỹ thuật.

```sh
npm run build
npm run preview
npm test
```

Chạy E2E khi máy chủ `npm run dev` đang mở ở terminal khác:

```sh
npx playwright install chromium
npm run test:e2e
```

Nếu dùng Brave đã cài trên macOS thay cho Chromium của Playwright:

```sh
CHROMIUM_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' npm run test:e2e
```

`CHROMIUM_PATH` nhận đường dẫn executable trình duyệt tương thích Chromium trên máy đang dùng. Cấu hình E2E không tự khởi động Vite.

## Luồng nên thử

- Sinh viên: **Tự học → Bắt đầu học → Xác nhận đáp án → Trang tiếp theo → Hoàn thành phiên**. Chat AI và kiến thức mờ có trong màn học.
- Sinh viên: **Bài tập → Bắt đầu làm bài → Nộp bài → Xem kết quả**; luyện tập được tách riêng, không tính điểm.
- Giảng viên: **Bài học & học liệu → Soạn bài**, **Ngân hàng câu hỏi**, **Phiên tự học**, **Bài tập & kiểm tra → Chấm bài**.
- Đăng xuất rồi đăng nhập tài khoản còn lại để kiểm tra phản hồi, duyệt điểm và phúc khảo trên cùng dữ liệu demo. Mở hai tab cùng origin, đăng nhập mỗi tab bằng một tài khoản để thử phiên hỏi trên lớp với mã `261016`; tab giảng viên bắt đầu phiên trước.
- **Bảng điểm → Xuất Excel** tạo tệp `.xlsx` ngay trên trình duyệt.
- Trưởng khoa: **Tổng quan khoa → học phần → lớp → danh sách sinh viên**, hoặc **Cảnh báo học tập → lọc học phần/lớp → mở lớp của sinh viên**. Đổi học kỳ để thử trạng thái rỗng; hồ sơ và trạng thái đọc chuông lưu riêng.
- Trưởng nhóm HP: **Chuẩn hoá → chọn học phần/lớp → rà soát → gửi yêu cầu điều chỉnh**. Đăng nhập GV001, mở **Bài học & học liệu → Yêu cầu từ Trưởng nhóm HP**, sửa nội dung và trả lời; quay lại TN001 để rà soát M3. **So sánh** đặt cùng loại học liệu của hai lớp cạnh nhau; **Học liệu** tạo/sửa nội dung chữ, **Tài liệu** thêm/sửa URL. Chỉ hoàn thành lớp khi đủ slides/quiz/bài tập, tất cả M3 và không còn yêu cầu mở.

## Cấu trúc

```text
src/Sinhvien/       Màn hình sinh viên
src/Giangvien/      Màn hình giảng viên
src/Truongkhoa/     Tổng quan khoa, học phần/lớp, cảnh báo và hồ sơ
src/Truongnhomhp/   Chuẩn hoá học liệu, so sánh, yêu cầu và biên soạn theo học phần
src/shared/         Layout, UI, tài khoản, tài liệu, phản hồi, điểm, lớp trực tiếp
src/data/           Dữ liệu mẫu, lưu cục bộ, quy tắc tự học và bài tập
src/styles/        Token, kiểu giao diện và responsive
public/brand/      Hai logo VJU từ Logo nguồn
public/materials/  PDF minh họa
tests/             Luồng E2E Playwright
docs/              Đối chiếu yêu cầu, màn hình, giới hạn và kiểm chứng
```

Các route nằm trong `src/App.tsx`; triển khai trên máy chủ tĩnh cần rewrite route của SPA về `index.html`.

## Phạm vi và tài liệu

Nguồn yêu cầu là `../SRS_Checklist_Flipped_Classroom.xlsx`: **65 mục SV + 44 mục GV + 4 mục TK + 8 mục TN = 121 mục**. Các trạng thái cũ trong workbook không phải kết quả nghiệm thu bản FE này. [Đối chiếu 121 yêu cầu](docs/requirements.md) ghi nguyên văn từng mục và chỉ rõ phần đã làm, mô phỏng, một phần hoặc chưa làm.

- [Danh mục màn hình và luồng](docs/screens.md)
- [Giới hạn và phần cần backend](docs/limitations.md)
- [Bằng chứng kiểm thử](docs/verification.md)
- [Hệ thống thiết kế](DESIGN.md), [ngữ cảnh sản phẩm](PRODUCT.md)
- [54 khung desktop Figma và cách tổ chức](docs/figma.md)
- [Kiểm chứng khởi tạo và sử dụng ba bộ skill](docs/skill-audit.md)
- [File Figma thiết kế](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8)

Giao diện dùng đỏ, trắng và be ấm theo hướng Operate: ưu tiên thao tác, trạng thái và ngữ cảnh lớp học. Hai ảnh `../Logo/Long_logo.jpg`, `../Logo/Short_logo.jpeg` được dùng qua bản sao trong `public/brand`. `../Demo` và `../Images_demo` là tư liệu luồng của bản cũ đã bỏ, không phải thiết kế cần sao chép.

## Dữ liệu demo

Dữ liệu được lưu dưới khóa `vju-learning-demo-v1` trong `localStorage`. Xóa riêng khóa này rồi tải lại để khôi phục dữ liệu mẫu:

```js
localStorage.removeItem('vju-learning-demo-v1');
location.reload();
```

Trưởng khoa dùng role `truong-khoa` và các route dưới `/truong-khoa`. Học kỳ I có 3 học phần, 4 lớp, 12 sinh viên không trùng và 23 lượt ghi danh; hoàn thành trung bình 67% ở dữ liệu khởi tạo. Đây là các danh sách đại diện, không phải toàn bộ sĩ số mẫu 110/36/42/32 trên các thẻ/tổng quan giảng viên cũ. Ngưỡng cảnh báo dưới 50% tiến độ hoặc dưới 5 điểm là giả định fixture, không phải quy định nhà trường. Xem [giới hạn dữ liệu Trưởng khoa](docs/limitations.md#trưởng-khoa-và-phạm-vi-dữ-liệu).

Chỉ đồng bộ giữa các tab cùng origin và cùng hồ sơ trình duyệt. AI dùng câu trả lời cố định, tệp đính kèm chỉ lưu tên, PDF chọn trong trình soạn bài chỉ xem trước cục bộ. Không có xác thực, phân quyền máy chủ, lưu tệp lâu dài, email, AI thật hoặc realtime giữa thiết bị. Không dùng dữ liệu cá nhân hay mật khẩu thật trong bản demo.

## Trưởng nhóm HP — phạm vi bàn giao 24/10

Role `truong-nhom-hp`, route `/truong-nhom-hp`, thư mục `src/Truongnhomhp`. Tên đúng theo workbook là **Trưởng nhóm HP / CourseLeader**; không thêm vai trò Trưởng bộ môn. Bốn mức được dùng nhất quán cho lọc và thống kê: **M0 Chưa rà soát → M1 Đang xử lý → M2 Cần điều chỉnh → M3 Đạt chuẩn**. Gửi yêu cầu đặt M2, giảng viên sửa/trả lời đưa về M1, duyệt M3 đóng yêu cầu. Không duyệt M3 khi yêu cầu chưa được trả lời; thay đổi học liệu hoặc rà soát lại làm mất dấu hoàn thành lớp.

Dữ liệu khởi tạo có hai học phần được phân công (`cs301`, `cs204`), ba lớp, chín bản ghi học liệu; riêng CSE301 có 2/6 học liệu M3 và một M2. `api2-slides` chỉ được xem/rà soát, không sửa trực tiếp. Hồ sơ `leaderProfile` và trạng thái đọc `readLeaderNotices` lưu riêng trong kho hiện có; dữ liệu cũ được ghép các giá trị khởi tạo còn thiếu.

Kho `coordination` dùng chung giữa màn Trưởng nhóm HP và panel trả lời của giảng viên. Kho này tách khỏi các Lesson/Question/Assignment cũ; sửa nội dung điều phối không tự thay slide sinh viên, ngân hàng câu hỏi hoặc điểm. TN-08 hiện có tạo/sửa tiêu đề và nội dung chữ của slides, quiz, đề bài tập cùng liên kết HTTP/HTTPS hoặc PDF `/materials/`; chưa phải trình nhập PDF/PPT, câu hỏi có cấu trúc hoặc AI tương đương toàn bộ công cụ giảng viên.

Kiểm chứng cuối sau sửa UI: **23/23 unit test, 40/40 E2E và build đạt**. Figma có **54 khung desktop**, gồm 10 khung Trưởng nhóm HP chỉnh sửa được. Xem [kiểm chứng](docs/verification.md), [Figma](docs/figma.md) và [giới hạn](docs/limitations.md#trưởng-nhóm-hp-và-điều-phối-học-liệu) để biết phạm vi bằng chứng.
