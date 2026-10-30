# Màn hình và luồng

Router: `src/App.tsx`. URL gốc `/` và các URL gốc theo vai trò chuyển tới tổng quan. Mỗi hàng dưới là một trang nội dung; popup, tab và trạng thái không có route riêng. `cs301`, `s1`, `a1` là định danh demo.

## Tài khoản dùng chung

| Route | Màn hình | Hành vi chính |
| --- | --- | --- |
| `/dang-nhap` | Đăng nhập | Nhập mã/mật khẩu fixture; vai trò được gán theo tài khoản, không có bộ chọn role; quên mật khẩu liên hệ Admin. |
| `/doi-mat-khau` | Đổi mật khẩu lần đầu | Kiểm tra hai mật khẩu khớp và độ dài; không đổi tài khoản thật. |

## Sinh viên — `src/Sinhvien`

| Route | Màn hình | Hành vi chính |
| --- | --- | --- |
| `/sinh-vien/tong-quan` | Tổng quan | Tiếp tục học, danh sách lớp, việc cần làm, lịch minh họa. |
| `/sinh-vien/khoa-hoc` | Khóa học | Tìm/lọc và mở học phần. |
| `/sinh-vien/khoa-hoc/cs301` | Chi tiết khóa học | Ngữ cảnh lớp, nội dung theo tuần, liên kết tự học/bài tập. |
| `/sinh-vien/tu-hoc` | Phiên tự học | Danh sách, trạng thái, thời hạn và tiếp tục phiên. |
| `/sinh-vien/hoc/cs301?phien=s1` | Học bài | Bốn trang mẫu, quiz bắt buộc, ghi tiến độ, chat mẫu, kiến thức mờ, ghi chú. |
| `/sinh-vien/bai-tap` | Bài tập tính điểm | Lọc, bắt đầu, mở kết quả theo bài. |
| `/sinh-vien/lam-bai?bai=a1` | Làm bài | Draft theo bài, timer, ba loại câu hỏi và tự nộp; phải bắt đầu từ danh sách. |
| `/sinh-vien/ket-qua?bai=a1` | Kết quả | Điểm tạm/đã duyệt, đáp án, nhận xét và yêu cầu phúc khảo. |
| `/sinh-vien/luyen-tap` | Luyện tập | Bộ mẫu không tính điểm, xem đáp án và làm lại. |
| `/sinh-vien/tren-lop` | Lớp trực tiếp | Nhập mã, trả lời, đếm ngược và xem kết quả cục bộ. |
| `/sinh-vien/diem-so` | Kết quả học tập | Điểm tự học/bài tập, các dòng minh họa và xuất XLSX. |
| `/sinh-vien/tro-ly-ai` | Trợ lý học tập | Chat dùng câu trả lời cố định, lịch sử và nguồn minh họa. |
| `/sinh-vien/tai-lieu` | Tài liệu tham khảo | Tìm tài liệu, mở liên kết và tải PDF mẫu. |
| `/sinh-vien/phan-hoi` | Phản hồi và hỗ trợ | Gửi vấn đề, kiểm tra tệp ảnh, xem lịch sử/trả lời. |
| `/sinh-vien/ho-so` | Hồ sơ | Chỉnh thông tin SV cục bộ và mở luồng đổi mật khẩu. |
| `/sinh-vien/thong-bao` | Thông báo | Chuyển về Tổng quan và mở popup từ chuông; không có trang riêng. |

## Giảng viên — `src/Giangvien`

| Route | Màn hình | Hành vi chính |
| --- | --- | --- |
| `/giang-vien/tong-quan` | Tổng quan | Lịch dạy, lớp học, bài cần duyệt và việc tiếp theo. |
| `/giang-vien/lop-hoc` | Lớp học | Danh sách/tìm học phần mẫu. |
| `/giang-vien/lop-hoc/cs301` | Chi tiết lớp | Nội dung lớp và liên kết nghiệp vụ. |
| `/giang-vien/bai-hoc` | Bài học và học liệu | Tạo/đổi tên/đổi thứ tự; bảo vệ xóa khi có hoạt động SV. Panel Yêu cầu từ Trưởng nhóm HP cho GV sở hữu sửa nội dung điều phối và trả lời. |
| `/giang-vien/soan-bai` | Soạn bài | Tên bài, công bố, PDF xem trước, trang mẫu, video URL và câu hỏi. |
| `/giang-vien/phien-tu-hoc` | Quản lý phiên | Tạo, cài đặt, công bố/ẩn, gia hạn và mở báo cáo. |
| `/giang-vien/ngan-hang-cau-hoi` | Ngân hàng câu hỏi | CRUD theo trang, gợi ý mẫu cần duyệt, nhập XLSX/CSV và xuất XLSX. |
| `/giang-vien/bai-tap` | Bài tập và kiểm tra | Danh sách, công bố/ẩn, mở chấm bài theo id. |
| `/giang-vien/tao-bai-tap` | Tạo bài tập | Tiêu đề, thời gian, lượt, chặn paste và cấu trúc ba câu mẫu. |
| `/giang-vien/cham-bai?bai=a1` | Chấm bài | Duyệt điểm tự luận và nhận xét, công bố cho SV trong demo. |
| `/giang-vien/tren-lop` | Hỏi trên lớp | Mở phiên, mã/QR, fullscreen, đổi câu, hiện đáp án và thêm trả lời mẫu. |
| `/giang-vien/tien-do` | Theo dõi học tập | Bảng tiến độ, lọc cần hỗ trợ, nhắc cục bộ, đếm tương tác, xuất báo cáo. |
| `/giang-vien/diem-so` | Bảng điểm | Chọn lớp, tìm/sắp xếp sinh viên; xuất XLSX theo lớp và bộ lọc hiện tại. |
| `/giang-vien/phan-hoi` | Phản hồi và giải đáp | Trả lời phản hồi, đánh dấu xử lý, giải đáp kiến thức mờ từng mục. |
| `/giang-vien/phuc-khao` | Yêu cầu phúc khảo | Giữ nguyên/chấm lại tổng điểm và gửi thông báo cục bộ. |
| `/giang-vien/tro-ly-ai` | Trợ lý AI | Giao diện giảng dạy riêng, mở đúng học liệu giảng viên; phản hồi AI cố định. |
| `/giang-vien/tai-lieu` | Quản lý tài liệu | Thêm URL, tìm, mở hoặc xóa; chưa upload tệp mới. |
| `/giang-vien/ho-so` | Hồ sơ | Chỉnh tên/email/điện thoại cục bộ; lưu riêng hồ sơ GV và SV. |
| `/giang-vien/thong-bao` | Thông báo | Chuyển về Tổng quan, mở popup; trạng thái đã đọc riêng theo vai trò. |

## Trưởng khoa — `src/Truongkhoa`

Tài khoản `TK001` / `12345678`, role `truong-khoa`. Shell riêng dùng sidebar trắng, ba mục điều hướng và chuông popup; không có trang thông báo riêng.

| Route | Màn hình | Hành vi chính |
| --- | --- | --- |
| `/truong-khoa/tong-quan` | Tổng quan khoa | Chọn học kỳ, tổng hợp không trùng SV, so sánh tiến độ học phần, mở cảnh báo. |
| `/truong-khoa/hoc-phan` | Học phần | Tìm tên/mã và mở học phần trong học kỳ. |
| `/truong-khoa/hoc-phan/:courseId` | Chi tiết học phần | Tổng hợp học phần, chọn lớp và drill-down; ví dụ `cs301`. |
| `/truong-khoa/hoc-phan/:courseId/lop/:classId` | Chi tiết lớp | Tìm SV theo tên/mã, xem tiến độ, điểm và lý do; ví dụ `cs301/lop/CSE301.01`; cặp ID không khớp hiện trạng thái không tìm thấy. |
| `/truong-khoa/canh-bao` | Cảnh báo học tập | Lọc học phần/lớp phụ thuộc, tìm SV, đếm riêng SV và dòng cảnh báo, mở đúng lớp/SV. |
| `/truong-khoa/ho-so` | Hồ sơ cá nhân | Lưu tên/email/điện thoại vào `deanProfile`, không ghi đè hồ sơ SV/GV. |

`ky=2026-1` hoặc `ky=2026-2` giữ ngữ cảnh học kỳ qua link/reload; học kỳ II có trạng thái rỗng và nút về học kỳ I. Bộ lọc cảnh báo dùng `hp`, `lop`, `q`; link đến lớp dùng `sv` để tìm đúng sinh viên. Chuông lấy cảnh báo theo học kỳ, gom theo sinh viên; trạng thái đã đọc lưu riêng trong `readDeanNotices`. Menu tài khoản có hồ sơ, đổi mật khẩu và đăng xuất, không đổi role.

## Trưởng nhóm HP — `src/Truongnhomhp`

Tài khoản `TN001` / `12345678`, role `truong-nhom-hp`. Không chọn role thủ công; shell riêng giữ nhận diện Campus agenda và chuông popup.

| Route | Màn hình | Hành vi chính |
| --- | --- | --- |
| `/truong-nhom-hp/tong-quan` | Tổng quan | Học phần được phân công, thống kê M0–M3 và lớp cần rà soát. |
| `/truong-nhom-hp/chuan-hoa` | Chuẩn hoá học liệu | Chọn học phần, tìm/lọc mức và ma trận slides/quiz/bài tập từng lớp. |
| `/truong-nhom-hp/chuan-hoa/:classId` | Học liệu của lớp | Mở từng học liệu, mức/phiên bản/quyền, đánh dấu hoàn thành có điều kiện. |
| `/truong-nhom-hp/chuan-hoa/:classId/hoc-lieu/:itemId` | Rà soát học liệu | Đọc nội dung, chọn M0/M1/M3, gửi yêu cầu M2, xem phản hồi và sửa nếu có quyền. |
| `/truong-nhom-hp/so-sanh` | So sánh giữa các lớp | Hai lớp khác nhau trong cùng học phần, cùng loại học liệu và nội dung thực; trạng thái rõ khi chỉ có một lớp. |
| `/truong-nhom-hp/yeu-cau` | Yêu cầu điều chỉnh | Lọc yêu cầu chờ GV/chờ rà soát/đã đóng, đọc yêu cầu/phản hồi và mở học liệu. |
| `/truong-nhom-hp/hoc-lieu` | Học liệu | Danh mục theo lớp/loại, tạo mới hoặc mở sửa khi có quyền. |
| `/truong-nhom-hp/hoc-lieu/tao` | Tạo học liệu | Chọn lớp/loại, nhập tiêu đề và nội dung chữ; khởi tạo M0. |
| `/truong-nhom-hp/hoc-lieu/:itemId/sua` | Chỉnh sửa học liệu | Giữ loại, kiểm quyền/scope, tăng phiên bản và đưa về M1. |
| `/truong-nhom-hp/tai-lieu` | Tài liệu tham khảo | Thêm/sửa tên và URL HTTP/HTTPS hoặc PDF `/materials/` theo học phần; mở liên kết đã kiểm hợp lệ. |
| `/truong-nhom-hp/ho-so` | Hồ sơ cá nhân | Lưu `leaderProfile` riêng; đổi mật khẩu qua luồng chung. |

`hp=cs301` hoặc `hp=cs204` giữ phạm vi học phần; `lop` giữ lớp trong danh mục/biên soạn, `a`/`b`/`loai` giữ cặp lớp/loại so sánh, `etat` giữ bộ lọc yêu cầu. Cặp học phần/lớp/item sai hoặc học phần không được phân công hiện trạng thái phạm vi không hợp lệ và đường quay lại. Chuông mở panel nhỏ, cờ `readLeaderNotices` độc lập; không có route thông báo riêng.

M2 được tạo qua yêu cầu có nội dung. GV001 nhận yêu cầu của lớp mình ở `/giang-vien/bai-hoc`, sửa cùng bản ghi điều phối và trả lời → M1; TN001 rà soát M3 để đóng. Hoàn thành lớp yêu cầu đủ cả ba loại, mọi học liệu M3 và không có yêu cầu mở; thay đổi học liệu/trạng thái làm mất dấu hoàn thành. Học liệu và tham chiếu của workspace này chưa hợp nhất vào các kho học bài/điểm cũ; xem [giới hạn](limitations.md#trưởng-nhóm-hp-và-điều-phối-học-liệu).

## Trạng thái và màn phụ

Màn học có tab Câu hỏi/Chat AI/Ghi chú, form Hỏi trên lớp và popup danh sách kiến thức mờ. Các trang quản lý có dialog tạo/sửa, thông báo thao tác và empty state theo dữ liệu. URL lạ có màn không tìm thấy với liên kết về tổng quan.

Responsive: sidebar thành drawer dưới 800px; phần lớn nội dung thành một cột dưới 600px, bảng cuộn trong vùng riêng. Luồng tự học giữ quiz và chat trong cùng trang; trên mobile chúng xếp dưới nội dung slide.

## Bàn giao thiết kế

[File Figma](https://www.figma.com/design/l4noECFoQ384scu1ZIHeM8) chứa các màn native chỉnh sửa được. Các frame bàn giao là các trạng thái đại diện, không tương đương số route hoặc mọi nhánh tương tác. Hệ thống màu/chữ/khoảng cách và component được mô tả trong [DESIGN.md](../DESIGN.md), phần mở rộng ở `.impeccable/design.json`.

Kiểm tra route/viewport, các luồng SV/GV, chín ca Trưởng khoa và mười ca Trưởng nhóm HP được mô tả tại [verification.md](verification.md). Các thiếu hụt được ghi theo từng mã SRS tại [requirements.md](requirements.md).
