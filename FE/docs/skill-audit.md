# Kiểm tra ba bộ skill — 16/10/2026

Project được kiểm tra: `FinalProject/FE`. Cài skill, khởi tạo project và áp dụng hướng dẫn là ba việc khác nhau; không có một lệnh “kích hoạt cả ba” chung.

| Bộ | Yêu cầu thực tế | Bằng chứng đã kiểm tra |
| --- | --- | --- |
| github/spec-kit | Khởi tạo project bằng Specify CLI, rồi áp dụng các skill quy trình trong chat. | Lịch sử lệnh lúc 12:25:29 (UTC+7): `specify init --here --non-interactive --integration codex --ignore-agent-tools` trong FE. `.specify/init-options.json` ghi version 1.2.0/integration codex; có constitution, spec, plan, tasks và các skill speckit. Prerequisites hiện trả FEATURE_DIR đúng FE. |
| pbakaus/impeccable | Chạy `impeccable context` đúng project, đọc brief và playbook; kiểm tra giao diện theo mode. | Lệnh ban đầu lúc 12:21:08 chạy ở thư mục cha của FE: phạm vi chưa đúng. Đã sửa trong lần kiểm tra này bằng `impeccable context --target src/shared/Account.tsx` với cwd FE. CLI xác nhận PRODUCT.md, DESIGN.md, platform web và projectRoot đúng. Đã ghi brief qua `surface-brief write` để gắn Layout/Account/App và hai tổng quan; `surface-brief read src/shared/Account.tsx` nạp đúng brief Operate. |
| addyosmani/agent-skills | Cài một lần; Codex nạp SKILL.md phù hợp theo công việc. Không có init bắt buộc cho từng project. | Khóa cài đặt global ghi source addyosmani/agent-skills. Các skill frontend-ui-engineering, incremental-implementation, test-driven-development và security-and-hardening đã đọc/áp dụng cho UI, logic tài khoản và kiểm thử; không suy diễn việc đọc skill thành cài native plugin. |

## Impeccable: kết quả trực tiếp

- `doctor --json` đọc đúng project, platform web, ruleRegistryAvailable=true.
- `hooks status` báo cấu hình enabled và có hook.cache.json. Tuy vậy lệnh context trong phiên này không nhận diện automatic hook, nên không khẳng định rằng cấu hình enabled đồng nghĩa mọi hook đều đã chạy.
- Đã chạy detector thủ công đúng chỉ thị trên hai file UI đổi trong lần này: **0 findings**. Raw report: `artifacts/skill-audit/detector.json`. Kiểm tra hình ảnh desktop/mobile và kiểm thử tương tác được thực hiện riêng.
- Doctor còn một advisory: chưa đặt `buildPath` cho landing/showcase (Persuade/Experience). Trong lần sửa đăng nhập 16/10, Operate được triển khai code trước nên không bị chặn. Khi cần những loại trang đó có thể chọn `code` hoặc `comp`; không đổi mặc định này trong một lần sửa đăng nhập.

## Nguồn

- [Spec Kit: khởi tạo và quy trình](https://github.com/github/spec-kit#readme).
- [Addy Osmani: cách dùng trong Codex](https://github.com/addyosmani/agent-skills/blob/main/docs/codex-setup.md).
- [Impeccable đang cài trên máy](/Users/quanganh/.agents/skills/impeccable/SKILL.md).

Đây là kiểm chứng có giới hạn: không gọi một bộ quy trình là đã “bật toàn bộ” khi chỉ một số skill phù hợp được áp dụng. Không chạy init lại để ghi đè project đang có.

## Lần chỉnh giao diện 17/10/2026

Đã áp dụng Impeccable Operate, đọc polish và craft-floor trước khi sửa; hook thực tế gửi kết quả kiểm tra khi thay đổi Grades/Layout. Sau nhiều lượt sửa cùng file, hook tự ngừng nhắc thêm theo giới hạn của nó. Ảnh trình duyệt/Figma và các luồng tương tác được kiểm tra riêng, không dùng kết quả detector làm bằng chứng duy nhất.

Đã đọc hướng dẫn frontend-ui-engineering của Addy Osmani, giữ các thay đổi theo đúng phạm vi và kiểm chứng hành vi. Spec Kit check-prerequisites với feature 001-lms-frontend trả đúng thư mục FE/specs/001-lms-frontend; T012–T016 ghi lại yêu cầu, triển khai và kiểm tra lần này.


## Phần mở rộng Trưởng khoa — 24/10/2026

- **Spec Kit:** feature `specs/002-dean-workspace` có spec/plan/tasks, lấy đúng sheet Trưởng khoa B2:I5; prerequisites đã chạy lại và trả đúng feature 002. D001–D007 ghi nhận thiết kế, triển khai, kiểm chứng và tài liệu; không chạy init lại.
- **Addy Osmani:** áp dụng frontend-ui-engineering, incremental-implementation, test-driven-development và review theo phạm vi: logic tổng hợp có 5 unit test, triển khai theo shell/dữ liệu/màn hình, rồi regression và review. Các phần SV/GV được giữ; đây không phải tuyên bố mọi skill đều đã kích hoạt.
- **Impeccable:** nạp context một lần bằng `impeccable context --target src/shared/Layout.tsx`, dùng brief `.impeccable/surfaces/dean-workspace.md` ở mode Operate. Đây là phần mở rộng chính xác của Campus agenda, không chọn lại visual world. Theo yêu cầu người dùng, khung Figma native được thiết kế trước rồi mới triển khai code; trình tự này được ghi riêng với lần sửa đăng nhập 16/10.
- Detector chạy **một lần** cho `src/Truongkhoa` và `src/styles/dean.css`, exit 0, có advisory các cỡ chữ 12/16/24/25/26/32px so với ramp frontmatter chưa đầy đủ. Cỡ chữ được đối chiếu với Figma native và control responsive đã có; không thêm suppression. Output console bị truncate, không nhận là raw report lưu đầy đủ. Không chạy detector lần hai sau sửa keyboard. Bản tóm tắt: `.impeccable/review/dean/detector-summary.md`; `artifacts/skill-audit/detector.json` là báo cáo cũ, không phải report Dean.
- Context báo **drift có sẵn giữa DESIGN.md và .impeccable/design.json**. Giữ nguyên cả hai nguồn authority trong lần mở rộng này; không sửa drift hoặc thay nhận diện toàn cục.
- Finish review độc lập ban đầu có một finding: sidebar mobile đóng vẫn có thể nhận focus. Sau sửa visibility/trigger và ca bàn phím mục tiêu, reviewer đánh dấu resolved, disposition `ship`. Đây là kết luận cho finding được sửa tiếp nối full review ban đầu, không phải một full review mới. `documentation-review.md` ghi kiểm tra persistence và phạm vi tài liệu; không viết lại DESIGN.md/sidecar.

Chuỗi bằng chứng: `artifacts/figma-ledger/dean-design-first.json`, `dean-refined.json`, các `dean-context-*.json`, `dean-structural-audit.json`, manifest asset, 18 capture/runtime và finish review trong `.impeccable/review/dean/`. Xem [kiểm chứng](verification.md) để phân biệt 30 ca full trước sửa với 9 ca scoped sau sửa.

## Phần mở rộng Trưởng nhóm HP — 24/10/2026

- **Spec Kit:** feature `specs/003-course-leader` có spec/plan/tasks, lấy sheet Trưởng nhóm HP B2:I9 và giữ nguyên tên/chức năng. Prerequisites trả đúng feature 003. Không có `extensions.yml`, không chạy init lại, không khởi tạo Git/commit khi thư mục không phải repo. C001–C007 ghi scope, Figma trước, model/UI, kiểm chứng và tài liệu.
- **Addy Osmani:** đã đọc/áp dụng frontend-ui-engineering, incremental-implementation, test-driven-development và debugging-and-error-recovery. Thực hiện model có kiểm thử trước, lát cắt UI rồi full regression/build. Không khẳng định mọi skill của bộ đều chạy.
- **Impeccable:** `context` chạy đúng **một lần** trong task với target `src/Truongkhoa/Overview.tsx` để kế thừa hệ có sẵn, sau đó viết/đọc brief `.impeccable/surfaces/course-leader.md`; không chạy lại context. Đây là mở rộng Operate chính xác của Campus agenda, không chọn nhận diện mới. Native Figma có trước nguồn UI; danh mục bổ sung cũng có trước module tương ứng. Hook thực tế khi sửa UI không báo deterministic issue; hook không thay review ảnh.
- Detector chạy đúng **một lần**, exit 0; raw đầy đủ ở `.impeccable/review/course-leader/detector.json`. Có **15 advisory cỡ chữ** (12/14/16/25/26px) vì ramp frontmatter chưa đầy đủ; không có finding cơ học, suppression hoặc lần chạy lại. Các giá trị được đối chiếu native Figma/control hiện có, không giảm cỡ chỉ để hết advisory.
- Context báo drift có sẵn giữa `DESIGN.md` và `.impeccable/design.json`; giữ nguyên cả hai. Documenter đọc `reference/document.md` và ghi tài liệu phần mở rộng, không regenerate token/sidecar, không mở vòng chọn lại identity/approval. So sánh SHA-256 trước/sau được lưu trong `.impeccable/review/course-leader/documentation-review.md`.
- Finish reviewer độc lập đã mở 26 capture và đọc source, kết luận `ship`, không có material fix ở phạm vi local đã chốt; không chạy lại test/detector. Documenter bàn giao riêng các sự thật sản phẩm, 121 dòng yêu cầu, 54 khung và kết quả cuối 23 unit/40 E2E; giới hạn TN-08/kho điều phối được giữ rõ.

Chuỗi bằng chứng: `artifacts/figma-ledger/course-leader-{design-first,final}.json`, các context và `course-leader-assets.json`; `.impeccable/review/course-leader/{runtime.json,detector.json,finish-review.md,documentation-review.md}`; `artifacts/playwright-report/index.html`. Các con số Dean 30 full rồi 9 scoped ở phần lịch sử không phải báo cáo cuối hiện tại.
