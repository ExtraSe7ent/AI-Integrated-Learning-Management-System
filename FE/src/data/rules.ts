export const canAdvance = (required: boolean, answered: boolean | undefined) =>
  !required || answered !== undefined;
export const selfStudyGrade = (states: string[]) =>
  states.length
    ? Math.round(
        (states.filter((x) => x === "on-time").length / states.length) * 100,
      ) / 10
    : 0;
export const assignmentAverage = (scores: number[]) =>
  scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;
export const sessionState = (start: number, end: number, now = Date.now()) =>
  now < start ? "scheduled" : now >= end ? "closed" : "open";
export function validateImages(files: { size: number; type: string }[]) {
  if (files.length > 5) return "Chọn tối đa 5 ảnh.";
  if (files.some((f) => !f.type.startsWith("image/")))
    return "Chỉ chấp nhận tệp hình ảnh.";
  if (files.reduce((n, f) => n + f.size, 0) > 5 * 1024 * 1024)
    return "Tổng dung lượng ảnh không được vượt quá 5 MB.";
  return "";
}
export const scoreAnswers = (
  answers: (number | undefined)[],
  correct: number[],
) =>
  Math.round(
    (correct.reduce((n, x, i) => n + (answers[i] === x ? 1 : 0), 0) /
      correct.length) *
      100,
  ) / 10;
