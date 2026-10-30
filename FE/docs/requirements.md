# Đối chiếu yêu cầu SRS với bản frontend

Nguồn: `../SRS_Checklist_Flipped_Classroom.xlsx`, các sheet **Sinh viên**, **Giảng viên**, **Trưởng khoa** và **Trưởng nhóm HP**, cột **Mã** và **Hạng mục kiểm tra**. Đọc workbook ở chế độ chỉ đọc; không dùng cột “Hiện trạng hệ thống” của bản cũ để kết luận cho bản FE mới. Bảng dưới giữ nguyên mã và nội dung từng yêu cầu.

Đối chiếu SV/GV ban đầu: 16/10/2026; cập nhật đăng nhập, bổ sung TK-01–TK-04 và TN-01–TN-08: 24/10/2026. Tổng cộng **65 SV + 44 GV + 4 TK + 8 TN = 121 yêu cầu**. Đây là đánh giá phạm vi FE, không phải xác nhận nghiệm thu toàn bộ SRS hoặc backend.

## Cách đọc trạng thái

- **FE đã triển khai**: thao tác hoặc quy tắc hoạt động trong trình duyệt trên dữ liệu demo; không suy ra có API, xác thực hoặc bảo vệ máy chủ.
- **Mô phỏng**: có luồng minh họa nhưng kết quả dùng mẫu cố định hoặc chỉ đồng bộ cục bộ thay cho AI/realtime thật.
- **Một phần**: đã có một phần yêu cầu, chi tiết còn thiếu được ghi rõ.
- **Chưa triển khai**: chưa có luồng thực hiện đúng yêu cầu, dù có thể có nút dẫn tới chức năng liên quan.

## Sinh viên — 65 mục

| Mã | Yêu cầu nguyên văn | Route | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- | --- | --- |
| SV-01 | Đăng nhập bằng mã SV + mật khẩu | `/dang-nhap` | Mô phỏng | Kiểm tra tài khoản fixture 23110149 và mật khẩu; không xác thực máy chủ. |
| SV-02 | Tài khoản do Admin cấp (không tự đăng ký) | `/dang-nhap` | FE đã triển khai | Thông báo tài khoản do Admin cấp; không có đăng ký tự do. |
| SV-03 | Đăng nhập lần đầu bắt buộc đổi mật khẩu mặc định (AF-2) | `/doi-mat-khau` | Một phần | Có trang minh họa đổi mật khẩu; chưa phát hiện lần đăng nhập đầu hay bắt buộc chuyển trang. |
| SV-04 | Sai mật khẩu báo lỗi; quên mật khẩu → liên hệ Admin | `/dang-nhap` | Một phần | Sai mật khẩu fixture bị từ chối; có hướng dẫn liên hệ Admin, chưa có khôi phục tài khoản máy chủ. |
| SV-05 | Menu hiển thị theo role | `/sinh-vien/tong-quan` | FE đã triển khai | Role lấy từ tài khoản fixture SV/GV/TK/TN, guard chuyển route khác role về tổng quan đúng; không phải phân quyền máy chủ. |
| SV-06 | Danh sách Phiên tự học AI theo học phần | `/sinh-vien/tu-hoc` | Một phần | Danh sách phiên và lọc trạng thái; nội dung gắn học phần mẫu CSE301. |
| SV-07 | Tổng quan phiên: tên bài, tiến độ, thời hạn, trạng thái | `/sinh-vien/tu-hoc` | FE đã triển khai | Có tên, tiến độ theo phiên, hạn và trạng thái theo thời gian. |
| SV-08 | Nút "Bắt đầu học" / "Tiếp tục" | `/sinh-vien/tu-hoc` | FE đã triển khai | Bắt đầu/Tiếp tục mở trình học và khôi phục tiến độ cục bộ. |
| SV-09 | Hoàn thành 100% → "Completed", tính điểm tự học | `/sinh-vien/hoc/cs301` | Một phần | Ghi completedAt và hoàn thành 4 trang; bảng điểm hiện dùng một phiên động và các phiên mẫu. |
| SV-10 | AF-1: Hết hạn vẫn xem được nhưng không tính điểm | `/sinh-vien/hoc/cs301` | Một phần | Hỗ trợ học muộn/xem lại, không tính điểm muộn; trang chưa mở trong rail vẫn chịu khóa tiến độ. |
| SV-11 | AF-2: Đã hoàn thành vẫn vào xem lại để ôn | `/sinh-vien/hoc/cs301` | FE đã triển khai | Phiên hoàn thành cho xem lại các trang, không ghi đè mốc hoàn thành. |
| SV-12 | Hiển thị slide + nút Trang trước / Trang sau | `/sinh-vien/hoc/cs301` | FE đã triển khai | Trình chiếu HTML minh họa 4 trang, có Trang trước/Trang sau; không đọc trang PDF upload. |
| SV-13 | Thanh danh sách slide (thumbnail) bên trái | `/sinh-vien/hoc/cs301` | Một phần | Rail bên trái có số/tên trang và trạng thái; là thẻ nội dung, không ảnh thu nhỏ PDF. |
| SV-14 | Ghi nhận slide đã xem để tính tiến độ | `/sinh-vien/hoc/cs301` | FE đã triển khai | Ghi tiến độ khi xác nhận chuyển/hoàn thành trang; lưu theo phiên. |
| SV-15 | Nút "Chat với AI" và "Hỏi trên lớp" dùng được mọi lúc | `/sinh-vien/hoc/cs301` | FE đã triển khai | Tab Chat AI và nút Hỏi trên lớp luôn có trong màn học; trên điện thoại các vùng xếp dọc. |
| SV-16 | Slide có quiz phải trả lời mới qua slide tiếp | `/sinh-vien/hoc/cs301` | FE đã triển khai | Câu hỏi đã duyệt gắn trang yêu cầu xác nhận trước khi tiến trang. |
| SV-17 | Trắc nghiệm A/B/C/D, bấm xác nhận | `/sinh-vien/hoc/cs301` | FE đã triển khai | Bốn lựa chọn A–D và nút xác nhận. |
| SV-18 | Hiện đúng/sai + giải thích ngay | `/sinh-vien/hoc/cs301` | FE đã triển khai | Hiện phản hồi đúng/sai cùng giải thích của câu hỏi ngay sau xác nhận. |
| SV-19 | AF-1: Sai vẫn cho đi tiếp nhưng ghi nhận | `/sinh-vien/hoc/cs301` | FE đã triển khai | Sai vẫn tiến trang được; lưu lựa chọn trong answers theo id câu hỏi. |
| SV-20 | Panel chat mở từ màn học slide | `/sinh-vien/hoc/cs301` | FE đã triển khai | Chat là tab trong panel bên cạnh màn học. |
| SV-21 | Context = slide đang xem + toàn bộ học liệu lớp | `/sinh-vien/hoc/cs301` | Mô phỏng | Chọn phản hồi cố định theo trang; không RAG, không truy xuất toàn bộ học liệu lớp. |
| SV-22 | Hỏi nhiều lượt (multi-turn) | `/sinh-vien/hoc/cs301` | Mô phỏng | Gửi được nhiều lượt; câu trả lời không suy luận từ lịch sử hội thoại. |
| SV-23 | Lưu lịch sử chat | `/sinh-vien/hoc/cs301` | FE đã triển khai | Lịch sử câu hỏi/trả lời lưu localStorage; chưa tách lịch sử theo lớp/phiên. |
| SV-24 | Có thể kèm câu hỏi mở khuyến khích tư duy | `/sinh-vien/hoc/cs301` | Mô phỏng | Phản hồi mẫu trong phạm vi có câu hỏi gợi mở cố định. |
| SV-25 | AF-1: Đánh giá (rating/flag) câu trả lời | `/sinh-vien/hoc/cs301` | Một phần | Có nút hữu ích/báo lỗi; chỉ hiện thông báo, không lưu rating/flag. |
| SV-26 | EX-1: Ngoài phạm vi → "hãy hỏi giảng viên" | `/sinh-vien/hoc/cs301` | Mô phỏng | Regex từ khóa điều hướng ngoài phạm vi sang giảng viên; không phải guardrail AI thật. |
| SV-27 | Disclaimer "Chat AI có thể mắc lỗi…" | `/sinh-vien/hoc/cs301` | FE đã triển khai | Hiện cảnh báo AI có thể mắc lỗi; giới hạn phản hồi cố định được ghi trong tài liệu kỹ thuật. |
| SV-28 | Nút "Hỏi trên lớp" tại slide đang xem | `/sinh-vien/hoc/cs301` | FE đã triển khai | Hỏi trên lớp mở form ngay tại trang đang xem. |
| SV-29 | Form tự gắn slide + ô nhập câu hỏi | `/sinh-vien/hoc/cs301` | FE đã triển khai | Form tự gắn số trang và nhận nội dung câu hỏi. |
| SV-30 | Cập nhật số lượng kiến thức mờ | `/sinh-vien/hoc/cs301` | FE đã triển khai | Số kiến thức mờ cập nhật từ danh sách gaps cục bộ. |
| SV-31 | Popup "Kiến thức mờ (X)": nội dung, slide, ngày, trạng thái | `/sinh-vien/hoc/cs301` | Một phần | Popup có nội dung, trang, trạng thái và giải đáp; chưa lưu/hiện ngày tạo. |
| SV-32 | Bấm mục để nhảy tới slide | `/sinh-vien/hoc/cs301` | FE đã triển khai | Chọn số trang trong popup nhảy đến trang tương ứng. |
| SV-33 | Nút "Tạo câu hỏi luyện tập", chọn phạm vi slide | `/sinh-vien/luyen-tap` | Một phần | Có chọn phạm vi và tạo bộ mẫu; đổi phạm vi chưa thay đổi bộ câu hỏi cố định. |
| SV-34 | AI sinh trắc nghiệm + điền trống kèm đáp án | `/sinh-vien/luyen-tap` | Mô phỏng | Bộ mẫu có trắc nghiệm/điền trống/tự luận và đáp án; không sinh bằng AI. |
| SV-35 | Quiz tương tác: đúng/sai + giải thích ngay; tổng kết; "Tạo bộ mới" | `/sinh-vien/luyen-tap` | Một phần | Nộp để xem đáp án/điểm tự chấm và làm lại; chưa phản hồi ngay từng câu hoặc sinh bộ mới khác nội dung. |
| SV-36 | Không tính điểm, không giới hạn lần | `/sinh-vien/luyen-tap` | FE đã triển khai | Luyện tập không ghi assessment tính điểm, không giới hạn lần làm lại. |
| SV-37 | Danh sách tài liệu: tên, mô tả, loại (File / Liên kết) | `/sinh-vien/tai-lieu` | FE đã triển khai | Bảng tên, mô tả, loại PDF/liên kết/video và tìm kiếm. |
| SV-38 | File → tải/mở; Liên kết → mở tab mới | `/sinh-vien/tai-lieu` | FE đã triển khai | Mở tab mới; PDF mẫu có nút tải. |
| SV-39 | Tham gia bằng mã phiên hoặc quét QR | `/sinh-vien/tren-lop` | Mô phỏng | Nhập mã 6 số hoặc mở URL từ QR; chỉ chạy cùng origin/hồ sơ trình duyệt. |
| SV-40 | Màn đếm ngược + 4 nút A/B/C/D + "Xác nhận" | `/sinh-vien/tren-lop` | FE đã triển khai | Đếm ngược, bốn nút A–D, nút xác nhận. |
| SV-41 | Đã gửi → "Đã gửi"; GV chuyển câu → tự cập nhật | `/sinh-vien/tren-lop` | Mô phỏng | Đã gửi khóa trả lời; đổi câu đồng bộ qua storage event giữa các tab, chưa có server. |
| SV-42 | AF-1: Mã sai/hết hạn báo lỗi | `/sinh-vien/tren-lop` | FE đã triển khai | Báo lỗi khi mã sai hoặc phiên chưa active; chưa có thời hạn riêng cho mã phiên. |
| SV-43 | AF-2: Vào giữa chừng vẫn trả lời nếu còn giờ | `/sinh-vien/tren-lop` | Mô phỏng | Tab sinh viên tham gia giữa phiên có thể trả lời nếu đồng hồ còn giờ. |
| SV-44 | AF-3: Hết giờ → ghi nhận "không trả lời" | `/sinh-vien/tren-lop` | Mô phỏng | Tab sinh viên đã tham gia đang chạy ghi sv1=-1 khi hết giờ; không có job server cho tab đã đóng. |
| SV-45 | EX-1: Mất mạng, kết nối lại trước hết giờ vẫn trả lời | `/sinh-vien/tren-lop` | Một phần | Hiện trạng thái offline và tiếp tục cục bộ; không có cơ chế mất mạng/kết nối lại tới máy chủ. |
| SV-46 | Giao diện tối ưu điện thoại | `/sinh-vien/tren-lop` | FE đã triển khai | Responsive một cột; đã có kiểm tra viewport 390px, chưa xác nhận thiết bị thật. |
| SV-47 | Menu "Bài tập" ghi rõ "Tính điểm", tách với luyện tập | `/sinh-vien/bai-tap` | FE đã triển khai | Danh sách và sidebar có nhãn Tính điểm; Luyện tập là mục riêng. |
| SV-48 | Giao diện thi: câu hỏi + đồng hồ đếm ngược | `/sinh-vien/lam-bai?bai=a1` | FE đã triển khai | Đề ba câu cùng đồng hồ; deadline lưu trong draft của từng bài. |
| SV-49 | Trắc nghiệm + điền trống + tự luận | `/sinh-vien/lam-bai?bai=a1` | FE đã triển khai | Có radio trắc nghiệm, ô điền trống và textarea tự luận. |
| SV-50 | Chặn dán (paste) | `/sinh-vien/lam-bai?bai=a1` | FE đã triển khai | onPaste chặn sự kiện dán khi cấu hình preventPaste; không thay thế kiểm soát phía server. |
| SV-51 | Hết giờ tự nộp | `/sinh-vien/lam-bai?bai=a1` | FE đã triển khai | Timer tự nộp trong tab đang chạy; tải lại khôi phục deadline và nộp nếu đã hết giờ. |
| SV-52 | AI chấm tự động + giải thích + phản hồi cá nhân từng câu | `/sinh-vien/ket-qua?bai=a1` | Một phần | TN/điền trống chấm bằng đáp án cố định; tự luận giảng viên duyệt, AI chỉ gợi ý mẫu. |
| SV-53 | Giới hạn số lần làm | `/sinh-vien/bai-tap` | Một phần | Lưu attempts riêng từng bài và chặn giới hạn; sau lần nộp đầu danh sách ưu tiên Xem kết quả, chưa có luồng làm lại đầy đủ. |
| SV-54 | Điểm tổng, tỷ lệ đúng, số câu | `/sinh-vien/ket-qua?bai=a1` | Một phần | Có tổng điểm và số đúng/2 câu tự chấm; chưa hiện tỷ lệ đúng toàn bộ 3 câu. |
| SV-55 | Từng câu: loại, Đúng/Sai, điểm, đáp án đúng, giải thích, phản hồi | `/sinh-vien/ket-qua?bai=a1` | Một phần | Hiện loại, bài làm, giải thích, duyệt tự luận/nhận xét; thiếu đầy đủ điểm và đúng/sai riêng từng câu, phản hồi AI cá nhân. |
| SV-56 | Hiện trạng thái + điểm mới của câu đã phúc khảo | `/sinh-vien/ket-qua?bai=a1` | Một phần | Hiện trạng thái/phản hồi và tổng điểm mới; phúc khảo chưa liên kết từng câu. |
| SV-57 | Nút "Yêu cầu phúc khảo" tại từng câu | `/sinh-vien/ket-qua?bai=a1` | Một phần | Mỗi thẻ có nút nhưng tất cả tạo yêu cầu cấp bài tập, không lưu id câu. |
| SV-58 | Form: câu hỏi, câu trả lời, điểm AI, lý do | `/sinh-vien/ket-qua?bai=a1` | Một phần | Có form lý do; không hiển thị và lưu đầy đủ câu trả lời/điểm AI của câu được chọn. |
| SV-59 | Lưu "Pending", GV nhận thông báo | `/sinh-vien/ket-qua?bai=a1` | Mô phỏng | Lưu pending và thông báo cục bộ; giảng viên thấy trên cùng bộ dữ liệu demo. |
| SV-60 | Điểm tự học = phiên hoàn thành đúng hạn / tổng phiên × 10 | `/sinh-vien/diem-so` | Một phần | Hàm đúng hạn/tổng phiên ×10 đã có; bảng điểm dùng s1 động cộng ba trạng thái mẫu, chưa tổng hợp mọi phiên tạo mới. |
| SV-61 | Điểm TB bài tập = TB cộng điểm Bài tập AI | `/sinh-vien/diem-so` | Một phần | Hàm trung bình cộng đã có; UI lấy hai điểm mẫu và kết quả a1, chưa tổng hợp mọi bài mới. |
| SV-62 | Chi tiết: danh sách phiên (đúng hạn/trễ/chưa), điểm từng bài | `/sinh-vien/diem-so` | Một phần | Có chi tiết phiên và bài tập; phần lớn là dòng mẫu, chưa bao quát tất cả phiên/bài mới. |
| SV-63 | Chọn lớp, bài học, loại vấn đề (Bài giảng/Bài tập/Chat AI/Kỹ thuật/Khác) | `/sinh-vien/phan-hoi` | Một phần | Chọn lớp/loại; bài học cố định RESTful API, chưa có bộ chọn bài học. |
| SV-64 | Đính kèm tối đa 5 ảnh, tổng 5MB | `/sinh-vien/phan-hoi` | Một phần | Kiểm tra tối đa 5 ảnh và tổng 5MB; chỉ lưu tên tệp, không upload hay lưu nội dung ảnh. |
| SV-65 | Lịch sử phản hồi: trạng thái + câu trả lời GV | `/sinh-vien/phan-hoi` | FE đã triển khai | Danh sách có trạng thái và trả lời GV, cập nhật dữ liệu cục bộ. |

Trạng thái: 31 fe đã triển khai, 11 mô phỏng, 23 một phần, 0 chưa triển khai.

## Giảng viên — 44 mục

| Mã | Yêu cầu nguyên văn | Route | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- | --- | --- |
| GV-01 | Danh sách bài học trong lớp | `/giang-vien/bai-hoc` | Một phần | Danh sách bài học mẫu của CSE301; chưa quản lý độc lập nội dung từng lớp. |
| GV-02 | Tạo / sửa: tên bài học, thứ tự | `/giang-vien/bai-hoc` | FE đã triển khai | Tạo/đổi tên và đổi thứ tự bài học, lưu cục bộ. |
| GV-03 | Xoá bài học khi chưa có dữ liệu SV | `/giang-vien/bai-hoc` | FE đã triển khai | Khóa xóa nếu activity=true; bảo vệ FE theo dữ liệu mẫu, chưa có kiểm tra máy chủ. |
| GV-04 | Upload slide bài giảng | `/giang-vien/soan-bai` | Một phần | Chọn PDF tối đa 10MB và xem trước object URL; không upload hoặc lưu tệp lâu dài. |
| GV-05 | Danh sách slide bên trái, preview bên phải | `/giang-vien/soan-bai` | Một phần | Danh sách trang trái/preview phải; trang mẫu chưa trích xuất từ PDF chọn. |
| GV-06 | Thêm / xoá / sắp xếp từng slide | `/giang-vien/soan-bai` | Mô phỏng | Thêm/xóa/đổi thứ tự tên trang trong component state; không sửa PDF hoặc đồng bộ nội dung sang SV. |
| GV-07 | Thêm video YouTube | `/giang-vien/soan-bai` | Một phần | Kiểm tra URL YouTube và thêm vào tài liệu lớp; không nhúng player vào trang học. |
| GV-08 | Tạo câu hỏi quiz gắn từng slide (4 đáp án, đáp án đúng, giải thích) | `/giang-vien/ngan-hang-cau-hoi` | FE đã triển khai | CRUD câu hỏi 4 lựa chọn, đúng/giải thích, số trang 1–4. |
| GV-09 | "AI gợi ý câu hỏi" → GV rà soát, chỉnh sửa | `/giang-vien/ngan-hang-cau-hoi` | Mô phỏng | Thêm câu gợi ý cố định ở trạng thái chờ duyệt, cho sửa/duyệt; không gọi AI. |
| GV-10 | AF-1: Import / export câu hỏi Excel/CSV | `/giang-vien/ngan-hang-cau-hoi` | Một phần | Nhập XLSX/CSV theo cấu trúc và xuất XLSX; chưa có xuất CSV, parser CSV không hỗ trợ mọi biến thể. |
| GV-11 | Câu hỏi dùng lại cho poll trên lớp | `/giang-vien/tren-lop` | FE đã triển khai | Màn hỏi trên lớp dùng danh sách questions đã duyệt giống tự học. |
| GV-12 | Đặt giờ bắt đầu – kết thúc | `/giang-vien/phien-tu-hoc` | FE đã triển khai | Thiết lập mở/đóng; kiểm tra kết thúc sau bắt đầu. |
| GV-13 | Tự Active khi đến giờ bắt đầu | `/giang-vien/phien-tu-hoc` | Một phần | Trạng thái tính từ đồng hồ trình duyệt khi render; chưa có scheduler máy chủ hay bảo đảm cập nhật đúng thời điểm nếu màn không render lại. |
| GV-14 | AF-1: Gia hạn thời gian | `/giang-vien/phien-tu-hoc` | FE đã triển khai | Phiên đã công bố cho gia hạn hạn đóng, chặn rút ngắn. |
| GV-15 | AF-2: Thiết lập nhiều phiên | `/giang-vien/phien-tu-hoc` | Một phần | Tạo nhiều phiên, progress riêng; nội dung vẫn dùng chung một bài mẫu. |
| GV-16 | Cấu hình tiêu đề, thời gian làm, mở – đóng | `/giang-vien/tao-bai-tap` | FE đã triển khai | Tạo tiêu đề/thời lượng/mở/đóng và lưu bài nháp; mỗi bài có id riêng. |
| GV-17 | Bố cục theo loại câu + điểm (VD TN 16 câu – 8đ…) | `/giang-vien/tao-bai-tap` | Mô phỏng | Chỉ trình bày cấu trúc mẫu 1 TN/4đ, 1 điền/3đ, 1 luận/3đ; chưa tùy chỉnh số câu/điểm. |
| GV-18 | Chặn paste | `/giang-vien/tao-bai-tap` | FE đã triển khai | Cờ preventPaste áp dụng vào form sinh viên. |
| GV-19 | "Tạo đề mới" có AI hỗ trợ → GV rà soát | `/giang-vien/tao-bai-tap` | Mô phỏng | Có gợi ý/duyệt mẫu; đề mới dùng lại bộ ba câu cố định, chưa sinh và biên tập đề bằng AI. |
| GV-20 | "Import đề" | `/giang-vien/tao-bai-tap` | Chưa triển khai | Nút Import câu hỏi dẫn tới ngân hàng; chưa import một đề đầy đủ vào bài tập. |
| GV-21 | Nhiều đề, bật/tắt từng đề, ngẫu nhiên hoá | `/giang-vien/bai-tap` | Một phần | Nhiều bài và bật/tắt đã có; cờ random chỉ ghi yêu cầu tích hợp BE, không ngẫu nhiên hóa câu hỏi. |
| GV-22 | Thêm tài liệu: upload file hoặc dán liên kết | `/giang-vien/tai-lieu` | Một phần | Thêm URL có kiểm tra HTTP(S); không có upload tệp tài liệu tham khảo. |
| GV-23 | Tiêu đề, mô tả ngắn; sắp xếp, sửa, xoá | `/giang-vien/tai-lieu` | Một phần | Có tiêu đề/mô tả khi thêm và xóa; chưa sửa hoặc sắp xếp tài liệu. |
| GV-24 | Bấm "Hỏi trên lớp" → chọn câu hỏi, chọn lớp | `/giang-vien/tren-lop` | Một phần | Mở màn hỏi; lớp CSE301 cố định, câu lấy theo thứ tự đã duyệt, chưa chọn lớp/câu tùy ý. |
| GV-25 | Màn chiếu: câu hỏi + 4 đáp án + đếm ngược | `/giang-vien/tren-lop` | FE đã triển khai | Câu hỏi, bốn đáp án, đồng hồ và nút fullscreen. |
| GV-26 | Mã phiên (số ngắn) + mã QR | `/giang-vien/tren-lop` | Mô phỏng | Mã mẫu 261016 và QR URL; không tạo phiên phía server và không đồng bộ khác thiết bị. |
| GV-27 | "Đổi câu hỏi" chuyển câu | `/giang-vien/tren-lop` | Mô phỏng | Câu tiếp theo đổi câu và reset timer/answers, đồng bộ tab cục bộ. |
| GV-28 | Hết giờ hoặc tất cả đã trả lời → hiện kết quả | `/giang-vien/tren-lop` | Mô phỏng | Tự hiện khi hết giờ hoặc có 4 câu trả lời; 4 là ngưỡng mẫu, không phải sĩ số tham gia thật. |
| GV-29 | Số SV đã trả lời | `/giang-vien/tren-lop` | Mô phỏng | Đếm answers cục bộ, có nút thêm lượt trả lời mẫu. |
| GV-30 | Phân bố từng đáp án, tỷ lệ đúng | `/giang-vien/tren-lop` | Một phần | Biểu đồ số lượt theo lựa chọn; đánh dấu đáp án đúng, chưa có tỷ lệ đúng dạng số. |
| GV-31 | Popup danh sách, gom theo slide + số lượng | `/giang-vien/tien-do` | Một phần | Bảng gom số kiến thức mờ theo trang; danh sách chi tiết ở Phản hồi, chưa có popup nhóm. |
| GV-32 | Đánh dấu "Đã giải thích" từng mục hoặc cả nhóm | `/giang-vien/phan-hoi` | Một phần | Giải đáp từng mục bằng form; chưa có đánh dấu cả nhóm hoặc chỉ đánh dấu không nhập giải đáp. |
| GV-33 | Tiến độ tự học từng SV (tên, email, bài, % hoàn thành) | `/giang-vien/tien-do` | Một phần | Có tên/email, progress s1 động cho sv1 và người khác mẫu; chưa theo dõi mọi phiên/người dùng. |
| GV-34 | Kết quả bài tập: điểm, % đúng, thời gian nộp | `/giang-vien/tien-do` | Một phần | Có điểm bài tập; chưa tổng hợp tỷ lệ đúng/thời gian nộp trong dashboard. |
| GV-35 | Tương tác: Chat AI, quiz trên lớp, phản hồi | `/giang-vien/tien-do` | Một phần | Có số chat/phản hồi/kiến thức mờ; chưa tổng hợp quiz trên lớp theo từng SV. |
| GV-36 | Phân tích AI: nội dung sai nhiều, đề xuất | `/giang-vien/tien-do` | Mô phỏng | Khuyến nghị HTTP methods cố định, có nhãn Phân tích minh họa; không phân tích AI. |
| GV-37 | Cảnh báo SV tiến độ thấp / điểm dưới ngưỡng | `/giang-vien/tien-do` | Một phần | Bộ lọc tiến độ mẫu dưới 50% và Nhắc học tạo thông báo cục bộ; chưa ngưỡng tùy chỉnh/điểm thấp/email. |
| GV-38 | Bảng: STT, Mã SV, Họ đệm, Tên, Điểm tự học, Điểm TB bài tập | `/giang-vien/diem-so` | Một phần | Có bộ chọn hai lớp mẫu và danh sách/điểm tương ứng; STT/mã/tên gộp/điểm đã có, chưa tách Họ đệm và Tên. |
| GV-39 | Xuất Excel | `/giang-vien/diem-so` | FE đã triển khai | ExcelJS tạo/download XLSX theo lớp và tìm kiếm đang chọn; dòng động nhận diện sv1, dữ liệu còn lại minh họa. |
| GV-40 | Danh sách: thời gian, loại, trạng thái | `/giang-vien/phan-hoi` | FE đã triển khai | Danh sách có ngày, loại, trạng thái và lọc chờ/đã xử lý. |
| GV-41 | Chi tiết: lớp, bài, SV, mô tả, ảnh; trả lời; "Đã xử lý" | `/giang-vien/phan-hoi` | Một phần | Có lớp/bài/SV/nội dung và trả lời, tự đánh dấu xử lý; ảnh chỉ là tên, không xem ảnh thật. |
| GV-42 | Danh sách phúc khảo: SV, bài, câu, trạng thái | `/giang-vien/phuc-khao` | Một phần | Danh sách có SV/bài/trạng thái; trường question dùng tên bài, chưa định danh câu cụ thể. |
| GV-43 | Giữ nguyên (ghi lý do) hoặc chấm lại → tính lại điểm TB | `/giang-vien/phuc-khao` | Một phần | Giữ nguyên/chấm lại và phản hồi cập nhật tổng điểm bài; điểm TB chỉ tổng hợp a1 cùng hai điểm mẫu. |
| GV-44 | SV nhận thông báo kết quả | `/giang-vien/phuc-khao` | Mô phỏng | Tạo thông báo cục bộ kết quả và hiện phía SV; chưa gửi sự kiện/email máy chủ. |

Trạng thái: 11 fe đã triển khai, 10 mô phỏng, 22 một phần, 1 chưa triển khai.

## Trưởng khoa — 4 mục

Nguồn bổ sung: sheet **Trưởng khoa**, vùng **B2:I5**. Cột E dưới đây giữ nguyên nội dung workbook; cột “Chưa có” của hệ thống cũ không được sửa và không đại diện trạng thái FE hiện tại.

| Mã | Yêu cầu nguyên văn | Route | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- | --- | --- |
| TK-01 | Đăng nhập với role Dean | `/dang-nhap` | Mô phỏng | TK001/12345678 có role `truong-khoa`; khôi phục phiên, đăng xuất và guard route hoạt động bằng fixture, chưa có auth máy chủ. |
| TK-02 | Tổng quan toàn khoa | `/truong-khoa/tong-quan` | FE đã triển khai | Chọn học kỳ, đếm học phần/lớp/sinh viên không trùng, hoàn thành trung bình theo lượt học và bảng so sánh học phần; dữ liệu là các roster đại diện. |
| TK-03 | Drill-down: học phần → lớp | `/truong-khoa/hoc-phan/:courseId/lop/:classId` | FE đã triển khai | Danh sách học phần → chi tiết học phần → lớp/sinh viên; tìm học phần/sinh viên, chọn lớp; giữ học kỳ trong URL và từ chối lớp không thuộc học phần. |
| TK-04 | Mức hoàn thành, cảnh báo SV yếu toàn khoa | `/truong-khoa/canh-bao` | FE đã triển khai | Tiến độ, điểm, lý do cảnh báo; lọc phụ thuộc học phần/lớp, tìm SV, mở đúng lớp. Ngưỡng `<50%` hoặc `<5` là giả định local; chưa có chính sách/API cảnh báo của trường. |

Trạng thái TK: 3 FE đã triển khai, 1 mô phỏng. Hồ sơ riêng, chuông popup và điều hướng là phần hỗ trợ dùng chung của workspace. Admin vẫn chưa triển khai. Phần Trưởng nhóm HP (CourseLeader) được đối chiếu riêng bên dưới; không có vai trò Trưởng bộ môn.

Dữ liệu khởi tạo: 3 học phần, 4 lớp, 12 sinh viên không trùng, 23 lượt ghi danh, 67% hoàn thành; 7 dòng cảnh báo theo lớp thuộc 4 sinh viên. Học kỳ II rỗng. `sv1` chỉ ghép tiến độ `s1` và điểm động vào CSE301.01; các roster khác vẫn là mẫu. Xem [giới hạn](limitations.md#trưởng-khoa-và-phạm-vi-dữ-liệu).

## Trưởng nhóm HP — 8 mục

Nguồn bổ sung: sheet **Trưởng nhóm HP**, vùng **B2:I9**. Cột yêu cầu dưới đây chép nguyên văn E2:E9 bằng cách đọc workbook chỉ đọc. Các giá trị “Chưa có” của hệ thống cũ và ghi chú “SRS chưa định nghĩa M0–M3” được giữ nguyên trong workbook; chúng không phải kết quả kiểm chứng FE hiện tại.

| Mã | Yêu cầu nguyên văn | Route | Trạng thái | Bằng chứng / giới hạn |
| --- | --- | --- | --- | --- |
| TN-01 | Đăng nhập với role CourseLeader | `/dang-nhap` | Mô phỏng | TN001/12345678 gán role `truong-nhom-hp`, guard/reload/đăng xuất; chưa có xác thực hoặc phân quyền máy chủ. |
| TN-02 | Danh sách các lớp cùng học phần | `/truong-nhom-hp/chuan-hoa?hp=cs301` | FE đã triển khai | Chọn một trong hai học phần được phân công, ma trận ba loại học liệu theo lớp; kiểm phạm vi học phần/lớp và thống kê theo dữ liệu điều phối. |
| TN-03 | Rà soát slide, quiz, đề bài tập từng lớp | `/truong-nhom-hp/chuan-hoa/:classId/hoc-lieu/:itemId` | FE đã triển khai | Đọc nội dung chữ thực của cả ba loại, xem mức/phiên bản/quyền và luồng yêu cầu; fixture chưa phải bộ slide/đề sản xuất. |
| TN-04 | So sánh giữa các lớp, yêu cầu GV điều chỉnh | `/truong-nhom-hp/so-sanh`, `/truong-nhom-hp/yeu-cau` | FE đã triển khai | So sánh cùng loại ở hai lớp khác nhau trong một học phần; yêu cầu → GV sở hữu sửa/trả lời ở `/giang-vien/bai-hoc` → rà soát lại; lưu qua reload trong cùng kho local, không gửi thông điệp ra ngoài. |
| TN-05 | Cụ thể hoá mức xử lý M0–M3 | `/truong-nhom-hp/chuan-hoa` | FE đã triển khai | M0 Chưa rà soát, M1 Đang xử lý, M2 Cần điều chỉnh, M3 Đạt chuẩn; lọc/thống kê có nhãn. Đây là định nghĩa quy trình đã chốt cho bản này, không phải quy tắc có sẵn trong SRS; không dùng 2a/2b. |
| TN-06 | Đánh dấu "Hoàn thành chuẩn hoá" | `/truong-nhom-hp/chuan-hoa/:classId` | FE đã triển khai | Chỉ hoàn thành khi đủ slides/quiz/bài tập, tất cả M3 và không còn yêu cầu mở; yêu cầu chưa trả lời chặn M3. Tạo/sửa/yêu cầu/rà soát làm mất dấu hoàn thành cũ. |
| TN-07 | AF-1: Sửa trực tiếp nội dung nếu có quyền | `/truong-nhom-hp/hoc-lieu/:itemId/sua` | FE đã triển khai | UI và model kiểm quyền/scope; `api2-slides` bị khóa sửa trực tiếp. Sửa hợp lệ tăng phiên bản, đưa về M1 để rà soát lại; đây là quyền fixture cục bộ. |
| TN-08 | Tạo / sửa nội dung, bài tập, tài liệu như GV | `/truong-nhom-hp/hoc-lieu`, `/truong-nhom-hp/tai-lieu` | Một phần | Có tạo/sửa tiêu đề và nội dung chữ slides/quiz/đề bài tập, thêm/sửa tham chiếu HTTP/HTTPS hoặc PDF `/materials/` theo học phần. Chưa có đầy đủ trình nhập PDF/PPT, ngân hàng câu hỏi có cấu trúc hay AI như công cụ GV cũ; kho điều phối riêng chưa thay Lesson/Question/Assignment toàn hệ thống. |

Trạng thái TN: **6 FE đã triển khai, 1 mô phỏng, 1 một phần**. Hồ sơ và chuông riêng là hỗ trợ workspace. Hai học phần/ba lớp/chín học liệu khởi tạo là đại diện; CSE301 có 2/6 M3 và một M2, CSE204 có một lớp nên hiển thị trạng thái thiếu lớp thứ hai khi so sánh. Xem [giới hạn](limitations.md#trưởng-nhóm-hp-và-điều-phối-học-liệu).

## Vị trí mã nguồn để kiểm tra lại

- `src/App.tsx`: tuyến đường và các màn thực tế.
- `src/Truongnhomhp/`: chuẩn hoá, rà soát/so sánh, yêu cầu, biên soạn và hồ sơ; `model.ts` kiểm phạm vi/quyền/chuyển mức/hoàn thành, `TeacherRequests.tsx` nhận trả lời giảng viên trên cùng bản ghi.
- `src/Truongkhoa/`: shell, tổng quan, học phần/lớp, cảnh báo và hồ sơ; `data.ts` tổng hợp roster/tiến độ/cảnh báo, `data.test.ts` kiểm quy tắc.
- `src/data/accounts.ts`, `src/shared/AccountProvider.tsx`: tài khoản fixture và guard theo role.
- `src/Sinhvien/HocBai.tsx`, `src/data/study.ts`: slide, quiz, chat mẫu, kiến thức mờ và ghi hoàn thành.
- `src/Sinhvien/BaiTap.tsx`, `src/data/assessment.ts`: bài tập/luyện tập, timer, kết quả và yêu cầu phúc khảo.
- `src/Giangvien/BaiHoc.tsx`, `CauHoi.tsx`, `PhienTuHoc.tsx`, `BaiTap.tsx`, `TheoDoi.tsx`: biên soạn, duyệt, cài đặt, chấm và giám sát.
- `src/shared/Account.tsx`, `Communication.tsx`, `Grades.tsx`, `LopTrucTiep.tsx`: tài khoản, tài liệu, phản hồi, bảng điểm và poll.
- `src/data/DemoProvider.tsx`: localStorage và storage event; `src/data/fixtures.ts`: dữ liệu giả định.

Xem [giới hạn](limitations.md) và [bằng chứng kiểm thử](verification.md) trước khi dùng các trạng thái làm tiêu chí nghiệm thu.
