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
export interface PracticeQuestion {
  id: string;
  type: "choice" | "blank";
  page: number;
  title: string;
  options?: string[];
  answer: string;
  explanation: string;
}
const bank: PracticeQuestion[] = [
  {
    id: "uri",
    type: "choice",
    page: 1,
    title: "Tài nguyên REST được định danh bằng gì?",
    options: ["URI", "Kết nối TCP", "Cookie", "Phiên đăng nhập"],
    answer: "URI",
    explanation: "URI định danh tài nguyên; method chỉ thao tác.",
  },
  {
    id: "resource",
    type: "blank",
    page: 1,
    title: "Điền tên viết tắt của định danh tài nguyên thống nhất.",
    answer: "URI",
    explanation: "URI là định danh của tài nguyên.",
  },
  {
    id: "post",
    type: "blank",
    page: 2,
    title: "HTTP method thường dùng để tạo tài nguyên mới?",
    answer: "POST",
    explanation: "POST được dùng để tạo mới trong collection.",
  },
  {
    id: "patch",
    type: "choice",
    page: 2,
    title: "HTTP method cập nhật một phần tài nguyên?",
    options: ["GET", "PATCH", "HEAD", "POST"],
    answer: "PATCH",
    explanation: "PATCH cập nhật một phần, PUT thay thế toàn bộ biểu diễn.",
  },
  {
    id: "put",
    type: "blank",
    page: 2,
    title: "HTTP method thay thế toàn bộ biểu diễn của tài nguyên?",
    answer: "PUT",
    explanation: "PUT thay thế toàn bộ; PATCH chỉ cập nhật một phần.",
  },
  {
    id: "created",
    type: "choice",
    page: 3,
    title: "Mã phản hồi khi tạo thành công tài nguyên?",
    options: ["404", "201", "500", "401"],
    answer: "201",
    explanation: "201 Created cho biết tài nguyên đã được tạo.",
  },
  {
    id: "missing",
    type: "blank",
    page: 3,
    title: "Mã trạng thái khi không tìm thấy tài nguyên?",
    answer: "404",
    explanation: "404 Not Found dành cho tài nguyên không tìm thấy.",
  },
  {
    id: "success",
    type: "choice",
    page: 3,
    title: "Nhóm mã HTTP biểu thị thành công?",
    options: ["2xx", "4xx", "5xx", "1xx"],
    answer: "2xx",
    explanation: "2xx biểu thị thành công; 4xx lỗi yêu cầu và 5xx lỗi máy chủ.",
  },
];
export function practiceSet(scope: string, round: number) {
  const pool = bank.filter(
    (q) => scope !== "http" || q.page === 2 || q.page === 3,
  );
  const start = round % pool.length;
  return Array.from(
    { length: Math.min(3, pool.length) },
    (_, i) => pool[(start + i) % pool.length],
  );
}
export function essayDraft(answer: string) {
  const text = answer.toLowerCase();
  const checks = [
    {
      label: "Có endpoint cho lượt mượn",
      met: /\/(api\/)?loans|\/(api\/)?borrow/.test(text),
    },
    { label: "Chọn method POST", met: /\bpost\b/.test(text) },
    {
      label: "Nêu mã phản hồi và lý do",
      met: /201|created/.test(text) && /vì|tạo|thành công|create/.test(text),
    },
  ];
  return {
    checks,
    score: checks.filter((c) => c.met).length,
    feedback:
      checks
        .filter((c) => !c.met)
        .map((c) => c.label)
        .join("; ") ||
      "Đã nêu các tiêu chí cơ bản. Giảng viên cần đọc nội dung và duyệt điểm.",
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
  status: "recorded" | "simulated";
}
export function deadlineCandidates(
  data: DemoData,
  now: number,
): DeadlineCandidate[] {
  const items = [
    ...data.sessions
      .filter((s) => s.published)
      .map((s) => ({
        kind: "session" as const,
        itemId: s.id,
        title: s.title,
        due: s.closes,
      })),
    ...data.assignments
      .filter((a) => a.published)
      .map((a) => ({
        kind: "assignment" as const,
        itemId: a.id,
        title: a.title,
        due: a.closes,
      })),
  ].filter(
    (i) => Date.parse(i.due) > now && Date.parse(i.due) - now <= 86400000,
  );
  const cls = data.admin.classes.find((c) => c.id === "CSE301.01");
  if (!cls) return [];
  return cls.studentIds.flatMap((id) => {
    const u = data.admin.users.find((u) => u.id === id && u.active);
    if (!u) return [];
    return items
      .filter(
        (i) =>
          id !== "23110149" ||
          (i.kind === "session"
            ? !data.studySessions[i.itemId]?.completedAt
            : !data.assessments[i.itemId]?.result),
      )
      .map((i) => ({
        ...i,
        key: `${id}:${cls.id}:${i.kind}:${i.itemId}:${i.due}`,
        studentId: id,
        studentName: u.name,
        email: u.email,
        className: cls.name,
        progress:
          i.kind === "session"
            ? `${id === "23110149" ? Math.min(100, Math.round(((data.studySessions[i.itemId]?.progress || 0) / (data.lessons.find((l) => l.id === "l2")?.slides?.length || 4)) * 100)) : 0}% hoàn thành`
            : "Chưa nộp",
      }));
  });
}
export function reminderEmail(c: DeadlineCandidate) {
  return {
    subject: `Nhắc hạn ${c.kind === "session" ? "tự học" : "bài tập"} · ${c.className}`,
    body: `Chào ${c.studentName},\n\n${c.title} của lớp ${c.className} đến hạn lúc ${new Date(c.due).toLocaleString("vi-VN")}.\nTiến độ hiện tại: ${c.progress}.\n\nVui lòng mở ${c.kind === "session" ? "phiên tự học" : "bài tập"} để hoàn thành trước hạn.\nVJU Learning`,
  };
}
export function reminderRecords(
  existing: ReminderRecord[],
  candidates: DeadlineCandidate[],
  now: number,
) {
  const keys = new Set(existing.map((r) => r.key + ":" + r.channel));
  const added: ReminderRecord[] = [];
  for (const c of candidates)
    for (const channel of ["in-app", "email"] as const) {
      const key = c.key + ":" + channel;
      if (keys.has(key)) continue;
      keys.add(key);
      added.push({
        id: key,
        key: c.key,
        createdAt: new Date(now).toISOString(),
        candidate: c,
        channel,
        status: channel === "in-app" ? "recorded" : "simulated",
      });
    }
  return [...existing, ...added];
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
