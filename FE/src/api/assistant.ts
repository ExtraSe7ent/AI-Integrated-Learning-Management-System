import { api } from "./client";
import type { DemoData } from "../data/fixtures";

export const askAssistant = (courseId: string, question: string) =>
  api<DemoData["chat"][number]>("/api/ai/ask", {
    method: "POST",
    body: { courseId, question },
  });
