import type { DemoData, Session, StudyProgress } from "./fixtures";
export const emptyStudy: StudyProgress = {
  progress: 0,
  answers: {},
  completedAt: null,
};
export const studyFor = (data: DemoData, id: string) =>
  data.studySessions[id] || emptyStudy;
export const studyCompletion = (progress: StudyProgress, session: Session) =>
  !progress.completedAt
    ? "pending"
    : Date.parse(progress.completedAt) < Date.parse(session.closes)
      ? "on-time"
      : "late";
export function advanceStudy(
  progress: StudyProgress,
  page: number,
  session: Session,
  now = Date.now(),
  total = 4,
): StudyProgress {
  if (
    now < Date.parse(session.opens) ||
    (!session.late && now >= Date.parse(session.closes)) ||
    progress.completedAt || page > progress.progress + 1
  )
    return progress;
  return {
    ...progress,
    progress: Math.max(progress.progress, page),
    completedAt: page === total ? new Date(now).toISOString() : null,
  };
}
