import type { DemoData } from "../data/fixtures";
export function answerFromMaterial(
  courseId: string,
  question: string,
  available = true,
) {
  const unavailable = {
    answer:
      "Chưa có học liệu phù hợp để trả lời câu hỏi này. Hãy kiểm tra học phần hoặc gửi câu hỏi cho giảng viên.",
    page: 0,
    sources: [] as number[],
  };
  if (
    !available ||
    courseId !== "cs301" ||
    !/rest|api|http|uri|tài nguyên|method|put|patch|post|get|mã trạng thái|bài giảng/i.test(
      question,
    )
  )
    return unavailable;
  if (/giải hộ|làm hộ|đáp án.*(thi|kiểm tra)|bài kiểm tra đang/i.test(question))
    return {
      answer:
        "Mình có thể giải thích khái niệm và chỉ ra học liệu để bạn tự làm. Không cung cấp đáp án thay cho bạn trong bài kiểm tra đang diễn ra.",
      page: 0,
      sources: [],
    };
  if (/put|patch|method|post|get/i.test(question))
    return {
      answer:
        "GET đọc tài nguyên; POST tạo mới; PUT thay thế toàn bộ biểu diễn, còn PATCH cập nhật một phần. Ví dụ PATCH /books/1 chỉ thay thuộc tính title. Đối chiếu trang 2 và thử giải thích vì sao PATCH phù hợp với ví dụ này.",
      page: 2,
      sources: [2],
    };
  if (/mã|status|201|404|lỗi/i.test(question))
    return {
      answer:
        "Nhóm 2xx biểu thị thành công, 4xx là lỗi yêu cầu, 5xx là lỗi máy chủ. POST tạo tài nguyên thành công thường trả 201 Created; không tìm thấy tài nguyên trả 404. Đối chiếu trang 3.",
      page: 3,
      sources: [3],
    };
  return {
    answer:
      "REST tổ chức API quanh tài nguyên. Mỗi tài nguyên được định danh bằng URI; HTTP method thể hiện thao tác. Ví dụ GET /books để đọc danh sách sách. Đối chiếu trang 1.",
    page: 1,
    sources: [1],
  };
}
export interface DeadlineCandidate {
  key: string;
  studentId: string;
  studentName: string;
  email: string;
  className: string;
  kind: "session" | "assignment";
  itemId: string;
  title: string;
  due: string;
  progress: string;
}
export interface ReminderRecord {
  id: string;
  key: string;
  createdAt: string;
  candidate: DeadlineCandidate;
  channel: "in-app" | "email";
  status: "recorded" | "sent" | "skipped" | "failed";
}
export function reminderEmail(c: DeadlineCandidate) {
  return {
    subject: `Nhắc hạn ${c.kind === "session" ? "tự học" : "bài tập"} · ${c.className}`,
    body: `Chào ${c.studentName},\n\n${c.title} của lớp ${c.className} đến hạn lúc ${new Date(c.due).toLocaleString("vi-VN")}.\nTiến độ hiện tại: ${c.progress}.\n\nVui lòng mở ${c.kind === "session" ? "phiên tự học" : "bài tập"} để hoàn thành trước hạn.\nVJU Learning`,
  };
}
export function materialSourceAvailable(data: DemoData) {
  const l = data.lessons.find((l) => l.id === "l2");
  const expected = [
    "RESTful API là gì?",
    "Tài nguyên và HTTP methods",
    "Mã trạng thái HTTP",
    "Thiết kế API trong thực tế",
  ];
  return Boolean(
    l?.published &&
    (!l.slides ||
      (l.slides.length === expected.length &&
        l.slides.every((v, i) => v === expected[i]))),
  );
}
export function recordChatFeedback(
  data: DemoData,
  index: number,
  rating: "helpful" | "reported",
): DemoData {
  const m = data.chat[index];
  if (!m) return data;
  return {
    ...data,
    chat: data.chat.map((c, i) => (i === index ? { ...c, rating } : c)),
    feedback:
      rating !== "reported" || m.rating === "reported"
        ? data.feedback
        : [
            ...data.feedback,
            {
              id: crypto.randomUUID(),
              student: data.profile.name,
              course: m.courseId || "cs301",
              lesson: "Thiết kế RESTful API",
              category: "Chat AI",
              body: `Cần kiểm tra câu trả lời: ${m.question}\n${m.answer}`,
              images: [],
              response: "",
              resolved: false,
              date: new Date().toLocaleDateString("vi-VN"),
            },
          ],
  };
}
