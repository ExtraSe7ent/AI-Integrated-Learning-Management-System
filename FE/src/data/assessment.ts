import type { Assessment, DemoData } from "./fixtures";
export const emptyAssessment: Assessment = {
  attempts: 0,
  draft: null,
  result: null,
};
export const assessmentFor = (data: DemoData, id: string) =>
  data.assessments[id] || emptyAssessment;
export function updateAssessment(
  data: DemoData,
  id: string,
  change: Partial<Assessment>,
): DemoData {
  return {
    ...data,
    assessments: {
      ...data.assessments,
      [id]: { ...assessmentFor(data, id), ...change },
    },
  };
}
export function beginAssessment(
  data: DemoData,
  id: string,
  now = Date.now(),
): DemoData {
  const a = data.assignments.find((a) => a.id === id),
    r = assessmentFor(data, id);
  if(data.appeals.some(a=>a.assignmentId===id&&a.status==="pending"))throw Error("Chờ xử lý phúc khảo trước khi làm lại bài tập.");
  if (
    !a ||
    !a.published ||
    now < Date.parse(a.opens) ||
    now >= Date.parse(a.closes)
  )
    throw Error("Bài tập chưa mở hoặc đã đóng.");
  if (r.attempts >= a.attempts) throw Error("Đã hết lượt làm bài.");
  return updateAssessment(data, id, {
    draft: r.draft || {
      answers: ["", "", ""],
      deadline: Math.min(now + a.minutes * 60000, Date.parse(a.closes)),
    },
  });
}
export function submitAssessment(
  data: DemoData,
  id: string,
  answers: string[],
  now = Date.now(),
): DemoData {
  const a = data.assignments.find((a) => a.id === id),
    r = assessmentFor(data, id);
  if(data.appeals.some(a=>a.assignmentId===id&&a.status==="pending"))throw Error("Chờ xử lý phúc khảo trước khi làm lại bài tập.");
  if (!a || !r.draft || r.attempts >= a.attempts)
    throw Error("Cần bắt đầu lượt làm hợp lệ trước khi nộp.");
  const score =
    (answers[0] === "0" ? 4 : 0) +
    (answers[1]?.trim().toUpperCase() === "POST" ? 3 : 0);
  return updateAssessment(data, id, {
    result: {
      score,
      answers,
      submitted: new Date(now).toLocaleString("vi-VN"),
    },
    draft: null,
    attempts: r.attempts + 1,
  });
}

export function pointsFor(result: NonNullable<Assessment["result"]>) {
  if (result.questionPoints) return result.questionPoints;
  const first = result.answers[0] === "0" ? 4 : 0,
    second = result.answers[1]?.trim().toUpperCase() === "POST" ? 3 : 0;
  return [
    first,
    second,
    Math.max(0, Math.min(3, result.score - first - second)),
  ];
}
export function regradeQuestion(
  result: NonNullable<Assessment["result"]>,
  index: number,
  score: number,
) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index > 2 ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > [4, 3, 3][index]
  )
    throw Error("Điểm câu không hợp lệ.");
  const questionPoints = pointsFor(result).map((v, i) =>
    i === index ? score : v,
  );
  return {
    ...result,
    questionPoints,
    score: Math.round(questionPoints.reduce((a, b) => a + b, 0) * 10) / 10,
    approved: true,
  };
}
