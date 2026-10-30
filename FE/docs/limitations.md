# Giới hạn của bản frontend

Bản hiện tại phục vụ trình diễn và kiểm tra luồng UI. [Bảng 121 yêu cầu](requirements.md) là nguồn tra cứu phần nào còn thiếu.

## Backend và tài khoản

Chưa có backend Java, API hoặc cơ sở dữ liệu. Giao diện đăng nhập dùng bốn tài khoản fixture, phân vai trò từ tài khoản và chặn route khác vai trò ở phía frontend. sessionStorage chỉ giữ mã tài khoản; không có xác thực hay phân quyền máy chủ. Đổi mật khẩu chỉ minh họa, lần đăng nhập đầu chưa bị bắt buộc đổi. Quên mật khẩu hướng dẫn liên hệ Admin; không gửi email/OTP.

Đã có workspace Trưởng khoa TK-01–TK-04 và Trưởng nhóm HP (CourseLeader) TN-01–TN-08, trong đó TN-08 mới một phần. Chưa có màn Admin; không có vai trò Trưởng bộ môn riêng hoặc CRUD quản trị.

## Dữ liệu và đồng bộ

`localStorage` dưới khóa `vju-learning-demo-v1` lưu trạng thái demo. Tab cùng origin/hồ sơ trình duyệt nhận `storage` event. Khác trình duyệt, origin, thiết bị hoặc tài khoản thật không đồng bộ. Không có xử lý xung đột nhiều người dùng hoặc bảo đảm lưu trên máy chủ. Nếu bộ nhớ đầy, chỉ giữ thay đổi trong phiên hiện tại và báo người dùng.

Dữ liệu lớp/học kỳ, danh sách sinh viên và nhiều thống kê là mẫu. Phiên tự học và bài tập có tiến độ/kết quả theo id nhưng học liệu/đề vẫn dùng chung nội dung RESTful API cố định. Bảng điểm có hai lớp fixture CSE301.01/CSE301.02, lọc và xuất Excel theo lựa chọn. Trong lớp CSE301.01, điểm của sv1 ghép phiên `s1` và bài `a1` động với các dòng mẫu; chưa tổng hợp tự động tất cả phiên/bài mới. Báo cáo tiến độ có số liệu mẫu và không thay thế nhật ký học thật.

## Trưởng khoa và phạm vi dữ liệu

`facultyClasses` ghép các roster có tên sẵn thành 3 học phần/4 lớp đại diện của học kỳ I. Dữ liệu khởi tạo có 12 SV không trùng, 23 lượt ghi danh; hoàn thành 67% là trung bình tiến độ của 23 lượt, không phải trung bình không trọng số giữa học phần. Học kỳ II trả tập rỗng, không dựng dữ liệu lịch sử giả. Bộ đếm cảnh báo phân biệt 7 dòng SV–lớp với 4 SV cần hỗ trợ.

Đây là phạm vi minh họa giám sát, không phải toàn bộ dữ liệu nhà trường. Tổng quan/thẻ lớp giảng viên cũ còn các số mẫu 110/36/42/32; chúng không phải tổng của roster đại diện Trưởng khoa. Chưa đồng nhất mọi thống kê cũ thành một tập dữ liệu sản xuất toàn hệ thống.

Trong CSE301.01, `sv1` dùng tên hồ sơ SV, tiến độ `studyFor(data, "s1")` và cùng hàm `assignmentAverage` với phần điểm hiện có (8.5, 9 và kết quả a1 nếu có). Các roster học phần khác là mẫu; thay đổi tự học không lan sang mọi dòng cùng SV ở học phần khác. Ngưỡng tiến độ **dưới 50% hoặc điểm dưới 5** là giả định fixture được hiển thị rõ, không phải chính sách học vụ đã được trường xác nhận. Không gửi email, không tạo can thiệp hoặc sửa học phần/lớp/tài khoản từ workspace này.

Hồ sơ `deanProfile` và cờ đọc `readDeanNotices` lưu trong cùng kho localStorage với các trường riêng, không phải kho tài khoản máy chủ. Cờ đã đọc là một cờ cho workspace, chưa theo từng sự kiện cảnh báo mới. Bộ lọc/ngữ cảnh học kỳ trong URL hỗ trợ xem và tải lại, không giới hạn quyền truy cập dữ liệu ở máy chủ.

## Trưởng nhóm HP và điều phối học liệu

`coordination` lưu hai học phần được phân công (`cs301`, `cs204`), ba lớp và chín học liệu ban đầu, không phải danh mục nội dung toàn trường. Mức M0 Chưa rà soát, M1 Đang xử lý, M2 Cần điều chỉnh, M3 Đạt chuẩn là định nghĩa đã chốt cho bản này; workbook chỉ yêu cầu cụ thể hóa và ghi SRS chưa định nghĩa. Không dùng 2a/2b hoặc coi mức này là chính sách học vụ chính thức.

Yêu cầu điều chỉnh, nội dung sửa và trả lời được dùng chung giữa workspace TN001 và panel mới của GV001 trên `/giang-vien/bai-hoc`. GV sở hữu mới được trả lời theo kiểm tra local. Yêu cầu → M2; GV sửa/trả lời → M1; TN duyệt M3 đóng yêu cầu. Không duyệt M3 khi chưa trả lời; dấu hoàn thành lớp cần đủ ba loại, mọi học liệu M3 và không có yêu cầu mở. Tạo/sửa/yêu cầu/rà soát làm mất dấu hoàn thành; không có nhật ký kiểm toán bất biến, cơ chế khóa/xung đột hoặc phê duyệt máy chủ.

Đây là kho điều phối tách khỏi các Lesson/Question/Assignment cũ đang có phạm vi toàn cục. Panel giảng viên sửa đúng cùng bản ghi điều phối, nhưng thay đổi đó chưa cập nhật slide sinh viên, đề có cấu trúc, ngân hàng câu hỏi hay điểm. TN-08 hiện có tạo/sửa tiêu đề/nội dung chữ cho slides, quiz và đề bài tập; không có trình nhập/xử lý PDF/PPT, quiz tương tác, chấm điểm hoặc AI tương đương toàn bộ công cụ GV. Tài liệu là tên và URL HTTP/HTTPS hoặc đường dẫn PDF `/materials/`, có kiểm URL; chưa upload/lưu tệp mới, không bảo đảm nội dung hay tính sẵn có của URL ngoài.

`editable` khóa sửa trực tiếp ở cả UI/model, ví dụ `api2-slides`; đó là quyền fixture, không phải server authorization. Phạm vi URL/ID và route guard cũng chỉ kiểm phía trình duyệt. Dữ liệu lưu cùng khóa localStorage hiện có; giá trị mặc định mới được ghép khi tải dữ liệu cũ. `leaderProfile` và `readLeaderNotices` tách trường với vai trò khác; cờ đọc là theo workspace, chưa có inbox sự kiện máy chủ. Không gửi email hoặc tin nhắn ra ngoài. Khác thiết bị/tài khoản thật chưa đồng bộ.

Mười khung desktop Figma của vai trò mới là trạng thái đại diện, không phải mọi route/nhánh. Panel trả lời mới ở trang Bài học giảng viên đã có source/browser evidence nhưng khung Figma giảng viên cũ chưa được cập nhật panel này. Trình duyệt được kiểm responsive 1440/390 và ảnh 800px; không có khung Figma mobile mới.

## AI và học liệu

Không gọi model, không RAG, không đánh giá ngữ nghĩa, không sinh đề hay phân tích kết quả thật. Chat trả lời cố định; giới hạn mô phỏng được ghi trong tài liệu kỹ thuật, bộ lọc phạm vi chỉ dùng từ khóa. Nút đánh giá/báo lỗi phản hồi AI chưa lưu đánh giá. Lịch sử chat dùng chung dữ liệu demo, chưa tách lớp hoặc phiên.

Slide sinh viên là bốn trang HTML minh họa. Rail trang là thẻ số/tên, không phải thumbnail PDF. Trình soạn bài xem trước PDF qua object URL, không upload, không sửa/sắp xếp trang trong PDF gốc, không duy trì tệp sau tải lại. Danh sách tên trang biên soạn chỉ giữ trong component state và chưa truyền nội dung trang sang màn sinh viên. Video YouTube được thêm như liên kết tài liệu, chưa có player nhúng trong bài học.

Tài liệu tham khảo hỗ trợ thêm liên kết và xóa; chưa upload tệp mới, chỉnh sửa hoặc sắp xếp tài liệu. Ảnh phản hồi kiểm tra số lượng/dung lượng nhưng chỉ lưu tên, không lưu nội dung ảnh và không xem ảnh được.

## Bài tập và điểm

Mọi bài tập mới dùng chung bộ ba câu mẫu với điểm cố định 4/3/3. Chưa tùy chỉnh bố cục đề, import đề hoàn chỉnh hoặc ngẫu nhiên hóa dù có lưu cờ yêu cầu. Import ngân hàng câu hỏi hỗ trợ XLSX/CSV theo cấu trúc xuất; export hiện là XLSX. Parser CSV đơn giản, không hỗ trợ mọi trường hợp ô nhiều dòng.

Trắc nghiệm và điền trống chấm bằng đáp án có sẵn; tự luận chờ giảng viên nhập điểm và nhận xét. Kết quả chưa đầy đủ điểm/trạng thái đúng sai và phản hồi riêng từng câu. Luyện tập có chọn phạm vi nhưng bộ câu hỏi không thay đổi theo lựa chọn; phản hồi sau nộp, chưa có sinh bộ mới khác nội dung. Giới hạn lượt được lưu nhưng danh sách sau nộp ưu tiên Xem kết quả, chưa có luồng làm lại đầy đủ.

Phúc khảo được lưu ở cấp bài tập. Các nút trên từng câu chưa lưu id câu, câu trả lời hoặc điểm AI riêng. Chấm lại thay tổng điểm bài tập; chưa phải quy trình sửa điểm từng câu. Bảng điểm chưa tách cột Họ đệm/Tên.

## Phiên trực tiếp và thời gian

Phiên hỏi trên lớp chỉ là mô phỏng đồng bộ tab, với mã mẫu `261016`. QR chứa URL của origin đang chạy: máy khác không thể dùng `127.0.0.1` để tham gia vào dữ liệu của máy giảng viên. Ngưỡng “tất cả đã trả lời” là bốn lượt mẫu, không theo sĩ số tham gia thật. Chưa có tỷ lệ đúng dạng số và lịch sử poll nhiều câu/người dùng.

Timer và trạng thái mở/đóng dựa vào đồng hồ và render của trình duyệt. Timer bài tập tự nộp khi tab đang chạy hoặc khi mở lại draft hết hạn. Tab sinh viên đã tham gia phiên trực tiếp có thể ghi không trả lời lúc hết giờ; không có tác vụ máy chủ khi đóng tab. Phiên tự học chưa có scheduler cập nhật server. Mất mạng chỉ hiện thông báo và giữ thao tác cục bộ, chưa có retry/reconnect thật tới máy chủ.

## Kiểm chứng giao diện

Kiểm tra route mẫu ở desktop 1440px và mobile 390px, thêm ảnh runtime Trưởng khoa/Trưởng nhóm HP ở 800px xác nhận các route mẫu không lỗi JavaScript hoặc tràn toàn trang. Đây không phải kiểm chứng mọi kích thước, trình duyệt, thiết bị thật hoặc chứng nhận WCAG. Một số metadata đang nhỏ (8–11px); cần rà thêm khả năng đọc, zoom và screen reader trước khi triển khai thực tế. Thiết kế Figma là bản bàn giao trực quan, không phải bằng chứng mọi trạng thái nghiệp vụ đã triển khai.
