import type { Assessment, Assignment, DemoData, ExamQuestion } from "./fixtures";
export const emptyAssessment: Assessment = {
  attempts: 0,
  draft: null,
  result: null,
};
export const assessmentFor = (data: DemoData, id: string) =>
  data.assessments[id] || emptyAssessment;
export const examOf = (assignment?: Assignment): ExamQuestion[] =>
  assignment?.questions ?? [];
export const examTotal = (questions: ExamQuestion[]) =>
  Math.round(questions.reduce((n, q) => n + q.points, 0) * 10) / 10;
export const typeLabel = { choice: "Trắc nghiệm", blank: "Điền trống", essay: "Tự luận" };
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
  const practice=Boolean(r.result && a?.answersReleased);
  if (r.result && !practice) throw Error("Chờ công bố đáp án để luyện tập; lượt tính điểm đã hoàn tất.");
  if (!a || !a.published || (!practice && (now < Date.parse(a.opens) || now >= Date.parse(a.closes))))
    throw Error("Bài tập chưa mở hoặc đã đóng.");
  if (!practice && data.appeals.some(x=>x.assignmentId===id&&x.status==="pending"))
    throw Error("Chờ xử lý phúc khảo trước khi làm bài tập.");
  if (!practice && r.attempts>=1) throw Error("Lượt tính điểm đã hoàn tất.");
  return updateAssessment(data,id,{draft:r.draft || {
    answers:examOf(a).map(()=>""),
    deadline:practice?now+a.minutes*60000:Math.min(now+a.minutes*60000,Date.parse(a.closes)),
    mode:practice?"practice":"official",
  }});
}
/** The score stays 0 until the server answers: the answer key only exists there. */
export function submitAssessment(
  data: DemoData,
  id: string,
  answers: string[],
  now = Date.now(),
): DemoData {
  const a = data.assignments.find((a) => a.id === id),
    r = assessmentFor(data, id);
  if (!a || !r.draft) throw Error("Cần bắt đầu lượt làm hợp lệ trước khi nộp.");
  const result={score:0,answers,submitted:new Date(now).toLocaleString("vi-VN")};
  if(r.result) {
    if(!a.answersReleased) throw Error("Chờ công bố đáp án để luyện tập.");
    return updateAssessment(data,id,{draft:null,practiceResults:[...(r.practiceResults??[]),result]});
  }
  return updateAssessment(data,id,{result,draft:null,attempts:1});
}
export const pointsFor = (result: NonNullable<Assessment["result"]>) =>
  result.questionPoints ?? [];
/** True or false once the key is known; essays and hidden keys have no automatic verdict. */
export function isAnswerCorrect(question: ExamQuestion, answer = "") {
  if (question.type === "essay" || question.correct === undefined) return null;
  if (question.type === "choice") return question.correct === answer;
  const normalize = (v: string) => v.trim().toLowerCase();
  return question.correct.split("|").some((v) => normalize(v) === normalize(answer));
}
export function shownAnswer(question: ExamQuestion, answer = "") {
  if (!answer) return "Chưa trả lời";
  return question.type === "choice"
    ? `${String.fromCharCode(65 + Number(answer))}. ${question.options?.[Number(answer)] ?? ""}`
    : answer;
}
