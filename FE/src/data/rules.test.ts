import { describe, expect, it } from "vitest";
import {
  canAdvance,
  selfStudyGrade,
  assignmentAverage,
  sessionState,
  validateImages,
  scoreAnswers,
} from "./rules";
import { initialData } from "./fixtures";
import { assessmentFor, updateAssessment } from "./assessment";
import { advanceStudy, emptyStudy, studyCompletion } from "./study";
describe("Learning requirements", () => {
  it("requires an answer before advancing but accepts a wrong answer", () => {
    expect(canAdvance(true, undefined)).toBe(false);
    expect(canAdvance(true, false)).toBe(true);
    expect(canAdvance(false, undefined)).toBe(true);
  });
  it("counts only on-time sessions towards self-study grade", () => {
    expect(selfStudyGrade(["on-time", "late", "pending", "on-time"])).toBe(5);
    expect(selfStudyGrade([])).toBe(0);
  });
  it("averages assignment scores without weighting or dropping zero", () => {
    expect(assignmentAverage([0, 10, 8])).toBe(6);
    expect(assignmentAverage([])).toBe(0);
  });
  it("opens at start and closes exactly at deadline", () => {
    expect(sessionState(100, 200, 99)).toBe("scheduled");
    expect(sessionState(100, 200, 100)).toBe("open");
    expect(sessionState(100, 200, 200)).toBe("closed");
  });
  it("limits feedback to five images and 5 MB in total", () => {
    expect(
      validateImages(
        Array.from({ length: 6 }, () => ({ size: 1, type: "image/png" })),
      ),
    ).toBeTruthy();
    expect(
      validateImages([{ size: 5 * 1024 * 1024 + 1, type: "image/png" }]),
    ).toBeTruthy();
    expect(validateImages([{ size: 2, type: "application/pdf" }])).toBeTruthy();
    expect(validateImages([{ size: 2, type: "image/svg+xml" }])).toBeTruthy();
    expect(validateImages([{ size: 5 * 1024 * 1024, type: "image/png" }])).toBe(
      "",
    );
  });
  it("scores unanswered and incorrect answers as zero", () => {
    expect(scoreAnswers([0, undefined, 2], [0, 1, 2])).toBe(6.7);
  });
  it("keeps drafts, attempts and results isolated by assignment", () => {
    const data = updateAssessment(initialData, "a2", {
      attempts: 1,
      draft: { answers: ["1"], deadline: 100 },
    });
    expect(assessmentFor(data, "a1").attempts).toBe(0);
    expect(assessmentFor(data, "a1").draft).toBeNull();
    expect(assessmentFor(data, "a2").draft?.deadline).toBe(100);
  });
  it("does not grant on-time credit to late completion or change closed read-only progress", () => {
    const session = {
      ...initialData.sessions[0],
      opens: new Date(100).toISOString(),
      closes: new Date(200).toISOString(),
    };
    const beforeFinalPage = { ...emptyStudy, progress: 3 };
    expect(advanceStudy(emptyStudy, 4, session, 199)).toEqual(emptyStudy);
    const late = advanceStudy(beforeFinalPage, 4, session, 201);
    expect(studyCompletion(late, session)).toBe("late");
    expect(
      studyCompletion(advanceStudy(beforeFinalPage, 4, session, 200), session),
    ).toBe("late");
    expect(
      advanceStudy(emptyStudy, 4, { ...session, late: false }, 201),
    ).toEqual(emptyStudy);
    expect(
      studyCompletion(advanceStudy(beforeFinalPage, 4, session, 199), session),
    ).toBe("on-time");
  });
});
