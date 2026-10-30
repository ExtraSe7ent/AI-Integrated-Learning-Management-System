import { it, expect } from "vitest";
import { initialData } from "./fixtures";
import { beginAssessment, submitAssessment } from "./assessment";
it("requires an active attempt and prevents direct URL resubmission beyond the limit", () => {
  const now = Date.parse("2026-10-30T12:00:00");
  expect(() =>
    submitAssessment(initialData, "a1", ["0", "POST", ""], now),
  ).toThrow(/bắt đầu/);
  let d = beginAssessment(initialData, "a1", now);
  expect(d.assessments.a1.draft).not.toBeNull();
  d = submitAssessment(d, "a1", ["0", "POST", ""], now + 1000);
  expect(d.assessments.a1.result?.score).toBe(7);
  expect(() =>
    submitAssessment(d, "a1", ["0", "POST", ""], now + 2000),
  ).toThrow(/bắt đầu/);
  d = { ...d, assessments: { a1: { ...d.assessments.a1, attempts: 3 } } };
  expect(() => beginAssessment(d, "a1", now)).toThrow(/lượt/);
});
import { regradeQuestion } from "./assessment";
it("regrades only the appealed question and recalculates the total", () => {
  const r = {
    score: 9.5,
    answers: ["0", "POST", "POST /api/loans"],
    submitted: "now",
    questionPoints: [4, 3, 2.5],
  };
  expect(regradeQuestion(r, 2, 3).score).toBe(10);
  expect(regradeQuestion(r, 2, 3).questionPoints).toEqual([4, 3, 3]);
  expect(() => regradeQuestion(r, 2, 4)).toThrow(/không hợp lệ/);
});
it("keeps an appealed submission stable until the pending review is resolved",()=>{
 const data={...initialData,appeals:[{id:'appeal',assignmentId:'a1',question:'Câu 3',questionIndex:2,reason:'Xem lại',response:'',status:'pending' as const}]};
 expect(()=>beginAssessment(data,'a1',Date.parse('2026-10-30T12:00:00'))).toThrow(/phúc khảo/);
});
