import { it, expect } from "vitest";
import { initialData } from "./fixtures";
import type { DemoData } from "./fixtures";
import { classesOf, coursesOf, leaderScopeOf, lessonsOf } from "./scope";
import { classFor, completeClass, demoScope } from "../Truongnhomhp/model";

/** Admin creates course TEST01 and class TEST01.01 for GV002 and course leader TN009. */
function withNewCourse(): DemoData {
  const d = structuredClone(initialData) as DemoData;
  d.admin.courses.push({ id: "test01", code: "TEST01", title: "Học phần tester", faculty: "CNTT" } as never);
  d.admin.users.push({ ...d.admin.users.find((u) => u.id === "TN001")!, id: "TN009", name: "TNHP mới" });
  d.admin.classes.push({
    id: "TEST01.01", courseId: "test01", name: "TEST01.01", term: "I", year: "2026–2027", round: "1",
    teacherId: "GV002", leaderId: "TN009", studentIds: ["23110149"],
  });
  d.lessons.push({ id: "lt", classId: "TEST01.01", title: "Bài tester", order: 9, published: false, activity: false });
  return d;
}
const gv = (id: string) => ({ id, role: "giang-vien" });

it("a course Admin assigns appears for its lecturer, leader and students only", () => {
  const d = withNewCourse();
  expect(coursesOf(d, gv("GV002")).map((c) => c.code)).toContain("TEST01");
  expect(coursesOf(d, gv("GV001")).map((c) => c.code)).not.toContain("TEST01");
  expect(coursesOf(d, { id: "TN009", role: "truong-nhom-hp" }).map((c) => c.code)).toEqual(["TEST01"]);
  expect(coursesOf(d, { id: "23110149", role: "sinh-vien" }).map((c) => c.code)).toContain("TEST01");
  const card = coursesOf(d, gv("GV002")).find((c) => c.code === "TEST01")!;
  expect(card.teacher).toBe(d.admin.users.find((u) => u.id === "GV002")!.name);
  expect(card.time).toBe("Chưa xếp lịch");
  expect(coursesOf(d, null)).toEqual([]);
});

it("lecturers see only their classes' lessons; Trưởng khoa sees all", () => {
  const d = withNewCourse();
  expect(lessonsOf(d, gv("GV002")).map((l) => l.id)).toEqual(["lt"]);
  expect(lessonsOf(d, gv("GV001")).map((l) => l.id)).not.toContain("lt");
  expect(lessonsOf(d, { id: "TK001", role: "truong-khoa" })).toHaveLength(d.lessons.length);
  expect(classesOf(d, { id: "AD001", role: "admin" })).toHaveLength(d.admin.classes.length);
});

it("the course leader's coordination checks use the real assignment, not the demo list", () => {
  const d = withNewCourse();
  const scope = leaderScopeOf(d, { id: "TN009", role: "truong-nhom-hp" });
  expect(classFor("test01", "TEST01.01", scope)?.teacherId).toBe("GV002");
  expect(classFor("test01", "TEST01.01", demoScope)).toBeUndefined();
  expect(classFor("cs301", "CSE301.01", scope)).toBeUndefined();
  expect(() => completeClass(d.coordination, "test01", "TEST01.01", scope)).toThrow("Cần đủ slide");
});
