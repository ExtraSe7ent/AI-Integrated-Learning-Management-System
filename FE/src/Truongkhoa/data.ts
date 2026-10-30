import { learningSummary } from "../data/learningSummary";
import { courses, gradeClasses, students } from "../data/fixtures";
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
  course: Course;
  teacher: string;
  students: Enrollment[];
}
export function facultyClasses(
  data: DemoData,
  term = ACTIVE_TERM,
): FacultyClass[] {
  if (term !== ACTIVE_TERM) return [];
  const firstClass = gradeClasses[0].students.map((s) =>
    s.id === "sv1"
      ? {
          ...s,
          name: data.profile.name,
          progress: learningSummary(data).progress,
          grade: learningSummary(data).average,
        }
      : { ...s },
  );
  return [
    {
      id: "CSE301.01",
      course: courses[0],
      teacher: courses[0].teacher,
      students: firstClass,
    },
    {
      id: "CSE301.02",
      course: courses[0],
      teacher: courses[0].teacher,
      students: gradeClasses[1].students.map((s) => ({ ...s })),
    },
    {
      id: "CSE204.01",
      course: courses[1],
      teacher: courses[1].teacher,
      students: students.slice(0, 6).map((s) => ({
        ...s,
        name: s.id === "sv1" ? data.profile.name : s.name,
        progress: Math.min(100, s.progress + 10),
        grade: Math.min(10, Math.round((s.grade + 0.2) * 10) / 10),
      })),
    },
    {
      id: "CSE302.01",
      course: courses[2],
      teacher: courses[2].teacher,
      students: students.slice(3).map((s) => ({
        ...s,
        progress: Math.min(100, s.progress + 5),
        grade: Math.min(10, Math.round((s.grade + 0.3) * 10) / 10),
      })),
    },
  ];
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
