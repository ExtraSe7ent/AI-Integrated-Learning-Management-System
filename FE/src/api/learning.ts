import { api } from "./client";
import type { Assessment } from "../data/fixtures";
import type { DeadlineCandidate, ReminderRecord } from "../AI/model";

export interface GeneratedQuestion {
  id: string;
  type: "choice" | "blank";
  page: number;
  title: string;
  options?: string[];
  answer: string;
  explanation: string;
}
export interface PracticeRange {
  courseId: string;
  fromPage?: number;
  toPage?: number;
  round: number;
}
export interface EssayDraft {
  questionIndex: number;
  points: number;
  maxPoints: number;
  feedback: string;
  mode: "ai" | "rubric";
}
export type Submission = Assessment & {
  studentId: string;
  studentName: string;
};

const id = encodeURIComponent;

export const createPractice = (body: PracticeRange) =>
  api<{ mode: "ai" | "bank"; questions: GeneratedQuestion[] }>(
    "/api/ai/practice",
    { method: "POST", body },
  );
export const suggestQuestions = (body: PracticeRange) =>
  api<GeneratedQuestion[]>("/api/ai/question-suggestions", {
    method: "POST",
    body,
  });
export const submissionsOf = (assignmentId: string) =>
  api<Submission[]>(`/api/assessments/${id(assignmentId)}/submissions`);
export const essayDrafts = (assignmentId: string, studentId: string) =>
  api<EssayDraft[]>(
    `/api/assessments/${id(assignmentId)}/essay-drafts?studentId=${id(studentId)}`,
    { method: "POST" },
  );
export const publishGrade = (
  assignmentId: string,
  studentId: string,
  questionPoints: number[],
  comment: string,
) =>
  api<Submission>(`/api/assessments/${id(assignmentId)}`, {
    method: "PUT",
    body: { studentId, result: { questionPoints, approved: true, comment } },
  });
export const reminderCandidates = (at: string) =>
  api<DeadlineCandidate[]>(`/api/reminders/candidates?at=${id(at)}`);
export const scanReminders = (at: string) =>
  api<ReminderRecord[]>(`/api/reminders/scan?at=${id(at)}`, { method: "POST" });
