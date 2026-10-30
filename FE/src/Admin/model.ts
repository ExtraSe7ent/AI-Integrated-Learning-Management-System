import type { Role } from "../data/fixtures";
export const roleNames: Record<Role, string> = {
  "sinh-vien": "Sinh viên",
  "giang-vien": "Giảng viên",
  "truong-khoa": "Trưởng khoa",
  "truong-nhom-hp": "Trưởng nhóm HP",
  admin: "Admin",
};
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  faculty: string;
  kind: "student" | "teacher" | "admin";
  role: Role;
  active: boolean;
  mustChange: boolean;
  passwordHash: string;
}
export interface ManagedCourse {
  id: string;
  code: string;
  title: string;
  faculty: string;
}
export interface ManagedClass {
  id: string;
  courseId: string;
  name: string;
  term: string;
  year: string;
  round: string;
  teacherId: string;
  leaderId: string;
  studentIds: string[];
}
export interface Administration {
  users: ManagedUser[];
  courses: ManagedCourse[];
  classes: ManagedClass[];
}
const faculty = "Khoa học và Kỹ thuật máy tính";
const user = (
  id: string,
  name: string,
  email: string,
  role: Role,
  kind: ManagedUser["kind"],
): ManagedUser => ({
  id,
  name,
  email,
  faculty,
  role,
  kind,
  active: true,
  mustChange: false,
  passwordHash: "",
});
export const initialAdmin: Administration = {
  users: [
    user(
      "23110149",
      "Nguyễn Quang Anh",
      "student@example.edu",
      "sinh-vien",
      "student",
    ),
    user(
      "GV001",
      "Nguyễn Minh Anh",
      "lecturer@example.edu",
      "giang-vien",
      "teacher",
    ),
    user("GV002", "Trần Hoàng Nam", "nam@example.edu", "giang-vien", "teacher"),
    user(
      "TK001",
      "Trần Thu Hương",
      "dean@example.edu",
      "truong-khoa",
      "teacher",
    ),
    user(
      "TN001",
      "Lê Thanh Hà",
      "courseleader@example.edu",
      "truong-nhom-hp",
      "teacher",
    ),
    user("AD001", "Quản trị viên", "admin@example.edu", "admin", "admin"),
  ],
  courses: [
    {
      id: "cs301",
      code: "CSE301",
      title: "Phát triển ứng dụng nâng cao",
      faculty,
    },
    { id: "cs204", code: "CSE204", title: "Cơ sở dữ liệu", faculty },
    {
      id: "cs302",
      code: "CSE302",
      title: "Thiết kế giao diện người dùng",
      faculty,
    },
  ],
  classes: [
    {
      id: "CSE301.01",
      courseId: "cs301",
      name: "CSE301.01",
      term: "I",
      year: "2026–2027",
      round: "1",
      teacherId: "GV001",
      leaderId: "TN001",
      studentIds: ["23110149"],
    },
    {
      id: "CSE301.02",
      courseId: "cs301",
      name: "CSE301.02",
      term: "I",
      year: "2026–2027",
      round: "1",
      teacherId: "GV001",
      leaderId: "TN001",
      studentIds: [],
    },
    {
      id: "CSE204.01",
      courseId: "cs204",
      name: "CSE204.01",
      term: "I",
      year: "2026–2027",
      round: "1",
      teacherId: "GV002",
      leaderId: "TN001",
      studentIds: ["23110149"],
    },
    {
      id: "CSE302.01",
      courseId: "cs302",
      name: "CSE302.01",
      term: "I",
      year: "2026–2027",
      round: "1",
      teacherId: "GV001",
      leaderId: "",
      studentIds: ["23110149"],
    },
  ],
};
const normalized = (v: string) => v.trim().toLocaleLowerCase("vi");
const header = (v: string) =>
  normalized(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s/g, "");
const emailOK = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export interface ImportRow {
  line: number;
  user: ManagedUser;
  errors: string[];
}
export function previewAccounts(
  state: Administration,
  rows: string[][],
  kind: "student" | "teacher",
): ImportRow[] {
  const expected =
    kind === "student"
      ? ["Mã SV", "Họ tên", "Email"]
      : ["Mã GV", "Họ tên", "Email", "Khoa"];
  const indices = expected.map((v) =>
    (rows[0] || []).findIndex((x) => header(x) === header(v)),
  );
  if (indices.some((i) => i < 0))
    throw Error("Thiếu cột bắt buộc: " + expected.join(", "));
  const ids = new Set(state.users.map((u) => normalized(u.id))),
    emails = new Set(state.users.map((u) => normalized(u.email)));
  return rows
    .slice(1)
    .map((row, i) => ({ row, i }))
    .filter(({ row }) => row.some((v) => v.trim()))
    .map(({ row, i }) => {
      const [id, name, email, dept] = indices.map((n) => (row[n] || "").trim());
      const u = user(
        id,
        name,
        email,
        kind === "student" ? "sinh-vien" : "giang-vien",
        kind,
      );
      u.faculty = dept || faculty;
      u.mustChange = true;
      const errors: string[] = [];
      if (!id || !/^[\p{L}\p{N}_.-]+$/u.test(id))
        errors.push("Mã không hợp lệ");
      if (!name) errors.push("Thiếu họ tên");
      if (!emailOK(email)) errors.push("Email không hợp lệ");
      if (kind === "teacher" && !dept) errors.push("Thiếu khoa");
      if (ids.has(normalized(id)))
        errors.push("Mã đã tồn tại hoặc trùng trong tệp");
      if (emails.has(normalized(email)))
        errors.push("Email đã tồn tại hoặc trùng trong tệp");
      ids.add(normalized(id));
      emails.add(normalized(email));
      return { line: i + 2, user: u, errors };
    });
}
export function importAccounts(
  state: Administration,
  rows: ImportRow[],
): Administration {
  if (!rows.length) throw Error("Tệp không có dòng dữ liệu.");
  if (rows.some((r) => r.errors.length))
    throw Error("Sửa các dòng lỗi trước khi nhập.");
  const checked = previewAccounts(
    state,
    [
      ["Mã GV", "Họ tên", "Email", "Khoa"],
      ...rows.map((r) => [
        r.user.id,
        r.user.name,
        r.user.email,
        r.user.faculty,
      ]),
    ],
    "teacher",
  );
  if (checked.some((r) => r.errors.length))
    throw Error("Dữ liệu đã thay đổi; kiểm tra lại tệp.");
  return { ...state, users: [...state.users, ...rows.map((r) => r.user)] };
}
export function updateUser(
  state: Administration,
  id: string,
  change: Partial<
    Pick<ManagedUser, "role" | "active" | "mustChange" | "passwordHash">
  >,
): Administration {
  const current = state.users.find((u) => u.id === id);
  if (!current) throw Error("Không tìm thấy tài khoản.");
  if (current.kind === "admin")
    throw Error("Không thay đổi tài khoản quản trị tại đây.");
  if (
    change.role &&
    (current.kind !== "teacher" ||
      !["giang-vien", "truong-khoa", "truong-nhom-hp"].includes(change.role))
  )
    throw Error("Chỉ gán vai trò quản lý cho tài khoản giảng viên.");
  return {
    ...state,
    users: state.users.map((u) => (u.id === id ? { ...u, ...change } : u)),
  };
}
export function saveCourse(
  state: Administration,
  course: ManagedCourse,
): Administration {
  const c = {
    ...course,
    code: course.code.trim(),
    title: course.title.trim(),
    faculty: course.faculty.trim(),
  };
  if (!c.code || !c.title || !c.faculty)
    throw Error("Nhập mã, tên học phần và khoa.");
  if (
    state.courses.some(
      (x) => x.id !== c.id && normalized(x.code) === normalized(c.code),
    )
  )
    throw Error("Mã học phần đã tồn tại.");
  return {
    ...state,
    courses: state.courses.some((x) => x.id === c.id)
      ? state.courses.map((x) => (x.id === c.id ? c : x))
      : [...state.courses, c],
  };
}
export function saveClass(
  state: Administration,
  c: ManagedClass,
): Administration {
  if (!state.courses.some((x) => x.id === c.courseId))
    throw Error("Học phần không tồn tại.");
  if (
    !c.name.trim() ||
    !c.term ||
    !/^\d{4}[–-]\d{4}$/.test(c.year) ||
    !/^\d+$/.test(c.round) ||
    +c.round < 1
  )
    throw Error("Nhập tên lớp, học kỳ, năm học dạng 2026–2027 và đợt hợp lệ.");
  if (
    state.classes.some(
      (x) =>
        x.id !== c.id &&
        normalized(x.name) === normalized(c.name) &&
        x.term === c.term &&
        x.year === c.year &&
        x.round === c.round,
    )
  )
    throw Error("Lớp đã tồn tại trong kỳ và đợt này.");
  if (
    !state.users.some(
      (u) => u.id === c.teacherId && u.kind === "teacher" && u.active,
    )
  )
    throw Error("Chọn giảng viên đang hoạt động.");
  if (
    c.leaderId &&
    !state.users.some(
      (u) => u.id === c.leaderId && u.role === "truong-nhom-hp" && u.active,
    )
  )
    throw Error("Chọn Trưởng nhóm HP đang hoạt động.");
  return {
    ...state,
    classes: state.classes.some((x) => x.id === c.id)
      ? state.classes.map((x) => (x.id === c.id ? c : x))
      : [...state.classes, c],
  };
}
export function previewEnrollment(
  state: Administration,
  classId: string,
  rows: string[][],
) {
  const cls = state.classes.find((c) => c.id === classId);
  if (!cls) throw Error("Lớp không tồn tại.");
  const index = (rows[0] || []).findIndex((v) => header(v) === header("Mã SV"));
  if (index < 0) throw Error("Thiếu cột Mã SV.");
  const seen = new Set(cls.studentIds.map(normalized));
  return rows
    .slice(1)
    .map((row, i) => ({ id: (row[index] || "").trim(), line: i + 2 }))
    .filter((r) => r.id)
    .map((r) => {
      const u = state.users.find(
        (u) =>
          normalized(u.id) === normalized(r.id) &&
          u.kind === "student" &&
          u.active,
      );
      const error = !u
        ? "Không có tài khoản SV đang hoạt động"
        : seen.has(normalized(r.id))
          ? "Sinh viên đã có trong lớp hoặc trùng tệp"
          : "";
      seen.add(normalized(r.id));
      return { ...r, id: u?.id || r.id, name: u?.name || "—", error };
    });
}
export function enrollStudents(
  state: Administration,
  classId: string,
  rows: ReturnType<typeof previewEnrollment>,
): Administration {
  if (!rows.length || rows.some((r) => r.error))
    throw Error("Danh sách trống hoặc có dòng lỗi.");
  const checked = previewEnrollment(state, classId, [
    ["Mã SV"],
    ...rows.map((r) => [r.id]),
  ]);
  if (checked.some((r) => r.error))
    throw Error("Dữ liệu đã đổi; kiểm tra lại danh sách.");
  return {
    ...state,
    classes: state.classes.map((c) =>
      c.id === classId
        ? { ...c, studentIds: [...c.studentIds, ...checked.map((r) => r.id)] }
        : c,
    ),
  };
}
export async function passwordDigest(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
