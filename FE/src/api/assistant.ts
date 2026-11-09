import { api } from "./client";
import type { DemoData } from "../data/fixtures";

/** page is the slide being read; the server always includes its passages in the context. */
export const askAssistant = (courseId: string, question: string, page?: number) =>
  api<DemoData["chat"][number]>("/api/ai/ask", {
    method: "POST",
    body: { courseId, question, page },
  });
