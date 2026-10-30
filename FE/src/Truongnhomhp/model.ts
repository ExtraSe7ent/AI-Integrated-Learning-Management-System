export const levels = [
  "Chưa rà soát",
  "Đang xử lý",
  "Cần điều chỉnh",
  "Đạt chuẩn",
] as const;
export const kinds = { slides: "Slides", quiz: "Quiz", assignment: "Bài tập" };
export type MaterialKind = keyof typeof kinds;
export interface Material {
  id: string;
  courseId: string;
  classId: string;
  kind: MaterialKind;
  title: string;
  body: string;
  level: number;
  editable: boolean;
  revision: number;
}
export interface ChangeRequest {
  id: string;
  itemId: string;
  body: string;
  reply: string;
  closed: boolean;
}
export interface Reference {
  id: string;
  courseId: string;
  title: string;
  url: string;
}
export interface Coordination {
  items: Material[];
  requests: ChangeRequest[];
  completed: string[];
  references: Reference[];
}
export const assignedCourses = ["cs301", "cs204"];
export const classes = [
  {
    id: "CSE301.01",
    courseId: "cs301",
    teacherId: "GV001",
    teacher: "Nguyễn Minh Anh",
  },
  {
    id: "CSE301.02",
    courseId: "cs301",
    teacherId: "GV001",
    teacher: "Nguyễn Minh Anh",
  },
  {
    id: "CSE204.01",
    courseId: "cs204",
    teacherId: "GV001",
    teacher: "Nguyễn Minh Anh",
  },
];
export const slideBody =
  "REST là một kiểu kiến trúc cho hệ thống phân tán. API tổ chức tài nguyên bằng URI và dùng HTTP để biểu diễn thao tác.\n\nGET đọc dữ liệu; POST tạo tài nguyên; PUT thay thế; PATCH cập nhật một phần; DELETE xoá tài nguyên.\n\nVí dụ: GET /books trả về danh sách sách. POST /books tạo sách và trả về mã 201.\n\nCâu hỏi kiểm tra: Khi cập nhật một thuộc tính của sách, bạn chọn PUT hay PATCH? Vì sao?";
export const initialCoordination: Coordination = {
  items: [
    [
      "api-slides",
      "cs301",
      "CSE301.01",
      "slides",
      "Thiết kế RESTful API",
      slideBody,
      1,
      true,
    ],
    [
      "api-quiz",
      "cs301",
      "CSE301.01",
      "quiz",
      "HTTP và tài nguyên",
      "Câu 1: Phương thức nào dùng để đọc tài nguyên?\nA. GET\nB. POST\nC. DELETE\nĐáp án: A. GET\n\nCâu 2: Tạo tài nguyên thành công thường trả mã nào?\nA. 200\nB. 201\nC. 404\nĐáp án: B. 201",
      3,
      true,
    ],
    [
      "api-assignment",
      "cs301",
      "CSE301.01",
      "assignment",
      "Thiết kế API quản lý thư viện",
      "Thiết kế endpoint tạo sách, tìm sách và mượn sách. Nêu HTTP method, URI, request và response cho từng endpoint.\n\nNộp một tệp PDF mô tả thiết kế. Thang điểm: 10. Thời gian: 30 phút.",
      2,
      true,
    ],
    [
      "api2-slides",
      "cs301",
      "CSE301.02",
      "slides",
      "REST và thiết kế tài nguyên",
      "Tổ chức API theo tài nguyên: /books, /readers và /loans.\n\nDùng GET để đọc, POST để tạo. Phân biệt mã phản hồi 200, 201, 400 và 404.\n\nBài tập trên lớp: thiết kế endpoint mượn sách.",
      0,
      false,
    ],
    [
      "api2-quiz",
      "cs301",
      "CSE301.02",
      "quiz",
      "Kiểm tra HTTP",
      "Câu 1: Không tìm thấy tài nguyên trả mã nào?\nA. 201\nB. 404\nC. 500\nĐáp án: B. 404",
      1,
      true,
    ],
    [
      "api2-assignment",
      "cs301",
      "CSE301.02",
      "assignment",
      "API mượn sách",
      "Thiết kế POST /loans. Kiểm tra độc giả, tình trạng sách và dữ liệu đầu vào.\n\nTiêu chí: mô hình dữ liệu 3 điểm; endpoint 4 điểm; xử lý lỗi 3 điểm.",
      3,
      true,
    ],
    [
      "db-slides",
      "cs204",
      "CSE204.01",
      "slides",
      "Mô hình dữ liệu quan hệ",
      "Bảng gồm các hàng và cột. Khóa chính định danh bản ghi; khóa ngoại liên kết bảng.\n\nVí dụ: Books(id, title) và Loans(id, book_id, reader_id).",
      3,
      true,
    ],
    [
      "db-quiz",
      "cs204",
      "CSE204.01",
      "quiz",
      "Khóa chính và khóa ngoại",
      "Câu 1: Khóa nào định danh duy nhất bản ghi?\nA. Khóa chính\nB. Khóa ngoại\nĐáp án: A. Khóa chính",
      3,
      true,
    ],
    [
      "db-assignment",
      "cs204",
      "CSE204.01",
      "assignment",
      "Thiết kế CSDL thư viện",
      "Vẽ lược đồ Books, Readers và Loans. Nêu khóa chính/ngoại.\n\nTiêu chí: thực thể 4 điểm; ràng buộc 3 điểm; giải thích 3 điểm.",
      3,
      true,
    ],
  ].map(([id, courseId, classId, kind, title, body, level, editable]) => ({
    id,
    courseId,
    classId,
    kind,
    title,
    body,
    level,
    editable,
    revision: 1,
  })) as Material[],
  requests: [
    {
      id: "request-seed",
      itemId: "api-assignment",
      body: "Bổ sung tiêu chí chấm điểm cho từng endpoint và cách xử lý lỗi.",
      reply: "",
      closed: false,
    },
  ],
  completed: [],
  references: [
    {
      id: "ref-pdf",
      courseId: "cs301",
      title: "Bài giảng RESTful API",
      url: "/materials/demo-lesson.pdf",
    },
    {
      id: "ref-http",
      courseId: "cs301",
      title: "HTTP: tổng quan và phương thức",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
    },
  ],
};
export const classFor = (courseId: string, classId: string) =>
  classes.find(
    (c) =>
      c.courseId === courseId &&
      c.id === classId &&
      assignedCourses.includes(courseId),
  );
export const classItems = (
  s: Coordination,
  courseId: string,
  classId: string,
) =>
  classFor(courseId, classId)
    ? s.items.filter((i) => i.courseId === courseId && i.classId === classId)
    : [];
export const findItem = (
  s: Coordination,
  courseId: string,
  classId: string,
  id: string,
) => classItems(s, courseId, classId).find((i) => i.id === id);
function requiredItem(
  s: Coordination,
  courseId: string,
  classId: string,
  id: string,
) {
  const i = findItem(s, courseId, classId, id);
  if (!i) throw Error("Không tìm thấy học liệu trong phạm vi này.");
  return i;
}
const invalidate = (s: Coordination, classId: string) =>
  s.completed.filter((c) => c !== classId);
export function reviewItem(
  s: Coordination,
  courseId: string,
  classId: string,
  id: string,
  level: number,
): Coordination {
  requiredItem(s, courseId, classId, id);
  if (!Number.isInteger(level) || level < 0 || level > 3)
    throw Error("Mức xử lý không hợp lệ.");
  if (level === 2)
    throw Error("Gửi yêu cầu điều chỉnh để nêu rõ nội dung cần sửa.");
  if (
    level === 3 &&
    s.requests.some((r) => r.itemId === id && !r.closed && !r.reply)
  )
    throw Error("Chờ giảng viên phản hồi trước khi duyệt đạt chuẩn.");
  return {
    ...s,
    items: s.items.map((i) => (i.id === id ? { ...i, level } : i)),
    requests: s.requests.map((r) =>
      r.itemId === id && level === 3 ? { ...r, closed: true } : r,
    ),
    completed: invalidate(s, classId),
  };
}
export function requestChange(
  s: Coordination,
  courseId: string,
  classId: string,
  id: string,
  body: string,
  requestId: string,
): Coordination {
  requiredItem(s, courseId, classId, id);
  if (!body.trim()) throw Error("Nhập nội dung cần giảng viên điều chỉnh.");
  if (s.requests.some((r) => r.itemId === id && !r.closed && !r.reply))
    throw Error("Chờ giảng viên phản hồi yêu cầu hiện tại trước.");
  return {
    ...s,
    items: s.items.map((i) => (i.id === id ? { ...i, level: 2 } : i)),
    completed: invalidate(s, classId),
    requests: [
      ...s.requests.map((r) =>
        r.itemId === id && !r.closed ? { ...r, closed: true } : r,
      ),
      {
        id: requestId,
        itemId: id,
        body: body.trim(),
        reply: "",
        closed: false,
      },
    ],
  };
}
export function replyToRequest(
  s: Coordination,
  id: string,
  teacherId: string,
  reply: string,
  body: string,
): Coordination {
  const request = s.requests.find((r) => r.id === id && !r.closed);
  const item = s.items.find((i) => i.id === request?.itemId);
  if (
    !request ||
    !item ||
    classFor(item.courseId, item.classId)?.teacherId !== teacherId
  )
    throw Error("Không có quyền xử lý yêu cầu này.");
  if (!reply.trim() || !body.trim())
    throw Error("Nhập nội dung học liệu và phản hồi.");
  return {
    ...s,
    items: s.items.map((i) =>
      i.id === item.id
        ? { ...i, body: body.trim(), level: 1, revision: i.revision + 1 }
        : i,
    ),
    requests: s.requests.map((r) =>
      r.id === id ? { ...r, reply: reply.trim() } : r,
    ),
    completed: invalidate(s, item.classId),
  };
}
export function saveMaterial(
  s: Coordination,
  input: Material,
  editing: boolean,
): Coordination {
  if (
    !classFor(input.courseId, input.classId) ||
    !Object.hasOwn(kinds, input.kind) ||
    !input.title.trim() ||
    !input.body.trim()
  )
    throw Error("Chọn đúng lớp và nhập đầy đủ tiêu đề, nội dung.");
  if (editing) {
    const old = requiredItem(s, input.courseId, input.classId, input.id);
    if (!old.editable)
      throw Error("Bạn không có quyền chỉnh sửa học liệu này.");
    if (old.kind !== input.kind)
      throw Error("Không đổi loại của học liệu đã tạo.");
  } else if (s.items.some((i) => i.id === input.id))
    throw Error("Học liệu đã tồn tại.");
  const old = s.items.find((i) => i.id === input.id);
  const item = {
    ...input,
    title: input.title.trim(),
    body: input.body.trim(),
    level: editing ? 1 : 0,
    editable: editing ? old!.editable : true,
    revision: editing ? old!.revision + 1 : 1,
  };
  return {
    ...s,
    items: editing
      ? s.items.map((i) => (i.id === input.id ? item : i))
      : [...s.items, item],
    completed: invalidate(s, input.classId),
    requests: editing
      ? s.requests.map((r) =>
          r.itemId === input.id && !r.closed
            ? {
                ...r,
                reply:
                  "Trưởng nhóm HP đã chỉnh sửa trực tiếp; chờ rà soát lại.",
              }
            : r,
        )
      : s.requests,
  };
}
export function canComplete(
  s: Coordination,
  courseId: string,
  classId: string,
) {
  const items = classItems(s, courseId, classId);
  return (
    Object.keys(kinds).every((kind) => items.some((i) => i.kind === kind)) &&
    items.every((i) => i.level === 3) &&
    !s.requests.some((r) => !r.closed && items.some((i) => i.id === r.itemId))
  );
}
export function completeClass(
  s: Coordination,
  courseId: string,
  classId: string,
): Coordination {
  if (!canComplete(s, courseId, classId))
    throw Error("Cần đủ slide, quiz và bài tập đạt M3, không còn yêu cầu mở.");
  return { ...s, completed: [...new Set([...s.completed, classId])] };
}
export function safeReferenceUrl(value: string) {
  try {
    const u = new URL(value, "https://lms.invalid");
    return value.startsWith("/materials/")
      ? u.origin === "https://lms.invalid" &&
          u.pathname.startsWith("/materials/")
      : /^https?:\/\//i.test(value) && ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}
