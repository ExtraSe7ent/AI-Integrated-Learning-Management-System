# Đối chiếu yêu cầu SRS với frontend · 30/10/2026

Nguồn yêu cầu: `../SRS_Checklist_Flipped_Classroom.xlsx`, đọc chỉ đọc. Bảng giữ mã và nội dung checklist, đối chiếu source hiện tại với bằng chứng kiểm thử tại [verification.md](verification.md); trạng thái hệ thống cũ trong workbook không phải kết quả nghiệm thu FE này.

Tổng **146 mục**: **65 SV + 44 GV + 4 TK + 8 TN + 10 Admin + 7 AI + 8 NFR**. Phân loại hiện tại: **79 FE cục bộ, 42 Partial FE, 20 FE mô phỏng, 1 Cần runtime, 4 BE/triển khai**. Hai mục responsive SV-46/NFR-05 được cập nhật từ chờ runtime sang đã kiểm cục bộ với phạm vi viewport giả lập giới hạn. NFR-02 ≤2 giây vẫn chưa đo. Đây không phải xác nhận hoàn tất toàn bộ SRS.

## Cách đọc

- **FE cục bộ**: hành vi được triển khai trong trình duyệt với fixture/local storage, không suy ra có xác thực, phân quyền hoặc dữ liệu máy chủ.
- **Partial FE**: còn thiếu phần của yêu cầu ngay trong frontend; cột giới hạn nêu phần đó.
- **FE mô phỏng**: có luồng và dữ liệu minh họa cho AI, email, thời gian hoặc kết nối; không có dịch vụ thật.
- **Cần runtime**: chưa đo được tiêu chí runtime của yêu cầu.
- **BE/triển khai**: cần hạ tầng/dịch vụ ngoài FE để kiểm chứng.

AD-07–AD-10 có CRUD, phân công và ghi danh hoạt động trong registry Admin, nhưng các workspace cũ chưa lấy đầy đủ danh mục/phạm vi/roster từ registry này. Đây là **khoảng trống tích hợp FE còn lại**, không phải phần chỉ cần backend. Nhiều kho học tập, hồ sơ và roster vẫn dùng chung fixture theo tài khoản/lớp cũ; tài khoản mới đăng nhập/đổi mật khẩu được nhưng chưa có dữ liệu học tập riêng đầy đủ.

Các đường dẫn trong cột source tính từ `src/`. Tham chiếu nguồn là vị trí kiểm tra lại, không phải khẳng định mọi nhánh được E2E bao phủ.

## Sinh viên

| ID | Yêu cầu | Phân loại | Route | Source chính | Giới hạn / bằng chứng |
|---|---|---|---|---|---|
| SV-01 | Đăng nhập bằng mã SV + mật khẩu | FE cục bộ | /dang-nhap | shared/Account.tsx; data/accounts.ts | Mã/mật khẩu từ registry Admin, không đăng ký, lỗi/liên hệ Admin, role guard; import/reset đặt mustChange và đổi mật khẩu lưu hash. |
| SV-02 | Tài khoản do Admin cấp (không tự đăng ký) | FE cục bộ | /dang-nhap | shared/Account.tsx; data/accounts.ts | Mã/mật khẩu từ registry Admin, không đăng ký, lỗi/liên hệ Admin, role guard; import/reset đặt mustChange và đổi mật khẩu lưu hash. |
| SV-03 | Đăng nhập lần đầu bắt buộc đổi mật khẩu mặc định (AF-2) | FE cục bộ | /doi-mat-khau | shared/Account.tsx | Mã/mật khẩu từ registry Admin, không đăng ký, lỗi/liên hệ Admin, role guard; import/reset đặt mustChange và đổi mật khẩu lưu hash. |
| SV-04 | Sai mật khẩu báo lỗi; quên mật khẩu → liên hệ Admin | FE cục bộ | /dang-nhap | shared/Account.tsx | Mã/mật khẩu từ registry Admin, không đăng ký, lỗi/liên hệ Admin, role guard; import/reset đặt mustChange và đổi mật khẩu lưu hash. |
| SV-05 | Menu hiển thị theo role | FE cục bộ | /sinh-vien/* | App.tsx; shared/Layout.tsx | Mã/mật khẩu từ registry Admin, không đăng ký, lỗi/liên hệ Admin, role guard; import/reset đặt mustChange và đổi mật khẩu lưu hash. |
| SV-06 | Danh sách Phiên tự học AI theo học phần | Partial FE | /sinh-vien/tu-hoc | Sinhvien/TuHoc.tsx | Luồng session/progress/completed/late/review thực; danh sách session chung CSE301/l2 và record chưa phân account/class đầy đủ. |
| SV-07 | Tổng quan phiên: tên bài, tiến độ, thời hạn, trạng thái | Partial FE | /sinh-vien/tu-hoc | Sinhvien/TuHoc.tsx | Luồng session/progress/completed/late/review thực; danh sách session chung CSE301/l2 và record chưa phân account/class đầy đủ. |
| SV-08 | Nút "Bắt đầu học" / "Tiếp tục" | Partial FE | /sinh-vien/tu-hoc | Sinhvien/TuHoc.tsx | Luồng session/progress/completed/late/review thực; danh sách session chung CSE301/l2 và record chưa phân account/class đầy đủ. |
| SV-09 | Hoàn thành 100% → "Completed", tính điểm tự học | Partial FE | /sinh-vien/hoc/:id; diem-so | data/study.ts; shared/Grades.tsx | Luồng session/progress/completed/late/review thực; danh sách session chung CSE301/l2 và record chưa phân account/class đầy đủ. |
| SV-10 | AF-1: Hết hạn vẫn xem được nhưng không tính điểm | Partial FE | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx; data/study.ts | Luồng session/progress/completed/late/review thực; danh sách session chung CSE301/l2 và record chưa phân account/class đầy đủ. |
| SV-11 | AF-2: Đã hoàn thành vẫn vào xem lại để ôn | Partial FE | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx; data/study.ts | Luồng session/progress/completed/late/review thực; danh sách session chung CSE301/l2 và record chưa phân account/class đầy đủ. |
| SV-12 | Hiển thị slide + nút Trang trước / Trang sau | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx | Slide HTML mẫu và trước/sau có; total/tiêu đề metadata đã nối; không claim đọc PDF upload thật. |
| SV-13 | Thanh danh sách slide (thumbnail) bên trái | Partial FE | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx | Danh sách số/tên trang, chưa thumbnail ảnh PDF thật. |
| SV-14 | Ghi nhận slide đã xem để tính tiến độ | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx; data/rules.ts | Lưu tiến độ/quiz theo session; xác nhận bắt buộc, sai vẫn đi tiếp, phản hồi/giải thích, chat panel. |
| SV-15 | Nút "Chat với AI" và "Hỏi trên lớp" dùng được mọi lúc | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx; data/rules.ts | Lưu tiến độ/quiz theo session; xác nhận bắt buộc, sai vẫn đi tiếp, phản hồi/giải thích, chat panel. |
| SV-16 | Slide có quiz phải trả lời mới qua slide tiếp | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx; data/rules.ts | Lưu tiến độ/quiz theo session; xác nhận bắt buộc, sai vẫn đi tiếp, phản hồi/giải thích, chat panel. |
| SV-17 | Trắc nghiệm A/B/C/D, bấm xác nhận | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx; data/rules.ts | Lưu tiến độ/quiz theo session; xác nhận bắt buộc, sai vẫn đi tiếp, phản hồi/giải thích, chat panel. |
| SV-18 | Hiện đúng/sai + giải thích ngay | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx; data/rules.ts | Lưu tiến độ/quiz theo session; xác nhận bắt buộc, sai vẫn đi tiếp, phản hồi/giải thích, chat panel. |
| SV-19 | AF-1: Sai vẫn cho đi tiếp nhưng ghi nhận | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx; data/rules.ts | Lưu tiến độ/quiz theo session; xác nhận bắt buộc, sai vẫn đi tiếp, phản hồi/giải thích, chat panel. |
| SV-20 | Panel chat mở từ màn học slide | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx; data/rules.ts | Lưu tiến độ/quiz theo session; xác nhận bắt buộc, sai vẫn đi tiếp, phản hồi/giải thích, chat panel. |
| SV-21 | Context = slide đang xem + toàn bộ học liệu lớp | FE mô phỏng | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx | Quy tắc trả lời theo course/keyword và nối nhiều lượt UI; không RAG/toàn học liệu/context multi-turn thật. |
| SV-22 | Hỏi nhiều lượt (multi-turn) | FE mô phỏng | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx | Quy tắc trả lời theo course/keyword và nối nhiều lượt UI; không RAG/toàn học liệu/context multi-turn thật. |
| SV-23 | Lưu lịch sử chat | Partial FE | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx | Chat lưu lâu localStorage nhưng shared fixture, chưa tách lịch sử từng account/class. |
| SV-24 | Có thể kèm câu hỏi mở khuyến khích tư duy | FE mô phỏng | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx | Gợi ý theo rule có câu khuyến khích tự giải thích. |
| SV-25 | AF-1: Đánh giá (rating/flag) câu trả lời | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx | Assistant và HocBai đã lưu rating/report thật local qua recordChatFeedback; aria-pressed phản ánh state. |
| SV-26 | EX-1: Ngoài phạm vi → "hãy hỏi giảng viên" | FE mô phỏng | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx | Có fallback hỏi GV, nguồn rỗng ngoài scope và guardrail keyword; không đảm bảo guardrail model thật. |
| SV-27 | Disclaimer "Chat AI có thể mắc lỗi…" | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx,285,482 | Disclaimer ở reader và trang Assistant. |
| SV-28 | Nút "Hỏi trên lớp" tại slide đang xem | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx,285,482 | Hỏi trên lớp tự gắn trang, form nội dung và đếm; dữ liệu vẫn cùng workspace demo. |
| SV-29 | Form tự gắn slide + ô nhập câu hỏi | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx,285,482 | Hỏi trên lớp tự gắn trang, form nội dung và đếm; dữ liệu vẫn cùng workspace demo. |
| SV-30 | Cập nhật số lượng kiến thức mờ | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx,285,482 | Hỏi trên lớp tự gắn trang, form nội dung và đếm; dữ liệu vẫn cùng workspace demo. |
| SV-31 | Popup "Kiến thức mờ (X)": nội dung, slide, ngày, trạng thái | Partial FE | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx; data/fixtures.ts | Popup nội dung/trang/trạng thái có; Gap chưa date/session/account scope. |
| SV-32 | Bấm mục để nhảy tới slide | FE cục bộ | /sinh-vien/hoc/:id | Sinhvien/HocBai.tsx | Bấm gap nhảy trang; cần validate trang khi metadata bị xóa. |
| SV-33 | Nút "Tạo câu hỏi luyện tập", chọn phạm vi slide | FE mô phỏng | /sinh-vien/luyen-tap | Sinhvien/BaiTap.tsx,247,281 | AIPractice filter pool theo scope, đổi bộ, TN/điền, kiểm từng câu/giải thích/tổng kết, không điểm/không giới hạn; sinh model thật ngoài scope. |
| SV-34 | AI sinh trắc nghiệm + điền trống kèm đáp án | FE mô phỏng | /sinh-vien/luyen-tap | Sinhvien/BaiTap.tsx,247,281 | AIPractice filter pool theo scope, đổi bộ, TN/điền, kiểm từng câu/giải thích/tổng kết, không điểm/không giới hạn; sinh model thật ngoài scope. |
| SV-35 | Quiz tương tác: đúng/sai + giải thích ngay; tổng kết; "Tạo bộ mới" | FE mô phỏng | /sinh-vien/luyen-tap | Sinhvien/BaiTap.tsx,247,281 | AIPractice filter pool theo scope, đổi bộ, TN/điền, kiểm từng câu/giải thích/tổng kết, không điểm/không giới hạn; sinh model thật ngoài scope. |
| SV-36 | Không tính điểm, không giới hạn lần | FE mô phỏng | /sinh-vien/luyen-tap | Sinhvien/BaiTap.tsx | AIPractice filter pool theo scope, đổi bộ, TN/điền, kiểm từng câu/giải thích/tổng kết, không điểm/không giới hạn; sinh model thật ngoài scope. |
| SV-37 | Danh sách tài liệu: tên, mô tả, loại (File / Liên kết) | Partial FE | /sinh-vien/tai-lieu | shared/Communication.tsx | Tên/mô tả/loại, mở link/tab/tải PDF mẫu; resource pool chung CSE301, chưa thư viện theo từng lớp mới/account. |
| SV-38 | File → tải/mở; Liên kết → mở tab mới | Partial FE | /sinh-vien/tai-lieu | shared/Communication.tsx | Tên/mô tả/loại, mở link/tab/tải PDF mẫu; resource pool chung CSE301, chưa thư viện theo từng lớp mới/account. |
| SV-39 | Tham gia bằng mã phiên hoặc quét QR | FE cục bộ | /sinh-vien/tren-lop | shared/LopTrucTiep.tsx,153 | Mã/QR, timer/A-D/confirm, sync câu mới, reset selected, late join, timeout participant -1; phiên mã cứng demo chưa vòng đời BE. |
| SV-40 | Màn đếm ngược + 4 nút A/B/C/D + "Xác nhận" | FE cục bộ | /sinh-vien/tren-lop | shared/LopTrucTiep.tsx,153 | Mã/QR, timer/A-D/confirm, sync câu mới, reset selected, late join, timeout participant -1; phiên mã cứng demo chưa vòng đời BE. |
| SV-41 | Đã gửi → "Đã gửi"; GV chuyển câu → tự cập nhật | FE cục bộ | /sinh-vien/tren-lop | shared/LopTrucTiep.tsx,100 | Mã/QR, timer/A-D/confirm, sync câu mới, reset selected, late join, timeout participant -1; phiên mã cứng demo chưa vòng đời BE. |
| SV-42 | AF-1: Mã sai/hết hạn báo lỗi | FE cục bộ | /sinh-vien/tren-lop | shared/LopTrucTiep.tsx | Mã/QR, timer/A-D/confirm, sync câu mới, reset selected, late join, timeout participant -1; phiên mã cứng demo chưa vòng đời BE. |
| SV-43 | AF-2: Vào giữa chừng vẫn trả lời nếu còn giờ | FE cục bộ | /sinh-vien/tren-lop | shared/LopTrucTiep.tsx | Mã/QR, timer/A-D/confirm, sync câu mới, reset selected, late join, timeout participant -1; phiên mã cứng demo chưa vòng đời BE. |
| SV-44 | AF-3: Hết giờ → ghi nhận "không trả lời" | FE cục bộ | /sinh-vien/tren-lop | shared/LopTrucTiep.tsx | Mã/QR, timer/A-D/confirm, sync câu mới, reset selected, late join, timeout participant -1; phiên mã cứng demo chưa vòng đời BE. |
| SV-45 | EX-1: Mất mạng, kết nối lại trước hết giờ vẫn trả lời | FE mô phỏng | /sinh-vien/tren-lop | shared/LopTrucTiep.tsx | Online/offline UI và sync localStorage cùng trình duyệt; reconnect mạng/server thật ngoài scope. |
| SV-46 | Giao diện tối ưu điện thoại | FE cục bộ | /sinh-vien/tren-lop | styles/responsive.css; tests/flows.spec.ts | Đã kiểm route/luồng ở viewport giả lập 390px và 1440px trong E2E; chưa xác nhận thiết bị thật hoặc mọi kích thước. |
| SV-47 | Menu "Bài tập" ghi rõ "Tính điểm", tách với luyện tập | FE cục bộ | /sinh-vien/bai-tap; lam-bai | Sinhvien/BaiTap.tsx,158 | Nhãn tính điểm/tách luyện tập, thi 3 loại template, timer tự nộp và preventPaste. |
| SV-48 | Giao diện thi: câu hỏi + đồng hồ đếm ngược | FE cục bộ | /sinh-vien/bai-tap; lam-bai | Sinhvien/BaiTap.tsx,158 | Nhãn tính điểm/tách luyện tập, thi 3 loại template, timer tự nộp và preventPaste. |
| SV-49 | Trắc nghiệm + điền trống + tự luận | FE cục bộ | /sinh-vien/bai-tap; lam-bai | Sinhvien/BaiTap.tsx,158 | Nhãn tính điểm/tách luyện tập, thi 3 loại template, timer tự nộp và preventPaste. |
| SV-50 | Chặn dán (paste) | FE cục bộ | /sinh-vien/bai-tap; lam-bai | Sinhvien/BaiTap.tsx,158 | Nhãn tính điểm/tách luyện tập, thi 3 loại template, timer tự nộp và preventPaste. |
| SV-51 | Hết giờ tự nộp | FE cục bộ | /sinh-vien/bai-tap; lam-bai | Sinhvien/BaiTap.tsx,158 | Nhãn tính điểm/tách luyện tập, thi 3 loại template, timer tự nộp và preventPaste. |
| SV-52 | AI chấm tự động + giải thích + phản hồi cá nhân từng câu | FE mô phỏng | /sinh-vien/lam-bai | Sinhvien/BaiTap.tsx; Giangvien/BaiTap.tsx | TN/điền tự chấm, essayDraft theo tiêu chí text, GV duyệt; chấm model thật ngoài scope. |
| SV-53 | Giới hạn số lần làm | FE cục bộ | /sinh-vien/bai-tap | Sinhvien/BaiTap.tsx,142,223 | Nút làm lại khi còn lượt; begin/submit guard draft/lượt/pending appeal, deadline cap closes. |
| SV-54 | Điểm tổng, tỷ lệ đúng, số câu | Partial FE | /sinh-vien/ket-qua | Sinhvien/BaiTap.tsx | Điểm tổng và đúng/2 câu tự chấm có; thiếu tỷ lệ đúng/tổng3 thống nhất với tự luận. |
| SV-55 | Từng câu: loại, Đúng/Sai, điểm, đáp án đúng, giải thích, phản hồi | Partial FE | /sinh-vien/ket-qua | Sinhvien/BaiTap.tsx | Có điểm từng câu và giải thích/comment; nhãn Đúng/Sai/đáp án lựa chọn đầy đủ chưa hoàn thiện. |
| SV-56 | Hiện trạng thái + điểm mới của câu đã phúc khảo | Partial FE | /sinh-vien/ket-qua | Sinhvien/BaiTap.tsx,566 | Điểm câu sau regrade phản ánh vào result; trạng thái appeal hiện tổng ở card riêng, chưa gắn trạng thái/điểm đổi vào từng câu rõ ràng. |
| SV-57 | Nút "Yêu cầu phúc khảo" tại từng câu | FE cục bộ | /sinh-vien/ket-qua | Sinhvien/BaiTap.tsx,566 | Mỗi câu mở appeal theo index; chống trùng pending câu. |
| SV-58 | Form: câu hỏi, câu trả lời, điểm AI, lý do | Partial FE | /sinh-vien/ket-qua | Sinhvien/BaiTap.tsx,566 | Snapshot question/answer/points được lưu; modal SV hiện chỉ input lý do, chưa trình bày đầy đủ context như yêu cầu. |
| SV-59 | Lưu "Pending", GV nhận thông báo | FE cục bộ | /sinh-vien/ket-qua | Sinhvien/BaiTap.tsx,566 | Pending lưu và teacherNotices đúng audience, readTeacherNotices=false. |
| SV-60 | Điểm tự học = phiên hoàn thành đúng hạn / tổng phiên × 10 | Partial FE | /sinh-vien/diem-so | shared/Grades.tsx,288 | learningSummary đã derive mọi phiên/bài published và Grades hiển thị danh sách động; dữ liệu vẫn shared workspace, chưa từng account/lớp đầy đủ. |
| SV-61 | Điểm TB bài tập = TB cộng điểm Bài tập AI | Partial FE | /sinh-vien/diem-so | shared/Grades.tsx,288 | learningSummary đã derive mọi phiên/bài published và Grades hiển thị danh sách động; dữ liệu vẫn shared workspace, chưa từng account/lớp đầy đủ. |
| SV-62 | Chi tiết: danh sách phiên (đúng hạn/trễ/chưa), điểm từng bài | Partial FE | /sinh-vien/diem-so | shared/Grades.tsx,288 | learningSummary đã derive mọi phiên/bài published và Grades hiển thị danh sách động; dữ liệu vẫn shared workspace, chưa từng account/lớp đầy đủ. |
| SV-63 | Chọn lớp, bài học, loại vấn đề (Bài giảng/Bài tập/Chat AI/Kỹ thuật/Khác) | Partial FE | /sinh-vien/phan-hoi | shared/Communication.tsx,263 | Chọn lớp/loại/lesson published; CSE301 có, các lớp khác chưa map lesson nên gửi bị chặn rõ ràng. |
| SV-64 | Đính kèm tối đa 5 ảnh, tổng 5MB | FE cục bộ | /sinh-vien/phan-hoi | shared/Communication.tsx | Validate tối đa5/tổng5MB/MIME raster; IDB lưu File, GV mở/xem thumbnail được. |
| SV-65 | Lịch sử phản hồi: trạng thái + câu trả lời GV | Partial FE | /sinh-vien/phan-hoi | shared/Communication.tsx,106 | Có lịch sử/trạng thái/trả lời nhưng shared data không theo studentId của account import mới. |

## Giảng viên

| ID | Yêu cầu | Phân loại | Route | Source chính | Giới hạn / bằng chứng |
|---|---|---|---|---|---|
| GV-01 | Danh sách bài học trong lớp | FE cục bộ | /giang-vien/bai-hoc | Giangvien/BaiHoc.tsx | CRUD tên/order và guard không xóa activity; soạn nhận lessonId, metadata lưu đúng lesson. |
| GV-02 | Tạo / sửa: tên bài học, thứ tự | FE cục bộ | /giang-vien/bai-hoc | Giangvien/BaiHoc.tsx | CRUD tên/order và guard không xóa activity; soạn nhận lessonId, metadata lưu đúng lesson. |
| GV-03 | Xoá bài học khi chưa có dữ liệu SV | FE cục bộ | /giang-vien/bai-hoc | Giangvien/BaiHoc.tsx | CRUD tên/order và guard không xóa activity; soạn nhận lessonId, metadata lưu đúng lesson. |
| GV-04 | Upload slide bài giảng | Partial FE | /giang-vien/soan-bai | Giangvien/BaiHoc.tsx | PDF preview cục bộ, metadata slides lưu/thêm/xóa/sắp xếp; chưa upload/extract/chỉnh PDF thật, reader content minh họa. |
| GV-05 | Danh sách slide bên trái, preview bên phải | Partial FE | /giang-vien/soan-bai | Giangvien/BaiHoc.tsx | PDF preview cục bộ, metadata slides lưu/thêm/xóa/sắp xếp; chưa upload/extract/chỉnh PDF thật, reader content minh họa. |
| GV-06 | Thêm / xoá / sắp xếp từng slide | Partial FE | /giang-vien/soan-bai | Giangvien/BaiHoc.tsx | PDF preview cục bộ, metadata slides lưu/thêm/xóa/sắp xếp; chưa upload/extract/chỉnh PDF thật, reader content minh họa. |
| GV-07 | Thêm video YouTube | FE cục bộ | /giang-vien/soan-bai | Giangvien/BaiHoc.tsx | Thêm YouTube link lưu video/resources; chưa claim nhúng phát video tại reader. |
| GV-08 | Tạo câu hỏi quiz gắn từng slide (4 đáp án, đáp án đúng, giải thích) | FE cục bộ | /giang-vien/ngan-hang-cau-hoi | Giangvien/CauHoi.tsx | Structured quiz 4 lựa chọn/đáp án/giải thích/page có CRUD trong bank; scope bank chung demo. |
| GV-09 | "AI gợi ý câu hỏi" → GV rà soát, chỉnh sửa | FE mô phỏng | /giang-vien/ngan-hang-cau-hoi | Giangvien/CauHoi.tsx | Gợi ý mẫu cần GV duyệt/sửa; không model sinh thật. |
| GV-10 | AF-1: Import / export câu hỏi Excel/CSV | FE cục bộ | /giang-vien/ngan-hang-cau-hoi; tren-lop | Giangvien/CauHoi.tsx; shared/LopTrucTiep.tsx | Import Excel/CSV và export Excel, quiz approved dùng lại trên lớp. |
| GV-11 | Câu hỏi dùng lại cho poll trên lớp | FE cục bộ | /giang-vien/ngan-hang-cau-hoi; tren-lop | Giangvien/CauHoi.tsx; shared/LopTrucTiep.tsx | Import Excel/CSV và export Excel, quiz approved dùng lại trên lớp. |
| GV-12 | Đặt giờ bắt đầu – kết thúc | FE cục bộ | /giang-vien/phien-tu-hoc | Giangvien/PhienTuHoc.tsx | Đặt opens/closes, validation thứ tự thời gian. |
| GV-13 | Tự Active khi đến giờ bắt đầu | FE mô phỏng | /giang-vien/phien-tu-hoc | data/rules.ts; Giangvien/PhienTuHoc.tsx | sessionState theo now khi render; chưa timer rerender tại ranh giờ hoặc scheduler server. |
| GV-14 | AF-1: Gia hạn thời gian | FE cục bộ | /giang-vien/phien-tu-hoc; tao-bai-tap | Giangvien/PhienTuHoc.tsx; Giangvien/BaiTap.tsx | Gia hạn published không rút ngắn; thêm được nhiều session; nội dung session chung l2 là giới hạn đã biết. |
| GV-15 | AF-2: Thiết lập nhiều phiên | FE cục bộ | /giang-vien/phien-tu-hoc; tao-bai-tap | Giangvien/PhienTuHoc.tsx; Giangvien/BaiTap.tsx | Gia hạn published không rút ngắn; thêm được nhiều session; nội dung session chung l2 là giới hạn đã biết. |
| GV-16 | Cấu hình tiêu đề, thời gian làm, mở – đóng | FE cục bộ | /giang-vien/phien-tu-hoc; tao-bai-tap | Giangvien/PhienTuHoc.tsx; Giangvien/BaiTap.tsx | Tiêu đề/thời gian/mở/đóng được lưu riêng assignment. |
| GV-17 | Bố cục theo loại câu + điểm (VD TN 16 câu – 8đ…) | Partial FE | /giang-vien/tao-bai-tap | Giangvien/BaiTap.tsx | Đề cố định3 câu 4/3/3 điểm, chưa cấu hình số câu/điểm/cấu trúc tùy ý. |
| GV-18 | Chặn paste | FE cục bộ | /giang-vien/tao-bai-tap | Giangvien/BaiTap.tsx; Sinhvien/BaiTap.tsx | Cấu hình preventPaste được áp dụng ở form SV. |
| GV-19 | "Tạo đề mới" có AI hỗ trợ → GV rà soát | Partial FE | /giang-vien/tao-bai-tap | Giangvien/BaiTap.tsx | Gợi ý đề mẫu/duyệt minh họa, chưa tạo/chỉnh nội dung đề riêng. |
| GV-20 | "Import đề" | Partial FE | /giang-vien/tao-bai-tap | Giangvien/BaiTap.tsx | Import bank có, chưa nối questionIds/import đề riêng vào assignment template. |
| GV-21 | Nhiều đề, bật/tắt từng đề, ngẫu nhiên hoá | Partial FE | /giang-vien/bai-tap | Giangvien/BaiTap.tsx,138,276 | Nhiều assignment/bật tắt có; random chỉ flag và chưa nhiều đề/ngẫu nhiên thật. |
| GV-22 | Thêm tài liệu: upload file hoặc dán liên kết | Partial FE | /giang-vien/tai-lieu | shared/Communication.tsx | Tài liệu thêm link/xóa có; thiếu upload file/sửa/sắp đầy đủ như checklist. |
| GV-23 | Tiêu đề, mô tả ngắn; sắp xếp, sửa, xoá | Partial FE | /giang-vien/tai-lieu | shared/Communication.tsx | Tài liệu thêm link/xóa có; thiếu upload file/sửa/sắp đầy đủ như checklist. |
| GV-24 | Bấm "Hỏi trên lớp" → chọn câu hỏi, chọn lớp | Partial FE | /giang-vien/tren-lop | shared/LopTrucTiep.tsx,100 | Chiếu câu approved theo bank có; chưa picker chọn câu/lớp cụ thể trước phiên. |
| GV-25 | Màn chiếu: câu hỏi + 4 đáp án + đếm ngược | FE cục bộ | /giang-vien/tren-lop | shared/LopTrucTiep.tsx,235 | Câu/4 đáp án/timer/fullscreen, mã/QR, next, auto reveal khi hết giờ/all participants, đếm answers. |
| GV-26 | Mã phiên (số ngắn) + mã QR | FE cục bộ | /giang-vien/tren-lop | shared/LopTrucTiep.tsx,235 | Câu/4 đáp án/timer/fullscreen, mã/QR, next, auto reveal khi hết giờ/all participants, đếm answers. |
| GV-27 | "Đổi câu hỏi" chuyển câu | FE cục bộ | /giang-vien/tren-lop | shared/LopTrucTiep.tsx,235 | Câu/4 đáp án/timer/fullscreen, mã/QR, next, auto reveal khi hết giờ/all participants, đếm answers. |
| GV-28 | Hết giờ hoặc tất cả đã trả lời → hiện kết quả | FE cục bộ | /giang-vien/tren-lop | shared/LopTrucTiep.tsx | Câu/4 đáp án/timer/fullscreen, mã/QR, next, auto reveal khi hết giờ/all participants, đếm answers. |
| GV-29 | Số SV đã trả lời | FE cục bộ | /giang-vien/tren-lop | shared/LopTrucTiep.tsx | Câu/4 đáp án/timer/fullscreen, mã/QR, next, auto reveal khi hết giờ/all participants, đếm answers. |
| GV-30 | Phân bố từng đáp án, tỷ lệ đúng | Partial FE | /giang-vien/tren-lop | shared/LopTrucTiep.tsx | Có phân bố số chọn từng đáp án; thiếu tỷ lệ đúng tổng rõ ràng. |
| GV-31 | Popup danh sách, gom theo slide + số lượng | Partial FE | /giang-vien/tien-do; phan-hoi | Giangvien/TheoDoi.tsx; shared/Communication.tsx | Count chưa giải thích theo trang và danh sách có; chưa popup gom group slide như yêu cầu. |
| GV-32 | Đánh dấu "Đã giải thích" từng mục hoặc cả nhóm | FE cục bộ | /giang-vien/phan-hoi | shared/Communication.tsx | Từng gap có nhập giải đáp/Đã giải thích; checklist chấp nhận từng mục hoặc cả nhóm. |
| GV-33 | Tiến độ tự học từng SV (tên, email, bài, % hoàn thành) | Partial FE | /giang-vien/tien-do | Giangvien/TheoDoi.tsx | Tên/email/progress có và sv1 dùng summary động; chưa chọn session/lesson và dữ liệu từng account mới. |
| GV-34 | Kết quả bài tập: điểm, % đúng, thời gian nộp | Partial FE | /giang-vien/tien-do | Giangvien/TheoDoi.tsx | Điểm summary, chat/feedback/gap count có; thiếu % đúng/thời điểm nộp và hoạt động quiz live trên dashboard. |
| GV-35 | Tương tác: Chat AI, quiz trên lớp, phản hồi | Partial FE | /giang-vien/tien-do | Giangvien/TheoDoi.tsx | Điểm summary, chat/feedback/gap count có; thiếu % đúng/thời điểm nộp và hoạt động quiz live trên dashboard. |
| GV-36 | Phân tích AI: nội dung sai nhiều, đề xuất | FE mô phỏng | /giang-vien/tien-do | Giangvien/TheoDoi.tsx | LearningInsights tính wrong/answered/gaps từ state và đề xuất theo trang; không model thật. |
| GV-37 | Cảnh báo SV tiến độ thấp / điểm dưới ngưỡng | FE cục bộ | /giang-vien/tien-do | Giangvien/TheoDoi.tsx,150 | Normalized progress/grade thống nhất lọc/render/export; ngưỡng progress<50 OR grade<5, có nhắc local. |
| GV-38 | Bảng: STT, Mã SV, Họ đệm, Tên, Điểm tự học, Điểm TB bài tập | Partial FE | /giang-vien/diem-so | shared/Grades.tsx | Bảng STT/mã/họ tên/2 điểm có; chưa tách Họ đệm/Tên và scope registry mới. |
| GV-39 | Xuất Excel | FE cục bộ | /giang-vien/diem-so | shared/Grades.tsx,74 | Xuất xlsx thật; phản hồi có thời gian/loại/trạng thái. |
| GV-40 | Danh sách: thời gian, loại, trạng thái | FE cục bộ | /giang-vien/phan-hoi | shared/Communication.tsx | Xuất xlsx thật; phản hồi có thời gian/loại/trạng thái. |
| GV-41 | Chi tiết: lớp, bài, SV, mô tả, ảnh; trả lời; "Đã xử lý" | FE cục bộ | /giang-vien/phan-hoi | shared/Communication.tsx | Thông tin lớp/bài/SV/nội dung/ảnh IDB/trả lời/Đã xử lý có trong workspace demo. |
| GV-42 | Danh sách phúc khảo: SV, bài, câu, trạng thái | FE cục bộ | /giang-vien/phuc-khao | Giangvien/TheoDoi.tsx,281 | Appeal theo câu/snapshot, quyết định/lý do/regradeQuestion tổng điểm/notice; pending khóa làm lại, chấm tự luận giữ điểm đã appeal. |
| GV-43 | Giữ nguyên (ghi lý do) hoặc chấm lại → tính lại điểm TB | FE cục bộ | /giang-vien/phuc-khao | Giangvien/TheoDoi.tsx,281 | Appeal theo câu/snapshot, quyết định/lý do/regradeQuestion tổng điểm/notice; pending khóa làm lại, chấm tự luận giữ điểm đã appeal. |
| GV-44 | SV nhận thông báo kết quả | FE cục bộ | /giang-vien/phuc-khao | Giangvien/TheoDoi.tsx | Appeal theo câu/snapshot, quyết định/lý do/regradeQuestion tổng điểm/notice; pending khóa làm lại, chấm tự luận giữ điểm đã appeal. |

## Trưởng nhóm HP

| ID | Yêu cầu | Phân loại | Route | Source chính | Giới hạn / bằng chứng |
|---|---|---|---|---|---|
| TN-01 | Đăng nhập với role CourseLeader | FE cục bộ | /dang-nhap | data/accounts.ts | Login role, scope lớp/học phần fixture, review/compare/M0–M3/request/followup/completion, editable guard và reset chuẩn hóa khi sửa. |
| TN-02 | Danh sách các lớp cùng học phần | FE cục bộ | /truong-nhom-hp/chuan-hoa | Truongnhomhp/Overview.tsx; Review.tsx | Login role, scope lớp/học phần fixture, review/compare/M0–M3/request/followup/completion, editable guard và reset chuẩn hóa khi sửa. |
| TN-03 | Rà soát slide, quiz, đề bài tập từng lớp | FE cục bộ | /truong-nhom-hp/chuan-hoa | Truongnhomhp/Overview.tsx; Review.tsx | Login role, scope lớp/học phần fixture, review/compare/M0–M3/request/followup/completion, editable guard và reset chuẩn hóa khi sửa. |
| TN-04 | So sánh giữa các lớp, yêu cầu GV điều chỉnh | FE cục bộ | /truong-nhom-hp/so-sanh; yeu-cau | Truongnhomhp/Compare.tsx; model.ts | Login role, scope lớp/học phần fixture, review/compare/M0–M3/request/followup/completion, editable guard và reset chuẩn hóa khi sửa. |
| TN-05 | Cụ thể hoá mức xử lý M0–M3 | FE cục bộ | /truong-nhom-hp/chuan-hoa/:classId | Truongnhomhp/model.ts,357 | Login role, scope lớp/học phần fixture, review/compare/M0–M3/request/followup/completion, editable guard và reset chuẩn hóa khi sửa. |
| TN-06 | Đánh dấu "Hoàn thành chuẩn hoá" | FE cục bộ | /truong-nhom-hp/chuan-hoa/:classId | Truongnhomhp/model.ts,357 | Login role, scope lớp/học phần fixture, review/compare/M0–M3/request/followup/completion, editable guard và reset chuẩn hóa khi sửa. |
| TN-07 | AF-1: Sửa trực tiếp nội dung nếu có quyền | FE cục bộ | /truong-nhom-hp/hoc-lieu/:id/sua | Truongnhomhp/Materials.tsx; model.ts | Login role, scope lớp/học phần fixture, review/compare/M0–M3/request/followup/completion, editable guard và reset chuẩn hóa khi sửa. |
| TN-08 | Tạo / sửa nội dung, bài tập, tài liệu như GV | Partial FE | /truong-nhom-hp/hoc-lieu; tai-lieu | Truongnhomhp/Materials.tsx; Resources.tsx | Text editor slides/quiz/assignment và reference links có; chưa tương đương structured editor GV, upload hoặc metadata bài tập đầy đủ. |

## Trưởng khoa

| ID | Yêu cầu | Phân loại | Route | Source chính | Giới hạn / bằng chứng |
|---|---|---|---|---|---|
| TK-01 | Đăng nhập với role Dean | FE cục bộ | /dang-nhap | data/accounts.ts | Role guard/tổng quan khoa/drilldown học phần-lớp/cảnh báo ngưỡng; summary đã nối helper mới; danh mục khoa/lớp vẫn fixture, chưa map registry Admin. |
| TK-02 | Tổng quan toàn khoa | FE cục bộ | /truong-khoa/tong-quan; hoc-phan/:id/lop/:id; canh-bao | Truongkhoa/data.ts; Overview.tsx; Courses.tsx; ClassDetail.tsx; Alerts.tsx | Role guard/tổng quan khoa/drilldown học phần-lớp/cảnh báo ngưỡng; summary đã nối helper mới; danh mục khoa/lớp vẫn fixture, chưa map registry Admin. |
| TK-03 | Drill-down: học phần → lớp | FE cục bộ | /truong-khoa/tong-quan; hoc-phan/:id/lop/:id; canh-bao | Truongkhoa/data.ts; Overview.tsx; Courses.tsx; ClassDetail.tsx; Alerts.tsx | Role guard/tổng quan khoa/drilldown học phần-lớp/cảnh báo ngưỡng; summary đã nối helper mới; danh mục khoa/lớp vẫn fixture, chưa map registry Admin. |
| TK-04 | Mức hoàn thành, cảnh báo SV yếu toàn khoa | FE cục bộ | /truong-khoa/tong-quan; hoc-phan/:id/lop/:id; canh-bao | Truongkhoa/data.ts; Overview.tsx; Courses.tsx; ClassDetail.tsx; Alerts.tsx | Role guard/tổng quan khoa/drilldown học phần-lớp/cảnh báo ngưỡng; summary đã nối helper mới; danh mục khoa/lớp vẫn fixture, chưa map registry Admin. |

## Admin

| ID | Yêu cầu | Phân loại | Route | Source chính | Giới hạn / bằng chứng |
|---|---|---|---|---|---|
| AD-01 | Đăng nhập Admin | FE cục bộ | /dang-nhap | Admin/Accounts.tsx; Admin/model.ts; Admin/excel.ts | Login Admin AD001, role guard/mustChange/active áp dụng; session theo sessionStorage, registry/hash localStorage. |
| AD-02 | Import SV từ Excel (Mã SV, Họ tên, Email) → mật khẩu mặc định | FE cục bộ | /admin/tai-khoan/import | Admin/Accounts.tsx; Admin/model.ts; Admin/excel.ts | XLSX thật, template, preview lỗi toàn bộ, validate header/id/email/khoa/trùng, import revalidate; loại selector đã khóa busy; default password/mustChange thật local. |
| AD-03 | Import GV từ Excel (Mã GV, Họ tên, Email, Khoa) | FE cục bộ | /admin/tai-khoan/import | Admin/Accounts.tsx; Admin/model.ts; Admin/excel.ts | XLSX thật, template, preview lỗi toàn bộ, validate header/id/email/khoa/trùng, import revalidate; loại selector đã khóa busy; default password/mustChange thật local. |
| AD-04 | Gán role CourseLeader / Dean | FE cục bộ | /admin/tai-khoan/:id | Admin/Accounts.tsx; Admin/model.ts; Admin/excel.ts | Chỉ kind teacher được gán giang-vien/CourseLeader/Dean; admin/student bị model từ chối. |
| AD-05 | Reset mật khẩu về mặc định | FE cục bộ | /admin/tai-khoan/:id | Admin/Accounts.tsx; Admin/model.ts; Admin/excel.ts | Reset hash rỗng và mustChange=true sau dialog; login default và bắt đổi có tác dụng. |
| AD-06 | Vô hiệu hoá tài khoản (không xoá dữ liệu) | FE cục bộ | /admin/tai-khoan/:id | Admin/Accounts.tsx; Admin/model.ts; Admin/excel.ts | Active false giữ nguyên dữ liệu, provider và login chặn truy cập; kích hoạt lại có. |
| AD-07 | Tạo / sửa học phần (Mã, Tên, Khoa) | Partial FE | /admin/hoc-phan/:courseId | Admin/Courses.tsx; Admin/model.ts; Admin/excel.ts | Tạo/sửa mã/tên/khoa và validate duplicate thật ở registry; role cũ chưa lấy toàn bộ danh mục động này. |
| AD-08 | Tạo lớp (Tên, Học kỳ, Năm học, Đợt) | Partial FE | /admin/lop/:classId | Admin/Courses.tsx; Admin/model.ts; Admin/excel.ts | Tạo/sửa tên/kỳ/năm/đợt và validate thật ở registry; chưa mọi role cũ dùng lớp mới. |
| AD-09 | Gán GV, gán Trưởng nhóm HP | Partial FE | /admin/lop/:classId | Admin/Courses.tsx; Admin/model.ts; Admin/excel.ts | Assign active GV/CourseLeader theo ID có validate và lưu; chưa đồng bộ phạm vi học phần/lớp các role cũ. |
| AD-10 | Import danh sách SV vào lớp | Partial FE | /admin/lop/:classId/import | Admin/Courses.tsx; Admin/model.ts; Admin/excel.ts | Import enrollment active SV/chống trùng/revalidate thật; chưa chuyển dữ liệu học tập roster mọi role cũ sang registry mới. |

## Hệ thống AI

| ID | Yêu cầu | Phân loại | Route | Source chính | Giới hạn / bằng chứng |
|---|---|---|---|---|---|
| AI-01 | Trả lời chatbot có trích dẫn từ học liệu | FE mô phỏng | /sinh-vien/tro-ly-ai; hoc/:id | AI/model.ts; AI/Assistant.tsx | AnswerFromMaterial trả rule/citation/fallback/guardrail, history/rating/report trong Assistant; chưa model/RAG; nguồn mới và liên kết nguồn trong lịch sử được ẩn khi metadata không còn khớp; rating/report ở reader và Assistant lưu cục bộ. |
| AI-02 | Sinh câu hỏi luyện tập từ slide | FE mô phỏng | /sinh-vien/luyen-tap | AI/model.ts; AI/Practice.tsx | Practice bank scope/rotate/TN+blank/check/explanation/source/summary thực; không sinh model. |
| AI-03 | Chấm bài tự động + giải thích + phản hồi cá nhân | FE mô phỏng | /sinh-vien/ket-qua; /giang-vien/cham-bai | AI/model.ts; AI/Insights.tsx | TN/điền chấm local, essayDraft kiểm nội dung+tiêu chí/feedback và GV duyệt; không model AI thật. |
| AI-04 | Phân tích dữ liệu, nhận diện vùng yếu, đề xuất | FE mô phỏng | /giang-vien/tien-do | AI/model.ts; AI/Insights.tsx | Insights derive wrong answers/gaps hiện có, đề xuất có căn cứ; scope CSE301 demo/account cũ, không analytics server. |
| AI-05 | Quét deadline phiên tự học / bài tập 24 giờ trước | FE mô phỏng | /admin/nhac-han; /giang-vien/nhac-han | AI/model.ts; AI/Reminders.tsx | DeadlineCandidate lọc published/chưa hoàn thành/due trong24h, nút quét thời điểm chọn; CSE301.01 cố định và không scheduler máy chủ. |
| AI-06 | Gửi email: tên SV, lớp, bài, hạn, tiến độ | FE mô phỏng | /admin/nhac-han | AI/model.ts; AI/Reminders.tsx | Email preview đủ tên/lớp/bài/hạn/tiến độ, ghi rõ chưa gửi; không gửi email thật. |
| AI-07 | Lưu bản ghi nhắc nhở | FE mô phỏng | /admin/nhac-han | AI/model.ts; AI/Reminders.tsx | Reminder records khóa student/class/item/deadline/channel, dedup, lưu localStorage và history; notice SV demo có, chưa service nhắc thật. |

## Phi chức năng (NFR)

| ID | Yêu cầu | Phân loại | Route | Source chính | Giới hạn / bằng chứng |
|---|---|---|---|---|---|
| NFR-01 | Tối thiểu 500 người dùng đồng thời | BE/triển khai | — | Không có load test | 500 concurrent cần hạ tầng + load test; không xác nhận bằng FE local. |
| NFR-02 | Xem slide, trả lời quiz ≤ 2 giây | Cần runtime | /sinh-vien/hoc/:id | Slide HTML và quiz local | Slide/quiz local có đường đi; chưa đo thời gian ≤2 giây theo tiêu chí SRS, giữ trạng thái chưa kiểm chứng. |
| NFR-03 | AI chấm tự luận ≤ 30 giây/bài | BE/triển khai | — | Không gọi AI model thật | Không model chấm tự luận thật; không thể xác nhận<=30s. |
| NFR-04 | Uptime ≥ 99,5%, 24/7 | BE/triển khai | — | Không hạ tầng production trong phạm vi | Không chứng minh uptime99.5%/24x7 từ repo FE. |
| NFR-05 | Responsive máy tính + điện thoại | FE cục bộ | Các route mẫu | styles/responsive.css; tests/flows.spec.ts | E2E quét các route mẫu ở viewport giả lập 390px/1440px; ảnh Admin/AI bổ sung 800px. Bằng chứng giới hạn ở các route/trạng thái đã kiểm, chưa thiết bị vật lý hoặc mọi trình duyệt. |
| NFR-06 | Mã hoá khi truyền (HTTPS/TLS) và khi lưu | BE/triển khai | — | data/DemoProvider.tsx; shared/AccountProvider.tsx | TLS/at-rest production cần hosting/server; hash demo không thay thế mã hóa lưu production. |
| NFR-07 | Mở rộng thêm ngành / học phần | Partial FE | /truong-khoa/hoc-phan; /truong-nhom-hp/* | data/fixtures.ts; Truongnhomhp/model.ts | Admin CRUD danh mục có; nhiều role còn constants/scope fixture, chưa mở rộng ngành/học phần xuyên hệ thống. |
| NFR-08 | Disclaimer Chat AI | FE cục bộ | /sinh-vien/hoc/:id; tro-ly-ai | Sinhvien/HocBai.tsx; shared/Communication.tsx | Disclaimer Chat AI hiện trong reader và Assistant. |

Xem [tổng kết audit](audit-2026-10-30.md), [giới hạn](limitations.md) và [kiểm chứng](verification.md) trước khi dùng bảng này làm tiêu chí nghiệm thu.
