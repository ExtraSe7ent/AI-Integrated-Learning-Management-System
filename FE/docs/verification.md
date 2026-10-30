# Kiểm chứng frontend · 30/10/2026

Kết quả cho frontend cục bộ, không xác nhận backend hoặc toàn bộ 146 yêu cầu. Lượt cuối sau hai tinh chỉnh UI/review đạt **35/35 unit, 52/52 E2E (3,5 phút) và TypeScript/Vite production build**. Các mốc 23/40 hoặc 51/52 trước đó là lịch sử, không thay kết quả cuối này.

## Kiểm tra tự động hiện tại

- Unit kiểm Admin registry/import/role/active, AI rules, deadline dedup và các model SV/GV/TK/TN hiện có.
- E2E kiểm tài khoản/guard/đổi mật khẩu, import Excel thực, học phần/lớp/ghi danh, AI/practice/nhắc hạn, cùng regression các vai trò cũ. Các assertion cuối xác nhận không có đề xuất chấm mẫu thứ hai khi đã nộp bài và có disclosure mô phỏng nhìn thấy được.
- Các route mẫu được quét ở viewport giả lập 1440px và 390px; kết quả responsive chỉ áp dụng phạm vi route/trạng thái đã kiểm. Không đo thời gian NFR-02 ≤2 giây, tải 500 người hoặc thiết bị vật lý.
- Build còn cảnh báo chunk chính **547,33KB** và lazy ExcelJS **929,39KB**. Không thêm dependency mới hoặc tắt cảnh báo để qua build.

Báo cáo E2E: `artifacts/playwright-report/index.html`. Mã kiểm tra trong `tests/`, unit cạnh các model. Chạy lại theo README; Playwright cần máy chủ Vite đang chạy riêng.

Hai thử nghiệm mutation chỉ chạy trên **bản sao cô lập** dưới `artifacts/admin-ai/mutation/` (bản sao/cache đã dọn sau chạy, giữ log): đảo guard import làm test từ chối dữ liệu lỗi thất bại; đảo predicate chọn tài khoản làm assertion trạng thái active thất bại. Log ở `artifacts/admin-ai/mutation-result.txt` và `mutation-account-status-result.txt`. Đây là bằng chứng test bắt được thay đổi có chủ ý, không phải lỗi của ứng dụng gốc; source gốc không bị mutation.

## Ảnh runtime và review

`.impeccable/review/admin-ai/runtime.json` ghi **25 ảnh runtime** tại 1440/390/800px: tài khoản/import/lỗi/reset, học phần/lớp/ghi danh, trợ lý/không nguồn, luyện tập, chấm nháp/phân tích, nhắc hạn/nhật ký/rỗng và một số màn điểm/kết quả. Log có `errors: []`, không tràn toàn trang hoặc ảnh hỏng ở các capture này. Có thêm **13 ảnh native Figma** để đối chiếu.

Detector chạy **một lần**, `.impeccable/review/admin-ai/detector.json` trả `[]`; kết quả đó không phải chứng nhận trực quan/accessibility. Fresh finish review ban đầu yêu cầu sửa đề xuất chấm trùng và disclosure AI. Sau recapture, `finish-review.md` có `disposition: ship`, hai finding được giải quyết. Verdict cuối chỉ chấm lại hai sửa chữa đó; không phải một cuộc nghiệm thu độc lập toàn SRS. Reviewer không tự chạy lại browser/test/detector. Suite 52 cuối chạy xong sau review.

## Figma

13 khung Admin/AI native được dựng trước UI theo `artifacts/admin-ai/design-first.json`; `design-final.json` ghi **364 TEXT, 217 auto-layout container**, chỉ Be Vietnam Pro, `badText: []`. Tổng **67 desktop** gồm 54 khung cũ giữ nguyên; không thêm mobile Figma. Xem [figma.md](figma.md) để biết giới hạn fidelity.

Các giới hạn FE còn lại ở [audit](audit-2026-10-30.md), [matrix](requirements.md) và [limitations](limitations.md) vẫn có hiệu lực dù suite xanh.

## Lịch sử kiểm chứng · 24/10/2026

Các đoạn dưới là snapshot ngày 24/10, giữ để tra cứu phạm vi cũ. Báo cáo Playwright hiện tại đã được thay bằng lần 52 ca ngày 30/10; các chữ “hiện tại/cuối” trong snapshot chỉ nói về mốc lịch sử này.

Kết quả áp dụng frontend cục bộ, dùng fixture; không xác nhận backend Java hoặc toàn bộ 121 yêu cầu SRS.

- npm run build: TypeScript và Vite thành công. ExcelJS được tải riêng; Vite vẫn báo chunk ExcelJS lớn.
- npm test: **23/23 unit test đạt**: 16 ca hiện có (11 SV/GV/tài khoản + 5 Trưởng khoa) và 7 ca model Trưởng nhóm HP.
- Playwright cuối sau sửa UI CourseLeader: **40/40 E2E đạt** (21 ca SV/GV/tài khoản + 9 Trưởng khoa + 10 Trưởng nhóm HP). Tại mốc này, báo cáo đầy đủ 40 ca đã thay báo cáo scoped 9 ca Dean; báo cáo hiện nay được ghi ở phần 30/10 phía trên. Vite chạy tại http://127.0.0.1:5173; dùng Brave qua CHROMIUM_PATH.

Các luồng được kiểm tra: học/khôi phục tiến độ, bài tập độc lập, duyệt điểm và nhận xét, công bố bài học, phản hồi hai phía, poll giữa hai tab; đăng nhập theo tài khoản, chặn route khác vai trò, reload/đăng xuất; popup chuông, điều hướng nhanh, canh tên môn, đóng menu ở mobile.

Năm ca mới trong tests/workspace-refinement.spec.ts kiểm tra:

1. Chọn lớp CSE301.02 đổi danh sách, tìm đúng sinh viên; mở **tệp XLSX thực tế tải xuống**, kiểm tra tên file, nội dung và số hàng thuộc lớp/bộ lọc đã chọn.
2. Hồ sơ giảng viên lưu tên/điện thoại qua tải lại, cập nhật tên ở sidebar và không ghi đè hồ sơ sinh viên.
3. URL thông báo cũ của sinh viên chuyển về Tổng quan và mở popup; đánh dấu đã đọc xóa chấm trên chuông và từng dòng.
4. Tương tự cho giảng viên, đồng thời trạng thái đã đọc của giảng viên không làm mất chấm thông báo sinh viên.
5. Không còn khối quảng bá AI; ba số liệu là thẻ trắng, sidebar giảng viên trắng; đường dẫn AI mở đúng học liệu giảng viên, trang tài liệu có thể truy cập.

Hai ca quét giao diện đi qua **36 URL mẫu ở 1440px và 390px**: h1 hiển thị, không có lỗi JavaScript hoặc tràn ngang toàn trang. Đây là kiểm tra route/viewport, không phải kiểm chứng đầy đủ mọi nghiệp vụ. Việc giữ kiểm tra responsive trong code không tạo thiết kế mobile mới trong Figma.

Đã xem một bộ ảnh của tổng quan, bảng điểm, AI/tài liệu hai vai trò, hồ sơ, popup và đăng nhập. scripts/inspect-navigation.mjs báo không có pageerror hoặc tràn ngang tại các màn chụp. Ảnh lưu trong .impeccable/review/refinement/; báo cáo test tại artifacts/playwright-report/index.html.

Figma: **54 khung desktop**, 16 sinh viên / 19 giảng viên / 2 tài khoản / 7 Trưởng khoa / 10 Trưởng nhóm HP. Audit 37 khung cũ ngày 17/10 và audit 7 khung Trưởng khoa ngày 24/10 là hai phạm vi riêng; phần Dean có 349 text node, 247 auto-layout container, 3 button instance và 7 logo fill, giữ thứ tự canvas/layer. Không còn màn Thông báo riêng, không tạo lại trang mobile đã bị người dùng xóa. Xem [bàn giao Figma](figma.md).

Impeccable Operate được áp dụng với brief hiện có, hướng dẫn polish và craft-floor; hook thực tế đã chạy khi sửa UI. Spec Kit prerequisites trả đúng feature trong FE, tasks được cập nhật theo phạm vi mới. Xem [kiểm chứng skill](skill-audit.md).

### Trưởng khoa — lịch sử kiểm chứng 24/10 trước phần CourseLeader

Năm unit test trong `src/Truongkhoa/data.test.ts` kiểm số SV không trùng/lượt ghi danh và trung bình có trọng số, phạm vi học phần, học kỳ rỗng, ranh giới chính xác 50%/5 điểm, và tiến độ SV liên kết không làm đổi roster mẫu khác. Chín ca `tests/dean.spec.ts` kiểm đăng nhập/guard/reload/đăng xuất, drill-down và cặp ID sai, bộ lọc cảnh báo và phục hồi, học kỳ rỗng/URL/tìm học phần, hồ sơ riêng lưu qua reload, chuông/menu, tiến độ từ SV sang lớp liên kết, và quét sáu route ở 1440px/390px.

Tại mốc Dean: full suite 30/30 đã đạt trước sửa accessibility cuối; sau sửa, 9/9 ca Dean và build đạt lại. Báo cáo scoped 9 ca khi đó đã được lần full 40 ca CourseLeader thay thế.

Ca 390px sau sửa xác nhận Tab từ skip-link đi tới nút menu hiển thị, drawer đóng bị ẩn, Escape trả focus về nút mở và lựa chọn đóng drawer. Đây là kiểm chứng mục tiêu sau sửa, không phải lần chạy lại toàn bộ regression hay chứng nhận accessibility.

`runtime.json` trong `.impeccable/review/dean/` ghi **11 ảnh runtime** ở 1440/800/390px, không pageerror, tràn toàn trang hoặc ảnh hỏng. Cùng thư mục có **7 ảnh tham chiếu Figma**; tổng 18 capture đã được finish reviewer kiểm tra. `finish-review.md` kết luận **ship** sau khi finding bàn phím duy nhất được sửa và xác nhận bằng ảnh/9 ca Dean; reviewer không tự chạy lại test/detector và kết luận này không phải một full audit mới sau sửa.

Vite còn cảnh báo lazy chunk ExcelJS khoảng 929KB từ chức năng xuất Excel đã có; Dean không thêm dependency đó và không tắt cảnh báo. Detector Dean chạy một lần, trả advisory cỡ chữ; không coi detector là kiểm chứng thay cho ảnh/browser. Xem [skill-audit.md](skill-audit.md).

Chưa kiểm API/auth máy chủ, AI thật, lưu tệp lâu dài, realtime giữa thiết bị, thiết bị vật lý hoặc mọi nhánh import/phúc khảo/timer. Xem [đối chiếu yêu cầu](requirements.md) và [giới hạn](limitations.md).

### Trưởng nhóm HP — kiểm chứng cuối 24/10

Bảy ca trong `src/Truongnhomhp/model.test.ts` kiểm phạm vi học phần/lớp/item, quyền sửa trực tiếp, vòng yêu cầu/trả lời/duyệt, điều kiện hoàn thành và mất dấu hoàn thành, cùng URL tham chiếu hợp lệ. Mười ca `tests/course-leader.spec.ts` kiểm tài khoản/guard, học liệu chỉ đọc, ID sai phạm vi; nội dung so sánh thực ở hai lớp khác nhau và học phần một lớp; yêu cầu hai vai trò/rà soát lại/reload; hoàn thành rồi sửa; tạo đủ ba loại nội dung; tạo/sửa URL và lưu/phạm vi; hồ sơ/chuông riêng; 11 route ở 1440px/390px và Tab/Escape với menu đóng. Đây là kiểm chứng hành vi local, không phải phép thử phân quyền máy chủ.

Các lỗi kiểm thử ban đầu về label trùng option và textarea defaultValue được sửa bằng tên control rõ ràng/hint riêng; giữ nguyên kiểm thử, không skip hoặc suppression. Hai chỉnh UI cuối là bộ lọc so sánh ba hàng ở 300px và gap hồ sơ 16px. Full **23 unit + 40 E2E + production build** đạt sau các chỉnh sửa đó; không phát sinh dependency mới. Chunk ExcelJS khoảng 929KB và cảnh báo Vite là phần có sẵn, vẫn được ghi nhận.

`.impeccable/review/course-leader/runtime.json` ghi 16 ảnh: `desktop`, `class`, `review`, `compare`, `requests`, `materials`, `editor`, `resources`, `profile`, `popup`, `read-only`, `single-class`, `mobile`, `mobile-review`, `tablet`, `teacher-reply`. Tại các ảnh 1440/390/800px, `errors: []`, không ảnh hỏng và document width bằng viewport. Đây là các trạng thái/viewport được chụp, không bao phủ mọi thiết bị hoặc trạng thái.

Reviewer độc lập đã mở đủ **26 ảnh (16 runtime + 10 Figma)**, đọc source và ledgers, kết luận **ship**, không có material fix ở phạm vi frontend local. Reviewer không tự chạy lại test/browser/detector; kết quả test là bằng chứng từ lần thực thi của implementer. Xem `.impeccable/review/course-leader/finish-review.md` và `documentation-review.md`. Detector chỉ chạy một lần, 15 advisory cỡ chữ; không dùng thay review ảnh/tương tác. Các giới hạn registry riêng, TN-08, auth và Figma giảng viên được ghi tại [giới hạn](limitations.md), [Figma](figma.md).
