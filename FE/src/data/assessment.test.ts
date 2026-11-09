import { it, expect } from "vitest";
import { initialData } from "./fixtures";
import type { ExamQuestion } from "./fixtures";
import {
  beginAssessment,
  examTotal,
  isAnswerCorrect,
  shownAnswer,
  submitAssessment,
} from "./assessment";

const exam: ExamQuestion[] = [
  { type: "choice", text: "A", options: ["x", "y"], correct: "1", points: 6 },
  { type: "blank", text: "B", correct: "POST|Tạo", points: 4 },
];
const withExam = {
  ...initialData,
  assignments: initialData.assignments.map((a) => ({ ...a, questions: exam })),
};
it("requires an active attempt and prevents direct URL resubmission beyond the limit", () => {
  const now = Date.parse("2026-10-30T12:00:00");
  expect(() => submitAssessment(withExam, "a1", ["1", "POST"], now)).toThrow(
    /bắt đầu/,
  );
  let d = beginAssessment(withExam, "a1", now);
  expect(d.assessments.a1.draft?.answers).toEqual(["", ""]);
  d = submitAssessment(d, "a1", ["1", "POST"], now + 1000);
  expect(d.assessments.a1.result?.score).toBe(0);
  expect(() => submitAssessment(d, "a1", ["1", "POST"], now + 2000)).toThrow(
    /bắt đầu/,
  );
  d = { ...d, assessments: { a1: { ...d.assessments.a1, attempts: 3 } } };
  expect(() => beginAssessment(d, "a1", now)).toThrow(/lượt/);
});
it("keeps an appealed submission stable until the pending review is resolved", () => {
  const data = {
    ...withExam,
    appeals: [
      {
        id: "appeal",
        assignmentId: "a1",
        question: "Câu 3",
        questionIndex: 2,
        reason: "Xem lại",
        response: "",
        status: "pending" as const,
      },
    ],
  };
  expect(() =>
    beginAssessment(data, "a1", Date.parse("2026-10-30T12:00:00")),
  ).toThrow(/phúc khảo/);
});
it("judges answers only when the key is known", () => {
  expect(isAnswerCorrect(exam[0], "1")).toBe(true);
  expect(isAnswerCorrect(exam[0], "0")).toBe(false);
  expect(isAnswerCorrect(exam[1], " tạo ")).toBe(true);
  expect(isAnswerCorrect({ ...exam[0], correct: undefined }, "1")).toBeNull();
  expect(isAnswerCorrect({ type: "essay", text: "E", points: 1 }, "x")).toBeNull();
});
it("sums the exam and shows the chosen option", () => {
  expect(examTotal(exam)).toBe(10);
  expect(shownAnswer(exam[0], "1")).toBe("B. y");
  expect(shownAnswer(exam[1], "")).toBe("Chưa trả lời");
});
it("blocks a second attempt until answers are released", () => {
  const now=Date.parse("2026-10-30T12:00:00");
  const submitted=submitAssessment(beginAssessment(withExam,"a1",now),"a1",["0","GET"],now+1000);
  expect(()=>beginAssessment(submitted,"a1",now+2000)).toThrow(/công bố đáp án/);
});
it("stores later practice separately and preserves the official submission after close", () => {
  const now=Date.parse("2026-10-30T12:00:00");
  const submitted=submitAssessment(beginAssessment(withExam,"a1",now),"a1",["0","GET"],now+1000);
  const released={...submitted,assignments:submitted.assignments.map(a=>({...a,answersReleased:true}))};
  const practicing=beginAssessment(released,"a1",Date.parse("2099-03-01T12:00:00"));
  expect(practicing.assessments.a1.draft?.mode).toBe("practice");
  const next=submitAssessment(practicing,"a1",["1","POST"],Date.parse("2099-03-01T12:01:00"));
  expect(next.assessments.a1.result).toEqual(submitted.assessments.a1.result);
  expect(next.assessments.a1.attempts).toBe(1);
  expect(next.assessments.a1.practiceResults?.[0].answers).toEqual(["1","POST"]);
});
