import { api } from "./client";
import type { DemoData } from "../data/fixtures";

export type LiveState = DemoData["live"];

/** UC-C01: the server makes a new six-digit code each time a session starts. */
export const startLive = (classId: string, questionId: string, seconds: number) =>
  api<LiveState>("/api/live", {
    method: "PUT",
    body: { active: true, classId, questionId, expiresAt: Date.now() + seconds * 1000 },
  });
/** "Đổi câu hỏi": the next question opens with no answers. */
export const showQuestion = (questionId: string, seconds: number) =>
  api<LiveState>("/api/live", {
    method: "PUT",
    body: { questionId, expiresAt: Date.now() + seconds * 1000 },
  });
export const revealLive = () =>
  api<LiveState>("/api/live", { method: "PUT", body: { revealed: true } });
export const stopLive = () =>
  api<LiveState>("/api/live", { method: "PUT", body: { active: false } });

/** UC-C02: the code is checked by the server, which also checks the student belongs to the class. */
export const joinLive = (code: string) =>
  api<LiveState>("/api/live/me", { method: "PUT", body: { join: true, code } });
export const answerLive = (answer: number) =>
  api<LiveState>("/api/live/me", { method: "PUT", body: { join: false, answer } });
