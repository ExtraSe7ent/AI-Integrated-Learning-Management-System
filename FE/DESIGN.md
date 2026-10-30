---
name: VJU Learning
description: Campus agenda — không gian vận hành học tập lớp học đảo ngược.
colors:
  red: "#a4262c"
  red-dark: "#82212a"
  red-soft: "#f9edeb"
  ink: "#292728"
  muted: "#74716e"
  line: "#e9e6e0"
  surface: "#ffffff"
  ground: "#f7f6f2"
  sage: "#eaf0e9"
  green: "#41624b"
  amber: "#8a611f"
  sand: "#f3eddf"
typography:
  display:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "54px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "13px"
    lineHeight: 1.6
  label:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "11px"
    fontWeight: 500
rounded:
  badge: "4px"
  control: "7px"
  surface: "12px"
spacing:
  compact: "8px"
  control: "12px"
  mobile-gutter: "16px"
  section: "20px"
  wide: "24px"
components:
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-primary-hover:
    backgroundColor: "{colors.red-dark}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "#4b4541"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "21px"
  nav-active:
    backgroundColor: "{colors.red-soft}"
    textColor: "{colors.red}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
---

# Design System: VJU Learning

## Overview

**Creative North Star: "Campus agenda"**

Giao diện Operate dành cho ngày học ở đại học: nhìn thấy lớp đang học, việc tiếp theo và trạng thái hoàn thành trước khi tìm thông tin bổ sung. Đỏ học thuật tạo điểm tựa, nền be ấm giữ không gian đọc bình tĩnh, các bề mặt trắng tách nội dung nghiệp vụ.

Bố cục có mật độ vừa phải, thanh điều hướng theo vai trò và ngữ cảnh học phần ổn định. Hai logo VJU được dùng nguyên hình trong khung phù hợp; không đổi màu hay kéo méo. Tên VJU Learning là nhãn làm việc của bản demo.

**Key Characteristics:**

- Thao tác chính rõ ràng, thông tin lớp và bài học luôn có ngữ cảnh.
- Đỏ định hướng hành động, trắng chứa công việc, be tạo nền đọc.
- Trạng thái có chữ; màu hỗ trợ nhận biết.
- Hành trình Trước lớp → Trong lớp → Sau lớp nối các màn học.

Nguồn chuẩn cho giá trị triển khai là `src/styles/tokens.css`, `app.css`, `learning.css` và `responsive.css`. Frontmatter mô tả token và kiểu tái sử dụng thực tế; sidecar `.impeccable/design.json` chứa motion, breakpoint và bản xem trước component.

## Colors

### Primary

- **Đỏ học thuật** (`red`): nút chính, liên kết hành động, trạng thái điều hướng hiện tại và tiến độ.
- **Đỏ trầm** (`red-dark`): hover của nút chính.
- **Đỏ giấy nhạt** (`red-soft`): nền mục đang chọn và vùng phản hồi liên quan hành động.

### Secondary

- **Xanh lá trầm** (`green`) trên **giấy xô thơm** (`sage`): hoàn thành hoặc trạng thái tích cực.
- **Hổ phách đất** (`amber`) trên **cát ấm** (`sand`): cần chú ý, chờ duyệt và nội dung AI minh họa. Một số badge dùng sắc độ riêng trong CSS.

### Neutral

- **Mực ấm** (`ink`) cho nội dung chính, **xám ấm** (`muted`) cho thông tin phụ.
- **Mặt giấy** (`surface`) chứa công việc; **nền ngà** (`ground`) phân biệt khoảng trống với panel.
- **Đường giấy** (`line`) chia bảng, sidebar và khung; không cần bóng để mọi panel có thể đọc được.

**The Labeled State Rule.** Mỗi trạng thái cần nhãn chữ; không dùng màu như tín hiệu duy nhất cho đúng/sai, chờ xử lý hoặc hoàn thành.

## Typography

Một họ **Be Vietnam Pro**, tải từ gói font cục bộ, hỗ trợ tiếng Việt. Dùng sans-serif dự phòng. Phân cấp bằng cỡ, đậm và khoảng cách; không dùng font trang trí cho nghiệp vụ.

- **Display**: lời chào ở trang đăng nhập; trên màn nhỏ giảm còn khoảng 31–33px.
- **Headline**: tiêu đề trang; trên màn nhỏ dùng 25px, riêng màn đọc có cỡ phù hợp nội dung.
- **Title**: tiêu đề khu vực; panel heading thường thu về 14px, h3 là 15px.
- **Body**: nền chữ toàn ứng dụng; đoạn văn có line-height 1.75. Một số metadata desktop hiện dùng 8–11px: đây là đặc điểm bản hiện tại, không phải cam kết đọc tốt ở mọi thiết bị.
- **Label**: nút và điều hướng; badge hiện dùng 9px. Form mobile tăng cỡ input lên 16px để tránh trình duyệt tự zoom.

Bảng, timer và mã phiên dùng chữ số có độ rộng đều khi cần so sánh. Chữ in hoa có giãn ký tự chỉ dành cho nhãn khu vực nhỏ.

## Layout

**Điều hướng theo vai trò.** Cả hai vai trò dùng sidebar trắng, chữ tối và mục hiện tại nền đỏ nhạt. Giảng viên có menu quản lý lớp, soạn học liệu và chấm điểm; sinh viên có menu học bài, tự học và làm bài tập. Trang đăng nhập dùng chung, vai trò lấy từ tài khoản sau đăng nhập. Thanh đầu chỉ hiện mục hiện tại dưới dạng nút mở điều hướng nhanh. Chuông mở panel thông báo nhỏ; không chuyển trang khi bấm chuông. Trên mobile, mọi lựa chọn trong drawer hoặc menu tài khoản đều đóng menu, kể cả mục đang chọn. Tên học phần trên bìa thẻ canh mép trên, tối đa hai dòng và dấu ba chấm; tên đầy đủ có trong tooltip và nội dung thẻ.

Desktop có sidebar cố định (238px), thanh tiện ích (73px) và vùng nội dung tối đa (1530px), đệm (30px 34px 38px). Panel thường có đệm (21px), khoảng cách dọc (22px). Các khoảng 8/12/16/20/24px lặp lại theo mức độ gần nhau; CSS hiện còn khoảng riêng theo từng màn, chưa phải một hệ spacing utility hoàn chỉnh.

Dashboard dùng cột nội dung co giãn và cột phụ (278px). Màn đọc có rail trang, slide và panel câu hỏi/chat. Form biên soạn hoặc chấm có cột thông tin phụ và vùng thao tác chính.

Breakpoint thực tế: 1600px mở rộng desktop; 1250px và 1050px giảm mật độ; 800px chuyển sidebar thành drawer và xếp lại vùng phụ; 600px là một cột cho phần lớn tác vụ. Ở điện thoại, đệm trang (22px 16px), panel (18px); rail slide cuộn ngang. Bảng nằm trong vùng cuộn riêng, không ép toàn trang tràn ngang.

**Ngữ cảnh trước thao tác.** Cho người học thấy học phần, bài học và giai đoạn trước khi thực hiện thao tác tiếp theo.

## Elevation & Depth

Ưu tiên lớp nền và đường viền. Panel ở trạng thái nghỉ không đổ bóng; menu nổi/dialog dùng bóng để phân biệt với mặt phẳng nội dung. Token bóng hiện tại: `0 12px 36px #30251d12`. Không thêm bóng cho từng thẻ hoặc dùng hiệu ứng nổi làm lu mờ nút và trạng thái.

Nút đổi nền khoảng 150ms; điều hướng khoảng 160ms; drawer khoảng 200ms; nội dung vào nhẹ 250ms. `prefers-reduced-motion: reduce` tắt animation/transition và cuộn mượt. Đây là phản hồi thao tác, không phải nội dung trình diễn.

## Shapes

Panel và vùng làm việc bo vừa (12px), nút/input/điều hướng bo nhỏ (7px), badge bo nhẹ (4px). Avatar và chấm trạng thái tròn có ý nghĩa nhận diện. Đường viền mảnh tách ô nhập, bảng và vùng liên quan. Giữ tỉ lệ gốc của logo; dùng `object-fit: contain` khi đặt trong khung.

## Components

### Buttons

Nút gọn, chữ và icon cùng một hàng, gap (8px), chiều cao thường tối thiểu (38px). Primary dùng đỏ/trắng; hover đỏ trầm. Secondary nền trắng, chữ xám ấm, viền; hover nền giấy ấm. Bản small thấp hơn (31px) dành cho thao tác phụ trong hàng. Disabled giảm opacity và đổi con trỏ.

### Inputs / Fields

Label nằm trên input, khoảng cách (7px), viền ấm, góc control; textarea cho phép thay đổi chiều cao. Focus-visible chung có outline (3px) màu đỏ nhạt `#c7787a`, offset (3px). Có lỗi bằng chữ và trường required/min/max khi áp dụng; không thay thế thông báo lỗi bằng màu viền.

### Navigation

Sidebar chia nhóm nhiệm vụ theo vai trò của tài khoản; mục active có nền đỏ nhạt, chữ đỏ và đậm hơn. Mục thường có vùng cao tối thiểu (42px). Trên mobile, nút menu mở drawer và lớp nền để đóng. Một trang đăng nhập chung, không có lựa chọn role. Menu tài khoản chỉ gồm hồ sơ, đổi mật khẩu và đăng xuất.

### Chips

Badge chỉ trạng thái hoặc ngữ cảnh, padding (3px 8px), chữ ngắn và góc badge. Nhãn đỏ, xanh, hổ phách có màu nền tương ứng. Không biến mọi metadata thành badge.

### Cards / Containers

Panel nền trắng, viền giấy, góc surface; tiêu đề và thao tác nằm chung hàng rồi tới nội dung. Mật độ bảng được giữ nhờ padding đều và cuộn vùng riêng. Trạng thái rỗng chỉ ra hành động có thể làm tiếp theo.

### Lesson journey

Ba giai đoạn Trước lớp → Trong lớp → Sau lớp dùng chấm số, đường nối và nhãn; giai đoạn hiện tại nổi bật bằng đỏ. Thành phần giúp định hướng trong học phần, không thay thế điều hướng trang hoặc bộ đếm tiến độ thật.

## Do's and Don'ts

### Do:

- **Do** giữ ngữ cảnh học phần và tên bài gần thao tác chính.
- **Do** dùng nhãn chữ cho trạng thái và nguồn phản hồi AI.
- **Do** giữ focus bàn phím rõ, form có label và hỗ trợ reduced motion.
- **Do** xếp lại nội dung trên mobile và cho bảng cuộn trong vùng riêng.

### Don't:

- **Don't** đổi màu, cắt mất nội dung hoặc kéo méo logo VJU.
- **Don't** trang trí bằng chuyển động hoặc bóng trên mọi panel.
- **Don't** dùng màu làm tín hiệu trạng thái duy nhất.
- **Don't** trình bày phản hồi mẫu, dữ liệu local hoặc thao tác demo như kết quả máy chủ thật.
