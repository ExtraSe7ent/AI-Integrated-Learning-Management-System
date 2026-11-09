import type { Course, DemoData } from "../data/fixtures";

export const ACTIVE_TERM = "2026-1";
export const terms = [
  { id: ACTIVE_TERM, label: "Học kỳ I · 2026–2027" },
  { id: "2026-2", label: "Học kỳ II · 2026–2027" },
];
export const facultyName = "Khoa Công nghệ tiên tiến";
export interface Enrollment {
  id: string;
  name: string;
  code: string;
  progress: number;
  grade: number;
}
export interface FacultyClass {
  id: string;
  course: Pick<Course, "id" | "code" | "title">;
  teacher: string;
  students: Enrollment[];
}
const termOf = (year = "", term = "") =>
  `${year.slice(0, 4)}-${term === "II" ? 2 : 1}`;
export function facultyClasses(
  data: DemoData,
  term = ACTIVE_TERM,
): FacultyClass[] {
  return data.analytics.classes
    .filter((c) => termOf(c.year, c.term) === term)
    .map((c) => ({
      id: c.name,
      course: { id: c.courseId, code: c.courseCode, title: c.courseTitle },
      teacher: c.teacher,
      students: c.students.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.id,
        progress: s.progress,
        grade: s.average,
      })),
    }));
}
export function supportReason(student: Pick<Enrollment, "progress" | "grade">) {
  const slow = student.progress < 50,
    lowGrade = student.grade < 5;
  return slow && lowGrade
    ? "Tiến độ và điểm thấp"
    : slow
      ? "Chậm tiến độ"
      : lowGrade
        ? "Điểm bài tập thấp"
        : "";
}
export function supportRows(classes: FacultyClass[]) {
  return classes.flatMap((classroom) =>
    classroom.students
      .filter((s) => supportReason(s))
      .map((student) => ({
        student,
        classroom,
        reason: supportReason(student),
      })),
  );
}
export function summarize(classes: FacultyClass[]) {
  const enrollments = classes.flatMap((c) => c.students);
  const alerts = supportRows(classes);
  return {
    courses: new Set(classes.map((c) => c.course.id)).size,
    classes: classes.length,
    students: new Set(enrollments.map((s) => s.id)).size,
    enrollments: enrollments.length,
    completion: enrollments.length
      ? Math.round(
          enrollments.reduce((sum, s) => sum + s.progress, 0) /
            enrollments.length,
        )
      : 0,
    support: new Set(alerts.map((a) => a.student.id)).size,
    alerts: alerts.length,
  };
}
export function deanLink(
  path: string,
  term: string,
  filters: Record<string, string> = {},
) {
  const query = new URLSearchParams({ ky: term, ...filters });
  return `/truong-khoa/${path}?${query}`;
}
