import type { DemoData } from "./fixtures";
import { studyFor, studyCompletion } from "./study";
import { selfStudyGrade, assignmentAverage } from "./rules";
export function learningSummary(data: DemoData) {
  const sessions = data.sessions.filter((s) => s.published),
    assignments = data.assignments.filter((a) => a.published);
  const total = data.lessons.find((l) => l.id === "l2")?.slides?.length || 4;
  const results = assignments.flatMap((a) =>
    data.assessments[a.id]?.result ? [data.assessments[a.id].result!] : [],
  );
  return {
    sessions,
    assignments,
    self: selfStudyGrade(
      sessions.map((s) => studyCompletion(studyFor(data, s.id), s)),
    ),
    average: assignmentAverage([
      ...data.gradeHistory.map((r) => r.score),
      ...results.map((r) => r.score),
    ]),
    progress: sessions.length
      ? Math.round(
          sessions.reduce(
            (n, s) =>
              n + Math.min(100, (studyFor(data, s.id).progress / total) * 100),
            0,
          ) / sessions.length,
        )
      : 0,
  };
}
