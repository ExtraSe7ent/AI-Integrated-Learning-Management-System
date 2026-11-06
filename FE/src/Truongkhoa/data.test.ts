import { describe, expect, it } from "vitest";
import { initialData } from "../data/fixtures";
import type { ClassReport, StudentReport } from "../data/fixtures";
import { facultyClasses, summarize, supportReason, supportRows } from "./data";

const student = (id: string, progress: number, average: number): StudentReport => ({
  id,
  name: `SV ${id}`,
  email: "",
  progress,
  selfStudy: 0,
  average,
  submitted: 1,
  chats: 0,
});
const report = (id: string, courseId: string, term: string, students: StudentReport[]): ClassReport => ({
  id,
  name: id,
  courseId,
  courseCode: courseId.toUpperCase(),
  courseTitle: "Học phần",
  teacher: "GV",
  term,
  year: "2026–2027",
  students,
});
const data = {
  ...initialData,
  analytics: {
    pages: [],
    classes: [
      report("A.01", "cs301", "I", [student("1", 80, 8), student("2", 40, 7)]),
      report("A.02", "cs301", "I", [student("3", 90, 4)]),
      report("B.01", "cs204", "I", [student("1", 60, 6)]),
      report("C.01", "cs302", "II", [student("4", 100, 9)]),
    ],
  },
};

describe("Dean faculty monitoring", () => {
  it("counts unique students separately from enrollment rows and weights completion", () => {
    const classes = facultyClasses(data);
    expect(classes).toHaveLength(3);
    expect(summarize(classes)).toMatchObject({
      courses: 2,
      classes: 3,
      students: 3,
      enrollments: 4,
      support: 2,
      alerts: 2,
      completion: 68,
    });
  });
  it("scopes course counts and alerts to the selected course", () => {
    const classes = facultyClasses(data).filter((c) => c.course.id === "cs301");
    expect(summarize(classes)).toMatchObject({ classes: 2, students: 3, support: 2 });
    expect(
      supportRows(classes).every((r) => r.classroom.course.id === "cs301"),
    ).toBe(true);
  });
  it("uses the class term and has neutral totals for an empty term", () => {
    expect(facultyClasses(data, "2026-2").map((c) => c.id)).toEqual(["C.01"]);
    expect(summarize(facultyClasses(initialData))).toMatchObject({
      students: 0,
      completion: 0,
      support: 0,
      alerts: 0,
    });
  });
  it("explains exact threshold boundaries without labeling a 50% / 5 student at risk", () => {
    expect(supportReason({ progress: 50, grade: 5 })).toBe("");
    expect(supportReason({ progress: 49, grade: 5 })).toBe("Chậm tiến độ");
    expect(supportReason({ progress: 50, grade: 4.9 })).toBe(
      "Điểm bài tập thấp",
    );
    expect(supportReason({ progress: 49, grade: 4.9 })).toBe(
      "Tiến độ và điểm thấp",
    );
  });
});
