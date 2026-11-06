import { courses as decorations } from "./fixtures";
import type { Course, DemoData, Lesson } from "./fixtures";
import type { ManagedClass } from "../Admin/model";

/**
 * What the signed-in account is assigned to, read from the server's admin registry (GET /api/bootstrap).
 * Screens must use this instead of the fixed demo course list, so a course or class created by Admin appears
 * for exactly the lecturer, course leader and students assigned to it.
 */
export type Viewer = { id: string; role: string } | null | undefined;

const COLORS = ["rose", "sage", "sand"];
const DEFAULT_CLASS = "CSE301.01";

export function classesOf(data: DemoData, viewer: Viewer): ManagedClass[] {
  if (!viewer) return [];
  return data.admin.classes.filter((c) => {
    switch (viewer.role) {
      case "giang-vien":
        return c.teacherId === viewer.id;
      case "truong-nhom-hp":
        return c.leaderId === viewer.id;
      case "sinh-vien":
        return c.studentIds.includes(viewer.id);
      default:
        return true; // Trưởng khoa and Admin see every class.
    }
  });
}

const nameOf = (data: DemoData, id: string) =>
  data.admin.users.find((u) => u.id === id)?.name ?? id;

/** Course cards for the viewer. Room, schedule and progress are not on the server yet, so known demo
 * courses keep their sample values and new ones show "Chưa xếp lịch". */
export function coursesOf(data: DemoData, viewer: Viewer): Course[] {
  const mine = classesOf(data, viewer);
  const ids = new Set(mine.map((c) => c.courseId));
  return data.admin.courses
    .filter((c) => ids.has(c.id))
    .map((c, i) => {
      const deco = decorations.find((d) => d.id === c.id);
      const own = mine.filter((x) => x.courseId === c.id);
      const teachers = [...new Set(own.map((x) => x.teacherId).filter(Boolean))];
      // A student's roster only lists themself, so they count the class size the server sends.
      const student = viewer?.role === "sinh-vien";
      const enrolled = own.reduce(
        (n, x) => n + (student ? (x.studentCount ?? x.studentIds.length) : x.studentIds.length),
        0,
      );
      return {
        id: c.id,
        code: c.code,
        title: c.title,
        teacher: teachers.map((t) => nameOf(data, t)).join(", ") || "Chưa phân công giảng viên",
        color: deco?.color ?? COLORS[i % COLORS.length],
        students: student && deco && own.every((x) => x.studentCount === undefined) ? deco.students : enrolled,
        progress: deco?.progress ?? 0,
        room: deco?.room ?? "Chưa xếp phòng",
        time: deco?.time ?? "Chưa xếp lịch",
      };
    });
}

/** Class name for display (e.g. "CSE310.01"); new classes have a generated id that means nothing to users. */
export const classLabel = (data: DemoData, id: string) =>
  data.admin.classes.find((c) => c.id === id)?.name || id;

export const classOfLesson = (lesson: Lesson) => lesson.classId || DEFAULT_CLASS;

/** Lessons of the viewer's classes; Trưởng khoa and Admin see all. */
export function lessonsOf(data: DemoData, viewer: Viewer): Lesson[] {
  if (!viewer || viewer.role === "truong-khoa" || viewer.role === "admin") return data.lessons;
  const mine = new Set(classesOf(data, viewer).map((c) => c.id));
  return data.lessons.filter((l) => mine.has(classOfLesson(l)));
}

/** The course leader's assignment, in the shape the coordination model checks (see Truongnhomhp/model). */
export function leaderScopeOf(data: DemoData, viewer: Viewer) {
  const classes = classesOf(data, viewer).map((c) => ({
    id: c.id,
    name: c.name || c.id,
    courseId: c.courseId,
    teacherId: c.teacherId,
    teacher: nameOf(data, c.teacherId),
  }));
  return { courses: [...new Set(classes.map((c) => c.courseId))], classes };
}

/** Every class, for checks made from the lecturer's side (who may answer a request). */
export function allClassesScope(data: DemoData) {
  const classes = data.admin.classes.map((c) => ({
    id: c.id,
    name: c.name || c.id,
    courseId: c.courseId,
    teacherId: c.teacherId,
    teacher: nameOf(data, c.teacherId),
  }));
  return { courses: [...new Set(classes.map((c) => c.courseId))], classes };
}
