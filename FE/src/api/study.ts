import { api } from "./client";
import type { StudyProgress } from "../data/fixtures";

export interface QuizResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  progress: StudyProgress;
}

/** UC-B03: graded by the server; the first answer is the one that counts. */
export const answerQuiz = (sessionId: string, questionId: string, choice: number) =>
  api<QuizResult>(`/api/study-progress/${encodeURIComponent(sessionId)}/answers`, {
    method: "POST",
    body: { questionId, choice },
  });
