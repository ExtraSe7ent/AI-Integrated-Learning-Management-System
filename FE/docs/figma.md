# Thiết kế Figma · cập nhật 30/10/2026

[File thiết kế của nhóm](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=15-223) hiện có **67 khung desktop**.

| Trang | Nội dung | Khung |
| --- | --- | ---: |
| [Sinh viên](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=15-223) | Tổng quan, khóa học, học bài, tự học, bài tập, luyện tập, trực tiếp, điểm, AI, tài liệu, phản hồi, hồ sơ và popup | 16 |
| [Giảng viên](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=20-2) | Tổng quan, lớp, học liệu, tự học, bài tập/chấm bài, câu hỏi, trực tiếp, theo dõi, bảng điểm có chọn lớp, AI, tài liệu, phản hồi, phúc khảo, hồ sơ và popup | 19 |
| [Trưởng khoa](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=84-2673) | Tổng quan khoa, học phần, chi tiết học phần, lớp/SV, cảnh báo, hồ sơ và popup chuông | 7 |
| [Trưởng nhóm HP](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=98-2840) | Tổng quan, lớp, rà soát, so sánh, yêu cầu, học liệu, biên soạn, tài liệu, hồ sơ và popup | 10 |
| [Admin & Hệ thống AI](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-1968) | Tài khoản/import, học phần/lớp/ghi danh, nhắc hạn, trợ lý, luyện tập, chấm nháp và phân tích | 13 |
| [Tài khoản](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=21-3216) | Đăng nhập chung và đổi mật khẩu | 2 |

Tổng quan là khung 01 của từng vai trò. Canvas có ba cột, đọc từ trái sang phải rồi xuống hàng; khoảng cách dọc tính theo khung cao nhất của hàng. Danh sách layer cũng được xếp để khung 01 hiện trên cùng. Hồ sơ nằm trong trang của từng vai trò. Trang mobile do người dùng xóa không được tạo lại hoặc đồng bộ.

Màn Thông báo riêng 21:3601 đã xóa. Hai khung SV/GV mang tên **Thông báo · Popup từ chuông** chỉ biểu diễn trạng thái mở bảng nhỏ trên Tổng quan:

- [Popup sinh viên](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=36-12177).
- [Popup giảng viên](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=63-10691).

Các màn giảng viên bổ sung: [Trợ lý AI](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=63-10137), [Tài liệu tham khảo](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=63-10399), [Hồ sơ](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=63-9892). Sidebar giảng viên đã đổi sang trắng; logo giữ nguyên màu và hình gốc.

Kiểm tra trực tiếp bộ 37 khung SV/GV/tài khoản ngày 17/10 (không cộng gộp với 7 khung mới): **2.517 lớp chữ, 672 instance và 3.122 vector**, tất cả chữ dùng Be Vietnam Pro. Ảnh chỉ là hai logo VJU; không dùng ảnh toàn màn thay cho lớp giao diện. Thư viện giữ 143 control component đang có instance, 2 master logo và bộ Button 6 biến thể; đã dọn 36 control master tự sinh hết nơi sử dụng. Giữ các biến màu, text style và [bảng nền tảng](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=23-24) đã có.

Đã đối chiếu ảnh dựng Figma với frontend cho tổng quan hai vai trò, bảng điểm, AI, hồ sơ và popup giảng viên; xác nhận lại bộ chọn sau khi bổ sung chevron. Các khung vẫn là trạng thái thiết kế; chưa nối prototype tương tác đầy đủ, chỉnh sửa Figma không tự cập nhật code.

Ledger hiện tại: artifacts/design-state.json. Bằng chứng thao tác/kiểm tra: artifacts/figma-ledger/cleanup-oct17-*.json. Script xuất chỉ duyệt desktop; importer dùng lại ID và component/variable đã có, giữ vị trí khung và số thứ tự khi cập nhật.


## Phần mở rộng Trưởng khoa — thiết kế trước, code sau

Bảy khung native trên trang **Trưởng khoa** (`84:2673`) mở rộng Campus agenda hiện có, dùng lại nền tảng và button đã có. Sáu khung nghiệp vụ/hồ sơ được tạo trước nguồn UI trong `dean-design-first.json`; popup và các tinh chỉnh được ghi trong `dean-refined.json`, rồi đọc design context cho phần triển khai. Không thêm thiết kế mobile.

| Thứ tự | Khung desktop | Node |
| --- | --- | --- |
| 01 | Tổng quan khoa | [84:1963](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=84-1963) |
| 02 | Học phần | [84:2088](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=84-2088) |
| 03 | Phát triển ứng dụng nâng cao | [84:2194](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=84-2194) |
| 04 | Lớp CSE301.01 | [84:2290](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=84-2290) |
| 05 | Cảnh báo học tập | [84:2440](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=84-2440) |
| 06 | Hồ sơ cá nhân | [84:2601](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=84-2601) |
| 07 | Thông báo · Popup từ chuông | [88:39](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=88-39) |

Kiểm tra cấu trúc native sau tinh chỉnh: **349 lớp chữ chỉnh sửa được, 247 container auto-layout, 3 instance button hiện có, 7 image fill logo gốc**, chỉ dùng Be Vietnam Pro, không có chữ cao 1px hoặc placeholder. Các bảng/điều khiển là node native; 7 ảnh PNG tham chiếu ở `.impeccable/review/dean/figma-*.png` phục vụ đối chiếu, không thay lớp UI và không được đưa vào bản chạy. Các SVG chính xác lấy từ Figma nằm ở `public/figma/dean`; `artifacts/figma-ledger/dean-asset-manifest.json` giữ provenance. Không tạo raster mới để ship.

`artifacts/figma-ledger/dean-structural-audit.json` lưu ID, kích thước, tọa độ và phép đếm. Canvas/layer giữ thứ tự 01 trước, từ trái sang phải rồi xuống hàng. Tại mốc bàn giao Dean, `artifacts/design-state.json` ghi tổng 44 khung và trang Dean; mốc CourseLeader sau đó bổ sung thành 54 khung, và mốc Admin/AI hiện tại là 67 khung. Các con số cấu trúc của 37 khung cũ ở trên là snapshot riêng, không phải audit lại toàn bộ 44 khung.

## Phần mở rộng Trưởng nhóm HP — 10 khung desktop native

Trang **05 · Trưởng nhóm HP** (`98:2840`) giữ Campus agenda; không tạo lại nhận diện hoặc trang mobile. Chín khung native đầu có trước nguồn UI; danh mục Học liệu là khung thứ mười được tạo trước module tương ứng. `artifacts/figma-ledger/course-leader-design-first.json` và `course-leader-final.json` ghi trình tự; các file `course-leader-context-*.json` giữ design context.

| Thứ tự | Khung desktop | Node |
| --- | --- | --- |
| 01 | Tổng quan | [98:1963](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=98-1963) |
| 02 | Học liệu của lớp | [98:2071](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=98-2071) |
| 03 | Rà soát học liệu | [98:2174](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=98-2174) |
| 04 | So sánh giữa các lớp | [98:2262](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=98-2262) |
| 05 | Yêu cầu điều chỉnh | [98:2361](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=98-2361) |
| 06 | Học liệu | [101:13](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=101-13) |
| 07 | Biên soạn học liệu | [98:2442](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=98-2442) |
| 08 | Tài liệu tham khảo | [98:2538](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=98-2538) |
| 09 | Hồ sơ cá nhân | [98:2642](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=98-2642) |
| 10 | Thông báo · Popup từ chuông | [98:2726](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=98-2726) |

Ledger cuối ghi **326 text node, 250 container auto-layout**, toàn bộ Be Vietnam Pro, không có chữ 1px; bảng và form chỉnh sửa được. Canvas/layer giữ thứ tự 01 trước, trái sang phải rồi xuống hàng. 44 khung cũ được giữ; phép đếm CourseLeader không phải audit mới toàn bộ 54 khung. Các tinh chỉnh đã ghi gồm chiều cao textarea, danh mục và điểm bám sidebar.

Ba SVG xuất chính xác từ Figma ở `public/figma/course-leader`, chín SVG có sẵn dùng lại từ `public/figma/dean`; `artifacts/figma-ledger/course-leader-assets.json` giữ đường dẫn và URL nguồn. Logo VJU dài có sẵn được dùng nguyên hình; không thêm raster mới vào bản chạy. Mười ảnh `figma-*.png` trong `.impeccable/review/course-leader/` là tham chiếu toàn khung, không phải ảnh UI được ship thay node native.

Finish reviewer đã đối chiếu 10 ảnh Figma với 16 ảnh runtime và nguồn; disposition `ship` ở phạm vi local. Browser có khác biệt nhỏ về vị trí nội dung, độ cao hàng bảng và control thực nhưng giữ cấu trúc/ngữ cảnh, không phải cam kết pixel-perfect. Mười màn của vai trò mới đã có thiết kế bàn giao. Panel trả lời mới ở màn Bài học giảng viên được kiểm bằng browser capture `teacher-reply.png`; khung Figma Bài học giảng viên cũ chưa bổ sung panel đó. Không khẳng định mọi màn giảng viên cũ đã đồng bộ lại.

## Admin & Hệ thống AI — 13 khung desktop native · 30/10

Trang **06 · Admin & Hệ thống AI** (`119:1967`) mở rộng Campus agenda đỏ/trắng/be. `artifacts/admin-ai/design-first.json` ghi các frame dựng trước UI; `design-final.json` ghi trạng thái cuối. Giữ 54 khung desktop cũ; không tạo mobile Figma. Các PNG review là tham chiếu, không thay node native hoặc asset ship.

| Thứ tự | Khung | Node |
| --- | --- | --- |
| 01 | Quản lý tài khoản | [119:1968](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-1968) |
| 02 | Import tài khoản | [119:2056](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2056) |
| 03 | Quản lý tài khoản GV001 | [119:2129](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2129) |
| 04 | Học phần & lớp | [119:2180](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2180) |
| 05 | CSE301 · Phát triển ứng dụng nâng cao | [119:2242](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2242) |
| 06 | Lớp CSE301.01 | [119:2318](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2318) |
| 07 | Import sinh viên vào lớp CSE301.01 | [119:2402](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2402) |
| 08 | Nhắc hạn học tập | [119:2465](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2465) |
| 09 | Nhật ký nhắc hạn | [119:2518](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2518) |
| 10 | Trợ lý học tập AI | [119:2571](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2571) |
| 11 | Luyện tập từ học liệu | [119:2631](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2631) |
| 12 | Chấm nháp và phản hồi | [119:2686](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2686) |
| 13 | Phân tích học tập | [119:2743](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8?node-id=119-2743) |

Cấu trúc cuối: **364 lớp TEXT chỉnh sửa được, 217 auto-layout container**, chỉ Be Vietnam Pro, không có `badText`. 13 ảnh `figma-*.png` trong `.impeccable/review/admin-ai/` được dùng khi review. Bản cuối giữ một đề xuất chấm nháp và disclosure trợ lý mô phỏng bằng chữ native.

Các khung thể hiện mẫu tác vụ; runtime kế thừa sidebar/header/component hiện có và thích ứng responsive. Không tuyên bố pixel-copy hoặc mọi trạng thái đã thiết kế; chưa nối prototype đầy đủ, sửa Figma không tự cập nhật code. Figma và suite xanh không chứng minh AD-07–AD-10 đã tích hợp xuyên vai trò; xem [matrix](requirements.md).
