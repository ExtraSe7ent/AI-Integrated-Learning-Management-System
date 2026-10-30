import { describe, expect, it } from "vitest";
import { initialData } from "../data/fixtures";
import { facultyClasses, summarize, supportReason, supportRows } from "./data";

describe("Dean faculty monitoring", () => {
  it("counts unique students separately from enrollment rows and weights completion", () => {
    const classes = facultyClasses(initialData);
    expect(classes).toHaveLength(4);
    const result = summarize(classes);
    expect(result).toMatchObject({
      courses: 3,
      classes: 4,
      students: 12,
      enrollments: 23,
      support: 4,
      alerts: 7,
      completion: 67,
    });
    const total = classes
      .flatMap((c) => c.students)
      .reduce((sum, s) => sum + s.progress, 0);
    expect(result.completion).toBe(Math.round(total / 23));
  });
  it("scopes course counts and alerts to the selected course", () => {
    const classes = facultyClasses(initialData).filter(
      (c) => c.course.id === "cs301",
    );
    expect(summarize(classes)).toMatchObject({
      classes: 2,
      students: 12,
      support: 4,
    });
    expect(supportRows(classes)).toHaveLength(4);
    expect(
      supportRows(classes).every((r) => r.classroom.course.id === "cs301"),
    ).toBe(true);
  });
  it("has neutral totals for an empty term", () => {
    const classes = facultyClasses(initialData, "2026-2");
    expect(classes).toEqual([]);
    expect(summarize(classes)).toMatchObject({
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
  it("reflects the existing student's progress only in the linked class", () => {
    const before = facultyClasses(initialData);
    const changed = {
      ...initialData,
      studySessions: {
        ...initialData.studySessions,
        s1: { progress: 4, answers: {}, completedAt: null },
      },
    };
    const after = facultyClasses(changed);
    expect(after[0].students.find((s) => s.id === "sv1")?.progress).toBe(100);
    expect(summarize([after[0]]).support).toBe(2);
    expect(after[2].students).toEqual(before[2].students);
    expect(initialData.studySessions).toEqual({});
  });
});
