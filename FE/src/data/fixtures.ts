import { initialCoordination } from "../Truongnhomhp/model";
export type Role =
  "sinh-vien" | "giang-vien" | "truong-khoa" | "truong-nhom-hp";
export interface Course {
  id: string;
  code: string;
  title: string;
  teacher: string;
  color: string;
  students: number;
  progress: number;
  room: string;
  time: string;
}
export const courses: Course[] = [
  {
    id: "cs301",
    code: "CSE301",
    title: "Phát triển ứng dụng nâng cao",
    teacher: "TS. Nguyễn Minh Anh",
    color: "rose",
    students: 36,
    progress: 68,
    room: "P.402 · Cơ sở Mỹ Đình",
    time: "Thứ Sáu · 13:00 – 15:30",
  },
  {
    id: "cs204",
    code: "CSE204",
    title: "Cơ sở dữ liệu",
    teacher: "ThS. Trần Hoàng Nam",
    color: "sage",
    students: 42,
    progress: 45,
    room: "P.305 · Cơ sở Mỹ Đình",
    time: "Thứ Hai · 09:00 – 11:30",
  },
  {
    id: "cs302",
    code: "CSE302",
    title: "Thiết kế giao diện người dùng",
    teacher: "ThS. Lê Thu Hà",
    color: "sand",
    students: 32,
    progress: 82,
    room: "P.201 · Cơ sở Mỹ Đình",
    time: "Thứ Tư · 13:00 – 15:30",
  },
];
export interface Lesson {
  id: string;
  title: string;
  order: number;
  published: boolean;
  activity: boolean;
}
export interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
  page: number;
  approved: boolean;
}
export const initialQuestions: Question[] = [
  {
    id: "q1",
    text: "Trong kiến trúc REST, mỗi tài nguyên được định danh bằng gì?",
    options: [
      "Một URI duy nhất",
      "Một kết nối TCP",
      "Một bảng dữ liệu",
      "Một phiên đăng nhập",
    ],
    correct: 0,
    explanation:
      "URI định danh tài nguyên; HTTP method thể hiện hành động trên tài nguyên đó.",
    page: 1,
    approved: true,
  },
  {
    id: "q2",
    text: "HTTP method nào được dùng để tạo một tài nguyên mới?",
    options: ["GET", "POST", "DELETE", "HEAD"],
    correct: 1,
    explanation: "POST thường tạo một tài nguyên mới trong collection.",
    page: 2,
    approved: true,
  },
  {
    id: "q3",
    text: "Mã trạng thái nào thể hiện tạo tài nguyên thành công?",
    options: ["200 OK", "400 Bad Request", "201 Created", "404 Not Found"],
    correct: 2,
    explanation: "201 Created cho biết tài nguyên đã được tạo thành công.",
    page: 3,
    approved: true,
  },
];
export const slideTitles = [
  "RESTful API là gì?",
  "Tài nguyên và HTTP methods",
  "Mã trạng thái HTTP",
  "Thiết kế API trong thực tế",
];
export const students = [
  "Nguyễn Quang Anh",
  "Trần Minh Phương",
  "Lê Hoàng Nam",
  "Phạm Thu Trang",
  "Nguyễn Đức Huy",
  "Vũ Khánh Linh",
  "Đặng Minh Đức",
  "Bùi Ngọc Mai",
].map((name, i) => ({
  id: `sv${i + 1}`,
  name,
  code: `23110${149 + i}`,
  email: `student${i + 1}@example.edu`,
  progress: [68, 92, 35, 100, 24, 78, 55, 88][i],
  grade: [8.5, 9.2, 5.5, 9.6, 4.2, 8, 7.1, 8.8][i],
}));
export const gradeClasses = [
  { code: "CSE301.01", label: "CSE301.01 · Nhóm 01", students },
  {
    code: "CSE301.02",
    label: "CSE301.02 · Nhóm 02",
    students: [
      {
        id: "sv9",
        name: "Đỗ Hải Yến",
        code: "23110201",
        progress: 80,
        grade: 8.2,
      },
      {
        id: "sv10",
        name: "Hoàng Tuấn Kiệt",
        code: "23110202",
        progress: 60,
        grade: 7.4,
      },
      {
        id: "sv11",
        name: "Ngô Mai Chi",
        code: "23110203",
        progress: 90,
        grade: 9,
      },
      {
        id: "sv12",
        name: "Đinh Quốc Bảo",
        code: "23110204",
        progress: 40,
        grade: 4.8,
      },
    ],
  },
];
export interface Feedback {
  id: string;
  student: string;
  course: string;
  lesson: string;
  category: string;
  body: string;
  images: string[];
  response: string;
  resolved: boolean;
  date: string;
}
export interface Gap {
  id: string;
  page: number;
  body: string;
  response: string;
}
export interface Appeal {
  id: string;
  assignmentId: string;
  question: string;
  reason: string;
  response: string;
  grade?: number;
  status: "pending" | "accepted" | "rejected";
}
export interface Assessment {
  attempts: number;
  draft: null | { answers: string[]; deadline: number };
  result: null | {
    score: number;
    answers: string[];
    submitted: string;
    approved?: boolean;
    comment?: string;
  };
}
export interface StudyProgress {
  progress: number;
  answers: Record<string, number>;
  completedAt: string | null;
}
export interface Session {
  id: string;
  title: string;
  opens: string;
  closes: string;
  published: boolean;
  late: boolean;
}
export interface Assignment {
  id: string;
  title: string;
  minutes: number;
  opens: string;
  closes: string;
  published: boolean;
  preventPaste: boolean;
  attempts: number;
  random: boolean;
}
export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  kind: "pdf" | "link" | "video";
}
export const demoDate = "16 tháng 10, 2026";
export const initialData = {
  lessons: [
    {
      id: "l1",
      title: "Kiến trúc ứng dụng web hiện đại",
      order: 1,
      published: true,
      activity: true,
    },
    {
      id: "l2",
      title: "Thiết kế RESTful API",
      order: 2,
      published: true,
      activity: true,
    },
    {
      id: "l3",
      title: "Xác thực và phân quyền",
      order: 3,
      published: false,
      activity: false,
    },
  ] as Lesson[],
  questions: initialQuestions,
  sessions: [
    {
      id: "s1",
      title: "RESTful API: từ nguyên lý đến thực hành",
      opens: "2026-10-01T08:00",
      closes: "2027-01-31T23:59",
      published: true,
      late: true,
    },
    {
      id: "s2",
      title: "Xác thực và phân quyền",
      opens: "2027-02-01T08:00",
      closes: "2027-02-07T23:59",
      published: false,
      late: false,
    },
  ] as Session[],
  assignments: [
    {
      id: "a1",
      title: "Thiết kế API quản lý thư viện",
      minutes: 30,
      opens: "2026-10-01T08:00",
      closes: "2027-01-31T23:59",
      published: true,
      preventPaste: true,
      attempts: 3,
      random: false,
    },
  ] as Assignment[],
  resources: [
    {
      id: "r1",
      title: "Bài giảng RESTful API",
      description: "Tài liệu minh họa · PDF, 1 trang",
      url: "/materials/demo-lesson.pdf",
      kind: "pdf",
    },
    {
      id: "r2",
      title: "HTTP: tổng quan và phương thức",
      description: "Tài liệu chính thức MDN Web Docs",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
      kind: "link",
    },
  ] as Resource[],
  studySessions: {} as Record<string, StudyProgress>,
  gaps: [
    {
      id: "g1",
      page: 2,
      body: "Khi nào nên dùng PUT thay cho PATCH?",
      response: "",
    },
  ] as Gap[],
  notes: "",
  chat: [] as { question: string; answer: string; page: number }[],
  feedback: [
    {
      id: "f1",
      student: "Nguyễn Quang Anh",
      course: "cs301",
      lesson: "Thiết kế RESTful API",
      category: "Bài giảng",
      body: "Thầy/cô có thể bổ sung ví dụ về phân trang và lọc tài nguyên không ạ?",
      images: [],
      response: "",
      resolved: false,
      date: "15/10/2026",
    },
  ] as Feedback[],
  appeals: [] as Appeal[],
  assessments: {} as Record<string, Assessment>,
  live: {
    active: false,
    code: "261016",
    question: 0,
    revealed: false,
    expiresAt: 0,
    answers: {} as Record<string, number>,
  },
  profile: {
    name: "Nguyễn Quang Anh",
    email: "student@example.edu",
    phone: "",
    major: "Khoa học và Kỹ thuật máy tính",
  },
  teacherProfile: {
    name: "Nguyễn Minh Anh",
    email: "lecturer@example.edu",
    phone: "",
    major: "Khoa học và Kỹ thuật máy tính",
  },
  deanProfile: {
    name: "Trần Thu Hương",
    email: "dean@example.edu",
    phone: "",
  },
  notices: [
    "Phiên tự học RESTful API đã mở.",
    "Bài tập Thiết kế API đang chờ bạn hoàn thành.",
    "Lớp CSE301 có lịch học lúc 13:00 hôm nay.",
  ],
  readNotices: false,
  teacherNotices: [
    "Có bài nộp mới trong lớp CSE301.01.",
    "Sinh viên gửi câu hỏi về PUT và PATCH.",
    "Lớp CSE301 có lịch học lúc 13:00 hôm nay.",
  ],
  readTeacherNotices: false,
  readDeanNotices: false,
  coordination: initialCoordination,
  leaderProfile: {
    name: "Lê Thanh Hà",
    email: "courseleader@example.edu",
    phone: "",
  },
  readLeaderNotices: false,
};
export type DemoData = typeof initialData;
